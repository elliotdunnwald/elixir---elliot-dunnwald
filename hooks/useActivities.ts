import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  getActivitiesFeed,
  getUserActivities,
  dbActivityToBrewActivity,
  type DbBrewActivity
} from '../lib/database';
import type { BrewActivity } from '../types';
import { useAuth } from './useAuth';

interface UseActivitiesOptions {
  userId?: string; // If provided, fetch specific user's activities instead of feed
  limit?: number;
  realtime?: boolean; // Enable real-time subscriptions
}

export function useActivities(options: UseActivitiesOptions = {}) {
  const { user, profile } = useAuth();
  const { userId, limit = 20, realtime = true } = options;

  const [activities, setActivities] = useState<BrewActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useActivities effect:', { hasUser: !!user, hasProfile: !!profile, userId });
    if (!user || !profile) {
      console.log('useActivities: No user or profile, skipping load');
      setLoading(false);
      return;
    }

    console.log('useActivities: Loading activities...');
    loadActivities();
  }, [user, profile, userId]);

  useEffect(() => {
    if (!realtime || !user || !profile) return;

    // Subscribe to new activities
    const channel = supabase
      .channel('brew_activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brew_activities'
        },
        async (payload) => {
          console.log('Activity change detected:', payload);

          if (payload.eventType === 'INSERT') {
            // Fetch the full activity with relations
            const { data } = await supabase
              .from('brew_activities')
              .select(`
                *,
                profiles(*),
                likes(profile_id),
                comments(*, profiles(*))
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newActivity = dbActivityToBrewActivity(data as DbBrewActivity);
              setActivities(prev => [newActivity, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch updated activity
            const { data } = await supabase
              .from('brew_activities')
              .select(`
                *,
                profiles(*),
                likes(profile_id),
                comments(*, profiles(*))
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const updatedActivity = dbActivityToBrewActivity(data as DbBrewActivity);
              setActivities(prev =>
                prev.map(a => a.id === updatedActivity.id ? updatedActivity : a)
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setActivities(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to likes changes
    const likesChannel = supabase
      .channel('likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        async (payload) => {
          console.log('Like change detected:', payload);

          // Reload the affected activity to get updated like count
          if (payload.new?.activity_id || payload.old?.activity_id) {
            const activityId = payload.new?.activity_id || payload.old?.activity_id;

            const { data } = await supabase
              .from('brew_activities')
              .select(`
                *,
                profiles(*),
                likes(profile_id),
                comments(*, profiles(*))
              `)
              .eq('id', activityId)
              .single();

            if (data) {
              const updatedActivity = dbActivityToBrewActivity(data as DbBrewActivity);
              setActivities(prev =>
                prev.map(a => a.id === updatedActivity.id ? updatedActivity : a)
              );
            }
          }
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('Comment change detected:', payload);

          // Reload the affected activity to get updated comments
          if (payload.new?.activity_id || payload.old?.activity_id) {
            const activityId = payload.new?.activity_id || payload.old?.activity_id;

            const { data } = await supabase
              .from('brew_activities')
              .select(`
                *,
                profiles(*),
                likes(profile_id),
                comments(*, profiles(*))
              `)
              .eq('id', activityId)
              .single();

            if (data) {
              const updatedActivity = dbActivityToBrewActivity(data as DbBrewActivity);
              setActivities(prev =>
                prev.map(a => a.id === updatedActivity.id ? updatedActivity : a)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      likesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [realtime, user, profile]);

  async function loadActivities() {
    console.log('loadActivities called');
    if (!user || !profile) {
      console.log('loadActivities: No user or profile');
      return;
    }

    console.log('loadActivities: Starting load...');
    setLoading(true);
    setError(null);

    try {
      let dbActivities: DbBrewActivity[];

      if (userId) {
        console.log('Fetching activities for userId:', userId);
        // Fetch specific user's activities
        dbActivities = await getUserActivities(userId, limit);
      } else {
        console.log('Fetching feed for user:', user.id);
        // Fetch feed (own + following)
        dbActivities = await getActivitiesFeed(user.id, limit);
      }

      console.log('Activities loaded:', dbActivities.length);
      const mappedActivities = dbActivities.map(dbActivityToBrewActivity);
      console.log('Mapped activities:', mappedActivities.length);
      setActivities(mappedActivities);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      console.log('loadActivities: Done, setting loading to false');
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!user || !profile) return;

    try {
      let dbActivities: DbBrewActivity[];

      if (userId) {
        dbActivities = await getUserActivities(userId, limit, activities.length);
      } else {
        dbActivities = await getActivitiesFeed(user.id, limit, activities.length);
      }

      const mappedActivities = dbActivities.map(dbActivityToBrewActivity);
      setActivities(prev => [...prev, ...mappedActivities]);
    } catch (err) {
      console.error('Error loading more activities:', err);
    }
  }

  return {
    activities,
    loading,
    error,
    loadMore,
    refresh: loadActivities
  };
}
