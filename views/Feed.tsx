
import React from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { BrewActivity } from '../types';
import { Users, ArrowRight } from 'lucide-react';

interface FeedViewProps {
  activities: BrewActivity[];
  following: string[];
  discoveredPeers?: any[];
  onDeleteActivity?: (activityId: string) => void;
}

const FeedView: React.FC<FeedViewProps> = ({ activities, following, onDeleteActivity }) => {
  // Show my activities + activities from followed peers that are NOT private
  const filteredActivities = activities.filter(activity => 
    activity.userId === 'me' || (following.includes(activity.userId) && !activity.isPrivate)
  );

  const isEmpty = filteredActivities.length === 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8">GLOBAL FEED</h2>
        {isEmpty ? (
          <div className="py-32 px-10 text-center border-4 border-dashed border-zinc-900 rounded-[4rem] flex flex-col items-center gap-8 animate-in fade-in duration-700">
             <div className="bg-white p-8 rounded-[2.5rem]"><Users className="w-12 h-12 text-black" /></div>
             <div className="space-y-4">
               <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">NETWORK EMPTY</h3>
               <p className="text-zinc-500 text-sm font-black uppercase tracking-widest max-w-xs mx-auto leading-relaxed">LOG A BREW OR SHARE YOUR PROFILE LINK TO START DISCOVERY.</p>
             </div>
             <Link to="/explore" className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95">FIND PEERS <ArrowRight className="w-5 h-5" /></Link>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredActivities.map(activity => <PostCard key={activity.id} activity={activity} onDelete={onDeleteActivity} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedView;
