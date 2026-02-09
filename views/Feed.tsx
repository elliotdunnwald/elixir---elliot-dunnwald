import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import BrewLogModal from '../components/BrewLogModal';
import BrewLogDetailModal from '../components/BrewLogDetailModal';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { deleteActivity } from '../lib/database';
import { Users, ArrowRight, Loader2 } from 'lucide-react';
import type { BrewActivity } from '../types';

const FeedView: React.FC = () => {
  const { profile } = useAuth();
  const { activities, loading, error, loadMore, removeActivity } = useActivities({ realtime: true });
  const [editActivity, setEditActivity] = useState<BrewActivity | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'all' | 'brews' | 'cafes'>('all');

  console.log('FeedView render:', { profile, activitiesCount: activities.length, loading, error });

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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em]">GLOBAL FEED</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFeedFilter('all')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'all' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-50 active:bg-black active:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFeedFilter('brews')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'brews' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-50 active:bg-black active:text-white'}`}
            >
              Home Brews
            </button>
            <button
              onClick={() => setFeedFilter('cafes')}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${feedFilter === 'cafes' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-50 active:bg-black active:text-white'}`}
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
            <Link to="/explore" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95 border-2 border-black">
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
                <Loader2 className="w-6 h-6 text-black animate-spin" />
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
