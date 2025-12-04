import React, { useState, useRef, useEffect } from 'react';
import { VocabCard, SRSGrade } from '../types';
import { Button } from './Button';
import { checkMeaning } from '../services/geminiService';
import { Send, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface FlashcardProps {
  card: VocabCard;
  onGrade: (card: VocabCard, grade: SRSGrade) => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, onGrade }) => {
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'result'>('idle');
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'idle') {
      inputRef.current?.focus();
    }
  }, [status, card]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answer.trim()) return;

    setStatus('checking');
    
    const verification = await checkMeaning(card.hanzi, card.definition, answer);
    setResult(verification);
    setStatus('result');
  };

  const handleNext = () => {
    if (result?.isCorrect) {
      onGrade(card, SRSGrade.GOOD);
    } else {
      onGrade(card, SRSGrade.AGAIN);
    }
    // Reset state for next card (React key in parent handles the actual unmount/remount usually, but safe to reset)
    setAnswer('');
    setStatus('idle');
    setResult(null);
  };

  const handleDontKnow = () => {
    setResult({ isCorrect: false, feedback: "Marked as unknown." });
    setStatus('result');
  };

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 min-h-[450px] flex flex-col relative transition-all duration-300">
        
        {/* Top bar status */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>HSK 6 Test</span>
          <span className={card.repetition > 0 ? "text-emerald-600" : "text-blue-600"}>
             {card.repetition > 0 ? `Review` : "New Word"}
          </span>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          
          {/* The Word */}
          <div className="mb-8 w-full">
            <h2 className="text-6xl md:text-7xl font-chinese text-slate-800 mb-2">{card.hanzi}</h2>
            {status === 'result' && (
               <p className="text-xl text-indigo-600 font-medium animate-in fade-in slide-in-from-top-2">{card.pinyin}</p>
            )}
          </div>

          {/* Interaction Zone */}
          {status !== 'result' ? (
            <div className="w-full max-w-md space-y-4">
              <p className="text-slate-500 mb-4">What does this word mean?</p>
              
              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type English meaning..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg text-center"
                  disabled={status === 'checking'}
                />
                <div className="mt-4 flex gap-3">
                  <Button 
                     type="button" 
                     variant="ghost" 
                     className="flex-1 text-slate-400" 
                     onClick={handleDontKnow}
                     disabled={status === 'checking'}
                  >
                    I don't know
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 shadow-md shadow-indigo-200"
                    isLoading={status === 'checking'}
                    disabled={!answer.trim()}
                  >
                    {status === 'checking' ? 'Checking...' : 'Check Answer'}
                    {!status && <Send className="w-4 h-4 ml-2" />}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="w-full max-w-lg text-left animate-in fade-in slide-in-from-bottom-8 duration-500">
              
              {/* Result Feedback */}
              <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${result?.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                {result?.isCorrect ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <XCircle className="w-6 h-6 shrink-0" />}
                <div>
                  <h3 className="font-bold">{result?.isCorrect ? 'Correct!' : 'Incorrect / Unknown'}</h3>
                  <p className="text-sm opacity-90">{result?.feedback}</p>
                  {!result?.isCorrect && (
                      <p className="mt-2 text-xs font-mono bg-white/50 p-1 rounded inline-block">
                         Will be rehearsed soon.
                      </p>
                  )}
                  {result?.isCorrect && (
                      <p className="mt-2 text-xs font-mono bg-white/50 p-1 rounded inline-block">
                         Review again in ~7 days.
                      </p>
                  )}
                </div>
              </div>

              {/* Correct Details */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Definition</span>
                    <p className="text-lg text-slate-900 font-medium">{card.definition}</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Example</span>
                    <p className="text-lg font-chinese text-slate-700">{card.exampleSentence}</p>
                    <p className="text-slate-500 italic text-sm">{card.exampleTranslation}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action for Result */}
        {status === 'result' && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in fade-in duration-300">
            <Button onClick={handleNext} className="w-full py-4 text-lg shadow-sm" size="lg" autoFocus>
              Continue <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};