import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import BrewLogModal from '../components/BrewLogModal';
import BrewLogDetailModal from '../components/BrewLogDetailModal';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { deleteActivity } from '../lib/database';
import { Users, ArrowRight, Loader2, Zap } from 'lucide-react';
import type { BrewActivity } from '../types';

// Calculate caffeine content based on brew method and grams
const calculateCaffeine = (activity: BrewActivity): number => {
  const gramsIn = activity.gramsIn || 0;

  // Caffeine content varies by brew method
  // Approximate: 8-12mg caffeine per gram of coffee
  const caffeinePerGram = activity.brewType === 'espresso' ? 10 : 8;

  return Math.round(gramsIn * caffeinePerGram);
};

const FeedView: React.FC = () => {
  const { profile } = useAuth();
  const { activities, loading, error, loadMore, removeActivity } = useActivities({ realtime: true });
  const [editActivity, setEditActivity] = useState<BrewActivity | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | 'brews' | 'cafes'>('all');

  console.log('FeedView render:', { profile, activitiesCount: activities.length, loading, error });

  // Calculate today's caffeine intake
  const todayCaffeine = useMemo(() => {
    if (!profile) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities
      .filter(activity => {
        // Only count user's own brews, not cafe logs
        if (activity.userId !== profile.id || activity.isCafeLog) return false;

        const activityDate = new Date(activity.timestamp);
        activityDate.setHours(0, 0, 0, 0);

        return activityDate.getTime() === today.getTime();
      })
      .reduce((total, activity) => total + calculateCaffeine(activity), 0);
  }, [activities, profile]);

  // Filter activities based on selection
  const filteredActivities = activities.filter(activity => {
    if (feedFilter === 'all') return true;
    if (feedFilter === 'brews') return !activity.isCafeLog;
    if (feedFilter === 'cafes') return activity.isCafeLog;
    return true;
  });

  const handleDelete = async (activityId: string) => {
    const success = await deleteActivity(activityId);
    if (success) {
      removeActivity(activityId);
    }
  };

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const isEmpty = filteredActivities.length === 0 && !loading;

  if (loading && activities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="py-32 px-10 text-center border-4 border-dashed border-red-900 rounded-[4rem]">
          <p className="text-red-400 text-sm font-black uppercase tracking-widest">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 sm:pb-0">
      <div className="mb-12">
        {/* Caffeine Tracker */}
        {profile && todayCaffeine > 0 && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 sm:p-3 rounded-xl border-2 border-amber-300">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-amber-800 uppercase tracking-widest">Today's Caffeine</p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tighter">{todayCaffeine}mg</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] sm:text-[9px] font-black text-amber-700 uppercase tracking-wider">
                  {todayCaffeine < 200 ? 'Light Day' : todayCaffeine < 400 ? 'Moderate' : 'Caffeinated!'}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-amber-600 mt-1">
                  {Math.round((todayCaffeine / 400) * 100)}% of daily limit
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em]">GLOBAL FEED</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFeedFilter('all')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'all' ? 'bg-white text-black border-white' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-600 active:border-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFeedFilter('brews')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'brews' ? 'bg-white text-black border-white' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-600 active:border-white'}`}
            >
              Home Brews
            </button>
            <button
              onClick={() => setFeedFilter('cafes')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'cafes' ? 'bg-white text-black border-white' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-600 active:border-white'}`}
            >
              Cafes
            </button>
          </div>
        </div>
        {isEmpty ? (
          <div className="py-32 px-10 text-center border-4 border-dashed border-zinc-900 rounded-[4rem] flex flex-col items-center gap-8 animate-in fade-in duration-700">
            <div className="bg-white p-8 rounded-[2.5rem]"><Users className="w-12 h-12 text-black" /></div>
            <div className="space-y-4">
              <h3 className="text-5xl font-black text-black uppercase tracking-tighter leading-none">FEED EMPTY</h3>
              <p className="text-zinc-900 text-sm font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                LOG A BREW OR FOLLOW OTHERS TO SEE THEIR POSTS HERE.
              </p>
            </div>
            <Link to="/explore" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95">
              FIND PEOPLE <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredActivities.map(activity => (
              <PostCard
                key={activity.id}
                activity={activity}
                onEdit={setEditActivity}
                onDelete={handleDelete}
                onClick={() => setSelectedActivityId(activity.id)}
              />
            ))}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <BrewLogModal
        isOpen={!!editActivity}
        onClose={() => setEditActivity(null)}
        editActivity={editActivity}
      />
      {selectedActivityId && (
        <BrewLogDetailModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
          onEdit={setEditActivity}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default FeedView;
