import React, { useMemo } from 'react';
import { VocabCard, ReviewStats } from '../types';
import { Button } from './Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BookOpen, TrendingUp, Clock, Plus } from 'lucide-react';

interface DashboardProps {
  cards: VocabCard[];
  onStartReview: () => void;
  onLearnNew: () => void;
  isLoadingNew: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  cards, 
  onStartReview, 
  onLearnNew,
  isLoadingNew
}) => {
  const stats: ReviewStats = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Due cards: date is in past or close enough
    const dueCount = cards.filter(c => c.nextReviewDate <= now).length;
    
    // Learned today logic is tricky without history, assuming interval > 0 meant we learned it at some point
    // A simplified metric: Total Learning
    const totalCards = cards.length;

    // Forecast for next 7 days
    const forecast = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now + (i * oneDay);
      const dayEnd = dayStart + oneDay;
      const count = cards.filter(c => c.nextReviewDate >= dayStart && c.nextReviewDate < dayEnd).length;
      return {
        day: i === 0 ? 'Today' : `+${i}d`,
        count: i === 0 ? count + dueCount : count // Include overdue in today
      };
    });

    return {
      totalCards,
      learnedToday: 0, // Placeholder
      dueCount,
      reviewsForecast: forecast
    };
  }, [cards]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">欢迎 Welcome back!</h1>
            <p className="text-slate-500">You have <span className="font-bold text-indigo-600">{stats.dueCount}</span> cards waiting for review today.</p>
        </div>
        <div className="flex gap-4">
           <Button 
            onClick={onLearnNew} 
            variant="secondary" 
            isLoading={isLoadingNew}
            className="shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Learn New
           </Button>
           <Button 
            onClick={onStartReview} 
            disabled={stats.dueCount === 0}
            className="shadow-md shadow-indigo-200"
            size="lg"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Start Review ({stats.dueCount})
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Total Words</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalCards}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Mastery</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {cards.filter(c => c.interval > 21).length} <span className="text-sm font-normal text-slate-400">words > 3 weeks</span>
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Time to Study</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">~{Math.ceil(stats.dueCount * 0.5)} <span className="text-sm font-normal text-slate-400">min</span></p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Review Forecast</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.reviewsForecast}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                hide 
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.reviewsForecast.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#cbd5e1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
