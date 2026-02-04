import React from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { BrewActivity } from '../types';

interface VisitCardProps {
  activity: BrewActivity;
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

const VisitCard: React.FC<VisitCardProps> = ({ activity, onClick }) => {
  const isDefaultWhite = !activity.userAvatar;

  // Get the drink name from the activity
  const drinkName = activity.isCafeLog ? activity.drinkOrdered : activity.title;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border-2 border-black transition-all hover:border-black cursor-pointer shadow-lg shadow-black/5 p-4 flex items-center gap-4"
    >
      {/* Avatar */}
      <Link
        to={`/profile/${activity.userUsername}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <div className={`w-10 h-10 rounded-xl border-2 border-black hover:border-black transition-all flex items-center justify-center overflow-hidden shadow-md ${isDefaultWhite ? 'bg-white' : 'bg-zinc-900'}`}>
          {activity.userAvatar ? (
            <img src={activity.userAvatar} className="w-full h-full object-cover" alt="" />
          ) : (
            <User className="w-5 h-5 text-black" />
          )}
        </div>
      </Link>

      {/* Name and drink */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${activity.userUsername}`}
          onClick={(e) => e.stopPropagation()}
          className="font-black text-black text-sm uppercase tracking-tight hover:underline"
        >
          {activity.userName}
        </Link>
        {drinkName && (
          <p className="text-xs font-bold text-black uppercase tracking-wide truncate">
            {drinkName}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <div className="text-[9px] text-black uppercase font-black tracking-widest shrink-0">
        {formatTimestamp(activity.timestamp)}
      </div>
    </div>
  );
};

export default VisitCard;
