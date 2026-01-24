
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Share2, MapPin, Award, FlaskConical, Timer, Thermometer, Zap, Lock, Calculator, Heart, Beaker, Trash2 } from 'lucide-react';
import { BrewActivity } from '../types';

interface PostCardProps {
  activity: BrewActivity;
  onDelete?: (activityId: string) => void;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    if (diffInHours < (1/60)) return "JUST NOW";
    if (diffInHours < 1) {
      const mins = Math.max(1, Math.floor(diffInMs / (1000 * 60)));
      return `${mins}M AGO`;
    }
    return `${Math.floor(diffInHours)}H AGO`;
  }
  if (isYesterday) return "YESTERDAY";
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const PostCard: React.FC<PostCardProps> = ({ activity, onDelete }) => {
  const isMe = activity.userId === 'me';
  const isDefaultWhite = !activity.userAvatar;
  const [likes, setLikes] = useState(activity.likeCount);
  const [hasLiked, setHasLiked] = useState(activity.likedBy.includes('me'));

  const handleLike = () => {
    if (isMe) return;
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this brew log? This action cannot be undone.')) {
      onDelete?.(activity.id);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-[3.5rem] border-2 border-zinc-800 transition-all hover:border-white overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-10 flex justify-between items-start">
        <div className="flex gap-5 items-start">
          <Link to={`/profile/${activity.userId}`} className="block shrink-0">
            <div className={`w-16 h-16 rounded-2xl border-2 border-zinc-800 flex items-center justify-center overflow-hidden transition-all ${isDefaultWhite ? 'bg-white text-black' : 'bg-black'}`}>
              {isDefaultWhite ? <Zap className="w-8 h-8" /> : <img src={activity.userAvatar} className="w-full h-full object-cover" alt="" />}
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${activity.userId}`} className="block group">
                <h3 className="font-black text-white uppercase tracking-tight text-xl group-hover:underline transition-colors truncate">{activity.userName}</h3>
              </Link>
              {activity.isPrivate && (
                <span title="Private">
                  <Lock className="w-4 h-4 text-zinc-600" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-[11px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {activity.locationName}
              </p>
              <p className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.25em]">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white text-black px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
          <Award className="w-6 h-6 fill-black" />
          <span className="text-3xl font-black tracking-tighter leading-none">{activity.rating.toFixed(1)}</span>
        </div>
      </div>

      {activity.imageUrl && (
        <div className="px-10 pb-8">
          <div className="w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden border-2 border-zinc-800 shadow-inner group relative">
            <img src={activity.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Brew session" />
          </div>
        </div>
      )}

      <div className="px-10 pb-10">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">{activity.title}</h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-white text-[13px] font-black uppercase tracking-[0.3em] border-2 border-zinc-800 px-3 py-1 rounded-lg">{activity.roaster}</p>
            <p className="text-zinc-400 text-[13px] font-black uppercase tracking-[0.3em]">{activity.beanOrigin}</p>
          </div>
          {(activity.estate || activity.varietal || activity.process) && (
            <div className="flex flex-wrap gap-3 mt-4">
              {activity.estate && <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded">ESTATE: {activity.estate}</span>}
              {activity.varietal && <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded">VARIETAL: {activity.varietal}</span>}
              {activity.process && <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-zinc-800/50 px-2 py-1 rounded">PROCESS: {activity.process}</span>}
            </div>
          )}
        </div>

        {activity.showParameters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-black border-2 border-zinc-800 p-8 rounded-[2.5rem]">
            <div className="space-y-2">
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-4 h-4" /> FORMULA</p>
               <p className="text-sm font-black text-white">{activity.gramsIn}G / {activity.gramsOut}G</p>
            </div>
            <div className="space-y-2">
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4" /> GEAR</p>
               <p className="text-sm font-black text-white uppercase truncate">{activity.brewer}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Timer className="w-4 h-4" /> TIME</p>
               <p className="text-sm font-black text-white">{activity.brewTime}</p>
            </div>
            <div className="space-y-2">
               <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Thermometer className="w-4 h-4" /> TEMP</p>
               <p className="text-sm font-black text-white">{activity.temperature}°{activity.tempUnit || 'C'}</p>
            </div>
          </div>
        )}

        {(activity.eyPercentage || activity.brewWeight) ? (
          <div className="mb-8 flex flex-wrap gap-4">
             {activity.brewWeight && (
                <div className="bg-zinc-800 px-4 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Beaker className="w-2 h-2" /> BREW WEIGHT</p>
                  <p className="text-xs font-black text-white">{activity.brewWeight}G</p>
                </div>
             )}
             {activity.tds ? (
                <div className="bg-zinc-800 px-4 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">TDS</p>
                  <p className="text-xs font-black text-white">{activity.tds}</p>
                </div>
             ) : null}
             {activity.eyPercentage ? (
                <div className="bg-white text-black px-4 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">EXT YIELD</p>
                  <p className="text-xs font-black">{activity.eyPercentage}%</p>
                </div>
             ) : null}
          </div>
        ) : null}
        
        {activity.description && <p className="text-zinc-400 text-base mb-10 font-black uppercase tracking-widest leading-relaxed border-l-4 border-zinc-800 pl-6 italic">"{activity.description}"</p>}
        
        <div className="flex items-center gap-10 pt-8 border-t-2 border-zinc-800">
          <button
            onClick={handleLike}
            disabled={isMe}
            className={`flex items-center gap-3 transition-all ${isMe ? 'text-zinc-800 cursor-not-allowed' : (hasLiked ? 'text-white' : 'text-zinc-600 hover:text-white')}`}
          >
            <Heart className={`w-6 h-6 transition-transform ${hasLiked ? 'fill-white scale-110' : ''}`} />
            <span className="text-[12px] font-black uppercase tracking-widest">{likes}</span>
          </button>
          <button className="flex items-center gap-3 text-zinc-600 hover:text-white transition-all">
            <MessageCircle className="w-6 h-6" />
            <span className="text-[12px] font-black uppercase tracking-widest">{activity.comments.length}</span>
          </button>
          <button className="flex items-center gap-3 text-zinc-600 hover:text-white transition-all ml-auto">
            <Share2 className="w-6 h-6" />
            <span className="text-[12px] font-black uppercase tracking-widest">SHARE</span>
          </button>
          {isMe && onDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-3 text-zinc-600 hover:text-red-500 transition-all"
              title="Delete this post"
            >
              <Trash2 className="w-6 h-6" />
              <span className="text-[12px] font-black uppercase tracking-widest">DELETE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
