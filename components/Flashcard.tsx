import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VocabCard, SRSGrade } from '../types';
import { Button } from './Button';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

interface FlashcardProps {
  card: VocabCard;
  allCards: VocabCard[];
  onGrade: (card: VocabCard, grade: SRSGrade) => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, allCards, onGrade }) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [status, setStatus] = useState<'idle' | 'result'>('idle');
  const [result, setResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  const options = useMemo(() => {
    const distractors = allCards
      .filter((c) => c.id !== card.id)
      .map((c) => c.definition)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const combined = Array.from(new Set([...distractors, card.definition]));

    return combined.sort(() => 0.5 - Math.random());
  }, [allCards, card]);

  useEffect(() => {
    if (status === 'idle') {
      firstOptionRef.current?.focus();
    }
  }, [status, card]);

  useEffect(() => {
    setSelectedOption('');
    setStatus('idle');
    setResult(null);
  }, [card]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOption) return;

    const isCorrect = selectedOption === card.definition;
    setResult({
      isCorrect,
      feedback: isCorrect ? 'Great job! You chose the correct meaning.' : 'Not quite. Keep practicing!'
    });
    setStatus('result');
  };

  const handleNext = () => {
    if (result?.isCorrect) {
      onGrade(card, SRSGrade.GOOD);
    } else {
      onGrade(card, SRSGrade.AGAIN);
    }

    setSelectedOption('');
    setStatus('idle');
    setResult(null);
  };

  const handleDontKnow = () => {
    setResult({ isCorrect: false, feedback: 'Marked as unknown.' });
    setStatus('result');
  };

  return (
    <div className="w-full max-w-2xl mx-auto perspective-1000">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 min-h-[450px] flex flex-col relative transition-all duration-300">

        {/* Top bar status */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
          <span>HSK 6 Test</span>
          <span className={card.repetition > 0 ? 'text-emerald-600' : 'text-blue-600'}>
             {card.repetition > 0 ? `Review` : 'New Word'}
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
              <p className="text-slate-500 mb-4">Choose the correct meaning:</p>

              <form onSubmit={handleSubmit} className="relative space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {options.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      ref={index === 0 ? firstOptionRef : undefined}
                      onClick={() => setSelectedOption(option)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                        selectedOption === option
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button
                     type="button"
                     variant="ghost"
                     className="flex-1 text-slate-400"
                     onClick={handleDontKnow}
                  >
                    I don't know
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 shadow-md shadow-indigo-200"
                    disabled={!selectedOption}
                  >
                    Check Answer
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
