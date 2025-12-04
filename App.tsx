import React, { useState, useEffect } from 'react';
import { VocabCard, AppView, SRSGrade } from './types';
import { Dashboard } from './components/Dashboard';
import { Flashcard } from './components/Flashcard';
import { generateVocabBatch } from './services/geminiService';
import { calculateReview } from './services/srsService';
import { getInitialHSK6Cards } from './services/hskData';
import { Button } from './components/Button';
import { LogOut } from 'lucide-react';

const STORAGE_KEY = 'hsk6-srs-data-v2'; // Updated key to avoid conflicts with old structure

const App: React.FC = () => {
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [view, setView] = useState<AppView>('dashboard');
  const [sessionQueue, setSessionQueue] = useState<VocabCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isLoadingNew, setIsLoadingNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load data on mount or initialize with Seed Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
            setCards(parsed);
            return;
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    
    // If no saved data, load the static HSK 6 list
    setCards(getInitialHSK6Cards());
  }, []);

  // Save data on change
  useEffect(() => {
    if (cards.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  const handleStartReview = () => {
    const now = Date.now();
    // Filter cards due now
    const due = cards.filter(c => c.nextReviewDate <= now).sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    
    if (due.length === 0) {
      alert("No cards due right now!");
      return;
    }

    setSessionQueue(due);
    setCurrentCardIndex(0);
    setView('review');
  };

  const handleLearnNew = async () => {
    setIsLoadingNew(true);
    setErrorMsg(null);
    try {
        const existingWords = cards.map(c => c.hanzi);
        const newCards = await generateVocabBatch(existingWords, 5);
        setCards(prev => [...prev, ...newCards]);
        
        if (window.confirm(`Generated ${newCards.length} new words! Do you want to study them now?`)) {
             setSessionQueue(newCards);
             setCurrentCardIndex(0);
             setView('review');
        }
    } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to generate words. Please check your API Quota or network.");
    } finally {
        setIsLoadingNew(false);
    }
  };

  const handleGradeCard = (card: VocabCard, grade: SRSGrade) => {
    const updatedFields = calculateReview(card, grade);
    const updatedCard = { ...card, ...updatedFields };

    // Update main state
    setCards(prev => prev.map(c => c.id === card.id ? updatedCard : c));

    // Queue logic for specific session behavior
    if (grade === SRSGrade.AGAIN) {
        // If failed, re-queue at end of current session to enforce learning
        setSessionQueue(prev => [...prev, updatedCard]);
    }

    // Move to next
    if (currentCardIndex < sessionQueue.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
    } else {
        // Check if we just finished the last one in the queue
        // Because we might have added cards to the end (re-queue), the length changes dynamically.
        const nextIndex = currentCardIndex + 1;
        if (nextIndex >= sessionQueue.length) {
            alert("Session Complete!");
            setView('dashboard');
            setSessionQueue([]);
        } else {
             setCurrentCardIndex(nextIndex);
        }
    }
  };

  const handleReset = () => {
    if(window.confirm("Are you sure you want to reset all progress and reload the default word list?")) {
      localStorage.removeItem(STORAGE_KEY);
      setCards(getInitialHSK6Cards());
      setView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setView('dashboard')}
            >
                <div className="bg-indigo-600 text-white p-1.5 rounded-md">
                    <span className="font-chinese font-bold text-lg">六</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-800">HSK 6 Master</span>
            </div>
            
            <div className="flex items-center gap-4">
                {view !== 'dashboard' && (
                    <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>
                        Exit Study
                    </Button>
                )}
                <button onClick={handleReset} className="text-slate-400 hover:text-red-500 transition-colors" title="Reset Data">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {errorMsg && (
             <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100 flex justify-between items-center">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg(null)} className="font-bold">&times;</button>
             </div>
        )}

        {view === 'dashboard' && (
          <Dashboard 
            cards={cards} 
            onStartReview={handleStartReview} 
            onLearnNew={handleLearnNew}
            isLoadingNew={isLoadingNew}
          />
        )}

        {view === 'review' && sessionQueue.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-4 text-sm text-slate-500 max-w-2xl px-2">
                <span>Session Progress</span>
                <span>{currentCardIndex + 1} / {sessionQueue.length}</span>
            </div>
            <div className="w-full max-w-2xl bg-slate-200 h-1.5 rounded-full mb-8 overflow-hidden">
                <div 
                    className="bg-indigo-600 h-full transition-all duration-300" 
                    style={{ width: `${((currentCardIndex + 1) / sessionQueue.length) * 100}%` }}
                />
            </div>

            {sessionQueue[currentCardIndex] && (
                <Flashcard 
                    key={`${sessionQueue[currentCardIndex].id}-${currentCardIndex}`} 
                    card={sessionQueue[currentCardIndex]} 
                    onGrade={handleGradeCard} 
                />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;