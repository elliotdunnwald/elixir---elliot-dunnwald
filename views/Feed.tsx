import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { useActivities } from '../hooks/useActivities';
import { useAuth } from '../hooks/useAuth';
import { Users, ArrowRight, Loader2 } from 'lucide-react';

const FeedView: React.FC = () => {
  const { profile } = useAuth();
  const { activities, loading, error, loadMore } = useActivities({ realtime: true });

  console.log('FeedView render:', { profile, activitiesCount: activities.length, loading, error });

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

  const isEmpty = activities.length === 0 && !loading;

  if (loading && activities.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
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
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="text-[11px] font-black text-zinc-100 uppercase tracking-[0.4em] mb-8">GLOBAL FEED</h2>
        {isEmpty ? (
          <div className="py-32 px-10 text-center border-4 border-dashed border-zinc-900 rounded-[4rem] flex flex-col items-center gap-8 animate-in fade-in duration-700">
            <div className="bg-white p-8 rounded-[2.5rem]"><Users className="w-12 h-12 text-black" /></div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">FEED EMPTY</h3>
              <p className="text-zinc-100 text-sm font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                LOG A BREW OR FOLLOW OTHERS TO SEE THEIR POSTS HERE.
              </p>
            </div>
            <Link to="/explore" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95">
              FIND PEOPLE <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {activities.map(activity => (
              <PostCard key={activity.id} activity={activity} />
            ))}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-zinc-200 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedView;
