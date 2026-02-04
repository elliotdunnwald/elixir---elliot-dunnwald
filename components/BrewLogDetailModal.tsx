import React, { useState, useEffect } from 'react';
import { X, MapPin, Award, FlaskConical, Timer, Thermometer, Zap, Heart, MessageCircle, Share2, Lock, Edit3, Trash2, Send, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrewActivity } from '../types';
import { useAuth } from '../hooks/useAuth';
import { toggleLike, addComment, getActivityById } from '../lib/database';

interface BrewLogDetailModalProps {
  activityId: string;
  onClose: () => void;
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

const BrewLogDetailModal: React.FC<BrewLogDetailModalProps> = ({ activityId, onClose, onDelete, onEdit }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<BrewActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [activityId]);

  const loadActivity = async () => {
    setLoading(true);
    const data = await getActivityById(activityId);
    if (data) {
      setActivity(data);
      setLikes(data.likeCount);
      setHasLiked(data.likedBy.includes(profile?.id || ''));
    }
    setLoading(false);
  };

  const handleLike = async () => {
    if (!activity || !profile || activity.userId === profile.id) return;

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
    if (!commentText.trim() || !profile || !activity) return;

    setSubmittingComment(true);
    try {
      const success = await addComment(activity.id, profile.id, commentText.trim());
      if (success) {
        setCommentText('');
        // Reload activity to get updated comments
        await loadActivity();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this brew log? This action cannot be undone.')) {
      onDelete?.(activityId);
      onClose();
    }
  };

  const handleRoasterClick = () => {
    if (!activity) return;
    onClose();
    navigate('/coffee-shop', { state: { selectedRoaster: activity.roaster } });
  };

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (loading || !activity) {
    return (
      <div
        className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <div className="text-black text-sm uppercase tracking-wider">Loading...</div>
      </div>
    );
  }

  const isMe = profile?.id === activity.userId;
  const isDefaultWhite = !activity.userAvatar;

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div
          className="max-w-4xl w-full bg-white rounded-2xl sm:rounded-[3.5rem] border-2 border-black shadow-2xl shadow-black/5 animate-in fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 sm:px-10 pt-5 sm:pt-10 pb-5 sm:pb-10">
            {/* Top row with profile, rating, and close button */}
            <div className="flex justify-between items-start mb-8">
              {/* User info */}
              <div className="flex gap-5 items-start">
                <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block shrink-0">
                  <div className={`w-16 h-16 rounded-2xl border-2 transition-all hover:border-black active:border-black overflow-hidden ${isDefaultWhite ? 'bg-white text-black border-black' : 'bg-zinc-50 border-black'}`}>
                    <div className="w-full h-full flex items-center justify-center">
                      {isDefaultWhite ? <Zap className="w-8 h-8" /> : <img src={activity.userAvatar} className="w-full h-full object-cover" alt="" />}
                    </div>
                  </div>
                </Link>
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${activity.userUsername || activity.userId}`} className="block group">
                      <h3 className="font-black text-black uppercase tracking-tight text-xl group-hover:underline transition-colors truncate">{activity.userName}</h3>
                    </Link>
                    {activity.isPrivate && (
                      <span title="Private">
                        <Lock className="w-4 h-4 text-black" />
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[11px] text-zinc-900 uppercase font-black tracking-widest flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> {activity.locationName}
                    </p>
                    <p className="text-[10px] text-black uppercase font-black tracking-[0.25em]">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rating and close button */}
              <div className="flex items-start gap-3">
                <div className="bg-white text-black px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <Award className="w-6 h-6 fill-black" />
                  <span className="text-3xl font-black tracking-tighter leading-none">{activity.rating.toFixed(1)}</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-900 hover:text-black active:text-black transition-colors border-2 border-black hover:border-black active:border-black rounded-xl p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Image */}
            {activity.imageUrl && (
              <div className="mb-8">
                <div className="w-full aspect-[16/9] rounded-[2.5rem] overflow-hidden border-2 border-black shadow-inner shadow-black/5">
                  <img src={activity.imageUrl} className="w-full h-full object-cover" alt="Brew session" />
                </div>
              </div>
            )}

            {/* Title and bean info */}
            <div className="mb-8">
              <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-none mb-4">{activity.title}</h2>

              {/* Coffee Details Box */}
              <div className="bg-zinc-50 border-2 border-black rounded-2xl p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Brewer (Cafe logs only) */}
                  {activity.isCafeLog && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Brewer</p>
                      <p className="text-sm font-black text-black uppercase">{activity.brewer}</p>
                    </div>
                  )}

                  {/* Roaster */}
                  {activity.roaster &&
                   (!activity.isCafeLog ||
                    (activity.roaster.trim().toUpperCase() !== activity.title.trim().toUpperCase() && activity.roaster !== 'CAFE')) && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Roaster</p>
                      <button
                        onClick={handleRoasterClick}
                        className="text-sm font-black text-black uppercase hover:underline text-left"
                      >
                        {activity.roaster}
                      </button>
                    </div>
                  )}

                  {/* Origin */}
                  {activity.beanOrigin && activity.beanOrigin !== 'UNKNOWN' && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Origin</p>
                      <p className="text-sm font-black text-black uppercase">{activity.beanOrigin}</p>
                    </div>
                  )}

                  {/* Estate */}
                  {activity.estate && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Estate</p>
                      <p className="text-sm font-black text-black uppercase">{activity.estate}</p>
                    </div>
                  )}

                  {/* Producer */}
                  {activity.producer && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Producer</p>
                      <p className="text-sm font-black text-black uppercase">{activity.producer}</p>
                    </div>
                  )}

                  {/* Varietal */}
                  {activity.varietal && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Varietal</p>
                      <p className="text-sm font-black text-black uppercase">{activity.varietal}</p>
                    </div>
                  )}

                  {/* Process */}
                  {activity.process && (
                    <div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Process</p>
                      <p className="text-sm font-black text-black uppercase">{activity.process}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parameters */}
            {activity.showParameters && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8 bg-zinc-50 border-2 border-black p-8 rounded-[2.5rem]">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-4 h-4" /> RECIPE</p>
                  <p className="text-sm font-black text-black">{activity.gramsIn}G / {activity.gramsOut}G</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">RATIO</p>
                  <p className="text-sm font-black text-black">{activity.ratio}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4" /> GEAR</p>
                  <p className="text-sm font-black text-black uppercase truncate">{activity.brewer}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Timer className="w-4 h-4" /> TIME</p>
                  <p className="text-sm font-black text-black">{activity.brewTime}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Thermometer className="w-4 h-4" /> TEMP</p>
                  <p className="text-sm font-black text-black whitespace-nowrap">{activity.temperature}°{activity.tempUnit || 'C'}</p>
                </div>
              </div>
            )}

            {/* TDS/EY */}
            {activity.eyPercentage ? (
              <div className="mb-8 flex flex-wrap gap-4">
                {activity.tds ? (
                  <div className="bg-zinc-50 px-4 py-2 rounded-xl">
                    <p className="text-[8px] font-black text-zinc-900 uppercase tracking-widest mb-1">TDS</p>
                    <p className="text-xs font-black text-black">{activity.tds}</p>
                  </div>
                ) : null}
                <div className="bg-white text-black px-4 py-2 rounded-xl">
                  <p className="text-[8px] font-black text-zinc-900 uppercase tracking-widest mb-1">EXT YIELD</p>
                  <p className="text-xs font-black">{activity.eyPercentage}%</p>
                </div>
              </div>
            ) : null}

            {/* Description */}
            {activity.description && <p className="text-black text-base mb-10 font-black uppercase tracking-widest leading-relaxed border-l-4 border-black pl-6 italic">"{activity.description}"</p>}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-8 border-t-2 border-black">
              <button
                onClick={handleLike}
                disabled={isMe}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${isMe ? 'text-black border-black cursor-not-allowed opacity-50' : (hasLiked ? 'text-black border-black bg-black/10' : 'text-black border-black hover:border-black active:border-black')}`}
              >
                <Heart className={`w-5 h-5 transition-transform ${hasLiked ? 'fill-black scale-110' : ''}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">{likes}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${showComments ? 'text-black border-black bg-black/10' : 'text-black border-black hover:border-black active:border-black'}`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-widest">{activity.comments.length}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-900 border-black hover:text-black active:text-black hover:border-zinc-600 transition-all ml-auto">
                <Share2 className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">SHARE</span>
              </button>
              {isMe && onEdit && (
                <button
                  onClick={() => {
                    onEdit(activity);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-900 border-black hover:text-black active:text-black hover:border-zinc-600 transition-all"
                  title="Edit this post"
                >
                  <Edit3 className="w-5 h-5" />
                  <span className="text-[12px] font-black uppercase tracking-widest">EDIT</span>
                </button>
              )}
              {isMe && onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-zinc-900 border-black hover:text-red-500 hover:border-red-900 transition-all"
                  title="Delete this post"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-[12px] font-black uppercase tracking-widest">DELETE</span>
                </button>
              )}
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="mt-8 pt-8 border-t-2 border-black space-y-6 animate-in fade-in duration-300">
                {activity.comments.length > 0 && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {activity.comments.map(comment => (
                      <div key={comment.id} className="bg-zinc-50 border border-black rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-black text-sm uppercase tracking-tight">{comment.userName}</p>
                          <p className="text-[8px] font-black text-black uppercase tracking-widest">
                            {formatTimestamp(comment.timestamp)}
                          </p>
                        </div>
                        <p className="text-black text-sm font-bold uppercase tracking-wide leading-relaxed">
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
                    className="flex-grow bg-zinc-50 border-2 border-black rounded-2xl px-5 py-4 text-black font-black text-sm outline-none focus:border-black uppercase placeholder:text-black disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-white text-black px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:bg-zinc-50 disabled:text-black flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrewLogDetailModal;
