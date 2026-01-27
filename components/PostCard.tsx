import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Share2, MapPin, Award, FlaskConical, Timer, Thermometer, Zap, Lock, Calculator, Heart, Beaker, Trash2, Send, X, Edit3 } from 'lucide-react';
import { BrewActivity } from '../types';
import { useAuth } from '../hooks/useAuth';
import { toggleLike, addComment } from '../lib/database';

interface PostCardProps {
  activity: BrewActivity;
  onDelete?: (activityId: string) => void;
  onEdit?: (activity: BrewActivity) => void;
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

const PostCard: React.FC<PostCardProps> = ({ activity, onDelete, onEdit }) => {
  const { profile } = useAuth();
  const isMe = profile?.id === activity.userId;
  const isDefaultWhite = !activity.userAvatar;

  const [likes, setLikes] = useState(activity.likeCount);
  const [hasLiked, setHasLiked] = useState(activity.likedBy.includes(profile?.id || ''));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleLike = async () => {
    if (isMe || !profile) return;

    // Optimistic UI update
    const previousLiked = hasLiked;
    const previousLikes = likes;

    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }

    // Persist to database
    const success = await toggleLike(activity.id, profile.id);

    // Revert on failure
    if (!success) {
      setHasLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !profile) return;

    setSubmittingComment(true);
    try {
      const success = await addComment(activity.id, profile.id, commentText.trim());
      if (success) {
        setCommentText('');
        // Real-time subscription will update comments
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this brew log? This action cannot be undone.')) {
      onDelete?.(activity.id);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-[3.5rem] border-2 border-zinc-800 transition-all hover:border-zinc-600 overflow-hidden shadow-2xl shadow-white/5 animate-in fade-in duration-500">
      <div className="p-10 flex justify-between items-start">
        <div className="flex gap-5 items-start">
          <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block shrink-0">
            <div className={`w-16 h-16 rounded-2xl border-2 transition-all hover:border-white ${isDefaultWhite ? 'bg-white text-black border-white' : 'bg-black border-zinc-700'}`}>
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                {isDefaultWhite ? <Zap className="w-8 h-8" /> : <img src={activity.userAvatar} className="w-full h-full object-cover" alt="" />}
              </div>
            </div>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block group">
                <h3 className="font-black text-white uppercase tracking-tight text-xl group-hover:underline transition-colors truncate">{activity.userName}</h3>
              </Link>
              {activity.isPrivate && (
                <span title="Private">
                  <Lock className="w-4 h-4 text-zinc-200" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-[11px] text-zinc-100 uppercase font-black tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {activity.locationName}
              </p>
              <p className="text-[9px] text-zinc-200 uppercase font-black tracking-[0.25em]">
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
          <div className="w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden border-2 border-zinc-700 hover:border-zinc-600 shadow-inner shadow-white/5 group relative transition-all">
            <img src={activity.imageUrl} className="w-full h-full object-cover transition-all duration-700" alt="Brew session" />
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
            <div className="flex flex-wrap gap-3 mt-4 max-w-full">
              {activity.estate && <span className="text-zinc-200 text-[10px] font-black uppercase tracking-widest border-2 border-zinc-800 px-2 py-1 rounded-lg whitespace-nowrap">ESTATE: {activity.estate}</span>}
              {activity.varietal && <span className="text-zinc-200 text-[10px] font-black uppercase tracking-widest border-2 border-zinc-800 px-2 py-1 rounded-lg whitespace-nowrap">VARIETAL: {activity.varietal}</span>}
              {activity.process && <span className="text-zinc-200 text-[10px] font-black uppercase tracking-widest border-2 border-zinc-800 px-2 py-1 rounded-lg whitespace-nowrap">PROCESS: {activity.process}</span>}
            </div>
          )}
        </div>

        {activity.showParameters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 bg-black border-2 border-zinc-800 p-8 rounded-[2.5rem]">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-4 h-4" /> FORMULA</p>
              <p className="text-sm font-black text-white">{activity.gramsIn}G / {activity.gramsOut}G</p>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4" /> GEAR</p>
              <p className="text-sm font-black text-white uppercase truncate">{activity.brewer}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2"><Timer className="w-4 h-4" /> TIME</p>
              <p className="text-sm font-black text-white">{activity.brewTime}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2"><Thermometer className="w-4 h-4" /> TEMP</p>
              <p className="text-sm font-black text-white whitespace-nowrap">{activity.temperature}°{activity.tempUnit || 'C'}</p>
            </div>
          </div>
        )}

        {activity.eyPercentage ? (
          <div className="mb-8 flex flex-wrap gap-4">
            {activity.tds ? (
              <div className="bg-zinc-800 px-4 py-2 rounded-xl">
                <p className="text-[8px] font-black text-zinc-100 uppercase tracking-widest mb-1">TDS</p>
                <p className="text-xs font-black text-white">{activity.tds}</p>
              </div>
            ) : null}
            <div className="bg-white text-black px-4 py-2 rounded-xl">
              <p className="text-[8px] font-black text-zinc-100 uppercase tracking-widest mb-1">EXT YIELD</p>
              <p className="text-xs font-black">{activity.eyPercentage}%</p>
            </div>
          </div>
        ) : null}

        {activity.description && <p className="text-zinc-400 text-base mb-10 font-black uppercase tracking-widest leading-relaxed border-l-4 border-zinc-800 pl-6 italic">"{activity.description}"</p>}

        <div className="flex items-center gap-3 pt-8 border-t-2 border-zinc-800">
          <button
            onClick={handleLike}
            disabled={isMe}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${isMe ? 'text-zinc-700 border-zinc-800 cursor-not-allowed' : (hasLiked ? 'text-white border-white bg-white/10' : 'text-zinc-100 border-zinc-800 hover:text-white hover:border-zinc-600')}`}
          >
            <Heart className={`w-5 h-5 transition-transform ${hasLiked ? 'fill-white scale-110' : ''}`} />
            <span className="text-[11px] font-black uppercase tracking-widest">{likes}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${showComments ? 'text-white border-white bg-white/10' : 'text-zinc-100 border-zinc-800 hover:text-white hover:border-zinc-600'}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest">{activity.comments.length}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-100 border-zinc-800 hover:text-white hover:border-zinc-600 transition-all ml-auto">
            <Share2 className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">SHARE</span>
          </button>
          {isMe && onEdit && (
            <button
              onClick={() => onEdit(activity)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-100 border-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
              title="Edit this post"
            >
              <Edit3 className="w-5 h-5" />
              <span className="text-[12px] font-black uppercase tracking-widest">EDIT</span>
            </button>
          )}
          {isMe && onDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-100 border-zinc-800 hover:text-red-500 hover:border-red-900 transition-all"
              title="Delete this post"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[12px] font-black uppercase tracking-widest">DELETE</span>
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-8 pt-8 border-t-2 border-zinc-800 space-y-6 animate-in fade-in duration-300">
            {activity.comments.length > 0 && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {activity.comments.map(comment => (
                  <div key={comment.id} className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-white text-sm uppercase tracking-tight">{comment.userName}</p>
                      <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest">
                        {formatTimestamp(comment.timestamp)}
                      </p>
                    </div>
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-wide leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="ADD A COMMENT..."
                disabled={submittingComment}
                className="flex-grow bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase placeholder:text-zinc-700 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="bg-white text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-700 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
