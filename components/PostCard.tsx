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
  onClick?: () => void;
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

const PostCard: React.FC<PostCardProps> = ({ activity, onDelete, onEdit, onClick }) => {
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
    <div
      className="bg-white rounded-[2rem] sm:rounded-[3.5rem] border-2 border-black transition-all hover:border-black overflow-hidden shadow-2xl shadow-black/5 animate-in fade-in duration-500 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5 sm:p-10 flex justify-between items-start gap-3">
        <div className="flex gap-3 sm:gap-5 items-start flex-1 min-w-0">
          <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block shrink-0" onClick={(e) => e.stopPropagation()}>
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 transition-all hover:border-black overflow-hidden ${isDefaultWhite ? 'bg-white text-black border-black' : 'bg-zinc-50 border-black'}`}>
              <div className="w-full h-full flex items-center justify-center">
                {isDefaultWhite ? <Zap className="w-6 h-6 sm:w-8 sm:h-8" /> : <img src={activity.userAvatar} className="w-full h-full object-cover" alt="" />}
              </div>
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block group" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-black text-black uppercase tracking-tight text-base sm:text-xl group-hover:underline transition-colors truncate">{activity.userName}</h3>
              </Link>
              {activity.isPrivate && (
                <span title="Private">
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 sm:gap-1 mt-1">
              <p className="text-[10px] sm:text-[11px] text-black uppercase font-black tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {activity.locationName}
              </p>
              <p className="text-[9px] sm:text-[10px] text-black uppercase font-black tracking-[0.25em]">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white text-black px-3 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-black flex items-center gap-1.5 sm:gap-3 shadow-2xl shrink-0">
          <Award className="w-4 h-4 sm:w-6 sm:h-6 fill-black" />
          <span className="text-xl sm:text-3xl font-black tracking-tighter leading-none">{activity.rating.toFixed(1)}</span>
        </div>
      </div>

      {activity.imageUrl && (
        <div className="px-5 pb-5 sm:px-10 sm:pb-8">
          <div className="w-full aspect-[16/9] rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-2 border-black hover:border-black shadow-inner shadow-black/5 group relative transition-all">
            <img src={activity.imageUrl} className="w-full h-full object-cover transition-all duration-700" alt="Brew session" />
          </div>
        </div>
      )}

      <div className="px-5 pb-5 sm:px-10 sm:pb-10">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tighter uppercase leading-none mb-3 sm:mb-4">{activity.title}</h2>

          {/* Coffee Details Box */}
          <div className="bg-zinc-50 border-2 border-black rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Brewer (Cafe logs only) */}
              {activity.isCafeLog && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Brewer</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.brewer}</p>
                </div>
              )}

              {/* Roaster */}
              {activity.roaster &&
               (!activity.isCafeLog ||
                (activity.roaster.trim().toUpperCase() !== activity.title.trim().toUpperCase() && activity.roaster !== 'CAFE')) && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Roaster</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.roaster}</p>
                </div>
              )}

              {/* Origin */}
              {activity.beanOrigin && activity.beanOrigin !== 'UNKNOWN' && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Origin</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.beanOrigin}</p>
                </div>
              )}

              {/* Estate */}
              {activity.estate && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Estate</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.estate}</p>
                </div>
              )}

              {/* Producer */}
              {activity.producer && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Producer</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.producer}</p>
                </div>
              )}

              {/* Varietal */}
              {activity.varietal && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Varietal</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.varietal}</p>
                </div>
              )}

              {/* Process */}
              {activity.process && (
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">Process</p>
                  <p className="text-xs sm:text-sm font-black text-black uppercase">{activity.process}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {activity.showParameters && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 bg-zinc-50 border-2 border-black p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem]">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5"><FlaskConical className="w-3 h-3 sm:w-4 sm:h-4" /> RECIPE</p>
              <p className="text-xs sm:text-sm font-black text-black">{activity.gramsIn}G / {activity.gramsOut}G</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5">RATIO</p>
              <p className="text-xs sm:text-sm font-black text-black">{activity.ratio}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 sm:w-4 sm:h-4" /> GEAR</p>
              <p className="text-xs sm:text-sm font-black text-black uppercase truncate">{activity.brewer}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5"><Timer className="w-3 h-3 sm:w-4 sm:h-4" /> TIME</p>
              <p className="text-xs sm:text-sm font-black text-black">{activity.brewTime}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-1.5"><Thermometer className="w-3 h-3 sm:w-4 sm:h-4" /> TEMP</p>
              <p className="text-xs sm:text-sm font-black text-black whitespace-nowrap">{activity.temperature}°{activity.tempUnit || 'C'}</p>
            </div>
          </div>
        )}

        {activity.eyPercentage ? (
          <div className="mb-6 sm:mb-8 flex flex-wrap gap-3 sm:gap-4">
            {activity.tds ? (
              <div className="bg-zinc-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border-2 border-black">
                <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">TDS</p>
                <p className="text-[10px] sm:text-xs font-black text-black">{activity.tds}</p>
              </div>
            ) : null}
            <div className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl">
              <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest mb-0.5 sm:mb-1">EXT YIELD</p>
              <p className="text-[10px] sm:text-xs font-black">{activity.eyPercentage}%</p>
            </div>
          </div>
        ) : null}

        {activity.description && <p className="text-black text-sm sm:text-base mb-6 sm:mb-10 font-black uppercase tracking-wide leading-relaxed border-l-4 border-black pl-4 sm:pl-6">{activity.description}</p>}

        <div className="flex items-center gap-2 sm:gap-3 pt-5 sm:pt-8 border-t-2 border-black" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            disabled={isMe}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all ${isMe ? 'text-black border-zinc-300 cursor-not-allowed' : (hasLiked ? 'text-black border-black bg-black/10' : 'text-black border-zinc-300 hover:text-black hover:border-black active:text-black active:border-black')}`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${hasLiked ? 'fill-white scale-110' : ''}`} />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{likes}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all ${showComments ? 'text-black border-black bg-black/10' : 'text-black border-zinc-300 hover:text-black hover:border-black active:text-black active:border-black'}`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{activity.comments.length}</span>
          </button>
          <button onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 text-black border-zinc-300 hover:text-black hover:border-black active:text-black active:border-black transition-all ml-auto">
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest hidden sm:inline">SHARE</span>
          </button>
          {isMe && onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(activity); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 text-black border-zinc-300 hover:text-black hover:border-black active:text-black active:border-black transition-all"
              title="Edit this post"
            >
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest hidden sm:inline">EDIT</span>
            </button>
          )}
          {isMe && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border-2 text-black border-zinc-300 hover:text-red-500 hover:border-red-900 active:text-red-500 active:border-red-900 transition-all"
              title="Delete this post"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest hidden sm:inline">DELETE</span>
            </button>
          )}
        </div>

        {showComments && (
          <div className="mt-5 sm:mt-8 pt-5 sm:pt-8 border-t-2 border-black space-y-4 sm:space-y-6 animate-in fade-in duration-300">
            {activity.comments.length > 0 && (
              <div className="space-y-3 sm:space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {activity.comments.map(comment => (
                  <div key={comment.id} className="bg-zinc-50 border-2 border-black rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="font-black text-black text-xs sm:text-sm uppercase tracking-tight">{comment.userName}</p>
                      <p className="text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest">
                        {formatTimestamp(comment.timestamp)}
                      </p>
                    </div>
                    <p className="text-black text-xs sm:text-sm font-bold uppercase tracking-wide leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="ADD A COMMENT..."
                disabled={submittingComment}
                className="flex-grow bg-zinc-50 border-2 border-black rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-black font-black text-xs sm:text-sm outline-none focus:border-black uppercase placeholder:text-black disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submittingComment}
                className="bg-white text-black px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:bg-zinc-100 disabled:text-black flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;
