import React, { useState, useEffect } from 'react';
import { Bell, X, Heart, MessageCircle, UserPlus, UserCheck, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  getNotifications,
  getFollowRequests,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  acceptFollowRequest,
  rejectFollowRequest,
  type Notification,
  type FollowRequest
} from '../lib/database';
import { supabase } from '../lib/supabase';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');

  useEffect(() => {
    if (!profile || !isOpen) return;

    loadData();

    // Subscribe to new notifications
    const notifChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profile.id}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Subscribe to follow request changes
    const requestChannel = supabase
      .channel('follow_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follow_requests',
          filter: `requested_id=eq.${profile.id}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      notifChannel.unsubscribe();
      requestChannel.unsubscribe();
    };
  }, [profile, isOpen]);

  const loadData = async () => {
    if (!profile) return;

    setLoading(true);
    const [notifs, requests] = await Promise.all([
      getNotifications(profile.id),
      getFollowRequests(profile.id)
    ]);
    setNotifications(notifs);
    setFollowRequests(requests);
    setLoading(false);
  };

  const handleMarkAsRead = async (notifId: string) => {
    await markNotificationAsRead(notifId);
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!profile) return;
    await markAllNotificationsAsRead(profile.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleAcceptRequest = async (requestId: string) => {
    const success = await acceptFollowRequest(requestId);
    if (success) {
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const success = await rejectFollowRequest(requestId);
    if (success) {
      setFollowRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow_request':
        return <UserPlus className="w-5 h-5 text-yellow-500" />;
      case 'follow_accepted':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-white" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationText = (notif: Notification) => {
    const name = `${notif.from_profile?.first_name} ${notif.from_profile?.last_name}`;

    switch (notif.type) {
      case 'like':
        return `${name} liked your brew`;
      case 'comment':
        return `${name} commented: "${notif.comment_text?.substring(0, 50)}${(notif.comment_text?.length || 0) > 50 ? '...' : ''}"`;
      case 'follow_request':
        return `${name} wants to follow you`;
      case 'follow_accepted':
        return `${name} accepted your follow request`;
      case 'follow':
        return `${name} started following you`;
      default:
        return 'New notification';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-zinc-950 border-l-2 border-zinc-800 z-50 flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Notifications
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              All {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-1">({notifications.filter(n => !n.read).length})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${
                activeTab === 'requests'
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              Requests {followRequests.length > 0 && (
                <span className="ml-1">({followRequests.length})</span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center text-zinc-500 text-sm uppercase tracking-wider py-10">
              Loading...
            </div>
          ) : (
            <>
              {/* Follow Requests Tab */}
              {activeTab === 'requests' && (
                <>
                  {followRequests.length === 0 ? (
                    <div className="text-center text-zinc-500 text-sm uppercase tracking-wider py-10">
                      No pending requests
                    </div>
                  ) : (
                    followRequests.map(request => (
                      <div
                        key={request.id}
                        className="bg-zinc-900 border-2 border-zinc-800 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          {request.requester?.avatar_url ? (
                            <img
                              src={request.requester.avatar_url}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                              <UserPlus className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white uppercase truncate">
                              {request.requester?.first_name} {request.requester?.last_name}
                            </p>
                            <p className="text-[10px] font-black text-zinc-500 uppercase">
                              Wants to follow you
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 bg-white text-black py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 bg-zinc-800 text-zinc-400 py-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-wider hover:text-white hover:bg-zinc-700 active:scale-95 transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* All Notifications Tab */}
              {activeTab === 'all' && (
                <>
                  {notifications.length === 0 ? (
                    <div className="text-center text-zinc-500 text-sm uppercase tracking-wider py-10">
                      No notifications
                    </div>
                  ) : (
                    <>
                      {notifications.filter(n => !n.read).length > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="w-full text-center text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-white py-2"
                        >
                          Mark all as read
                        </button>
                      )}
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                            notif.read
                              ? 'bg-zinc-950 border-zinc-900'
                              : 'bg-zinc-900 border-zinc-800 hover:border-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-white">
                                {getNotificationText(notif)}
                              </p>
                              <p className="text-[10px] font-black text-zinc-500 uppercase mt-1">
                                {new Date(notif.created_at).toLocaleDateString()} at{' '}
                                {new Date(notif.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-white mt-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
