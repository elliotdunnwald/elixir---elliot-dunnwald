import { supabase } from './supabase';
import type { BrewActivity, User, GearItem } from '../types';

// =====================================================
// PROFILE FUNCTIONS
// =====================================================

export interface Profile {
  id: string;
  auth_user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pronouns?: string;
  city: string;
  country: string;
  avatar_url?: string;
  bio?: string;
  is_private: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithStats extends Profile {
  follower_count?: number;
  following_count?: number;
  brew_count?: number;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching profile by ID:', error);
    return null;
  }

  return data;
}

export async function getProfileByUsername(username: string): Promise<ProfileWithStats | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile by username:', error);
    return null;
  }

  // Get stats
  const [followerCount, followingCount, brewCount] = await Promise.all([
    getFollowerCount(profile.id),
    getFollowingCount(profile.id),
    getBrewCount(profile.id)
  ]);

  return {
    ...profile,
    follower_count: followerCount,
    following_count: followingCount,
    brew_count: brewCount
  };
}

export async function createProfile(userId: string, data: {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  pronouns?: string;
  city: string;
  country: string;
  avatar_url?: string;
  bio?: string;
  is_private?: boolean;
}): Promise<Profile | null> {
  // First check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (existing) {
    console.log('Profile already exists, updating instead:', existing);
    // Update existing profile
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating existing profile:', updateError);
      return null;
    }

    return updated;
  }

  // Create new profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      auth_user_id: userId,
      ...data
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }

  return profile;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('auth_user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }

  return data;
}

// =====================================================
// GEAR FUNCTIONS
// =====================================================

export interface DbGearItem {
  id: string;
  profile_id: string;
  name: string;
  brand: string;
  type: string;
  notes?: string;
  created_at: string;
}

export async function getUserGear(profileId: string): Promise<DbGearItem[]> {
  const { data, error } = await supabase
    .from('gear_items')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gear:', error);
    return [];
  }

  return data || [];
}

export async function addGearItem(profileId: string, item: Partial<DbGearItem>): Promise<DbGearItem | null> {
  const { data, error } = await supabase
    .from('gear_items')
    .insert({
      profile_id: profileId,
      ...item
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding gear item:', error);
    return null;
  }

  return data;
}

export async function deleteGearItem(gearId: string): Promise<boolean> {
  const { error } = await supabase
    .from('gear_items')
    .delete()
    .eq('id', gearId);

  if (error) {
    console.error('Error deleting gear item:', error);
    return false;
  }

  return true;
}

// =====================================================
// BREW ACTIVITY FUNCTIONS
// =====================================================

export interface DbBrewActivity {
  id: string;
  profile_id: string;
  title: string;
  description?: string;
  image_url?: string;
  location_name: string;
  roaster: string;
  bean_origin: string;
  estate?: string;
  producer?: string;
  lot?: string;
  varietal?: string;
  process?: string;
  brew_type?: 'espresso' | 'filter';
  brewer: string;
  grinder?: string;
  grind_setting?: string;
  ratio: string;
  grams_in: number;
  grams_out: number;
  brew_weight?: number;
  temperature: number;
  temp_unit: 'C' | 'F';
  brew_time: string;
  rating: number;
  tds?: number;
  ey_percentage?: number;
  show_parameters: boolean;
  is_private: boolean;
  is_cafe_log: boolean;
  cafe_name?: string;
  cafe_city?: string;
  cafe_country?: string;
  cafe_address?: string;
  drink_ordered?: string;
  milk_type?: 'none' | 'steamed' | 'cold';
  steamed_drink?: 'macchiato' | 'cortado' | 'flatwhite' | 'cappuccino' | 'latte';
  drink_size?: number;
  cold_milk_oz?: number;
  pod_size?: 'small' | 'medium' | 'large';
  pod_name?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes?: { profile_id: string }[];
  comments?: {
    id: string;
    profile_id: string;
    text: string;
    created_at: string;
    profiles?: Profile;
  }[];
}

export async function createActivity(profileId: string, data: Partial<DbBrewActivity>): Promise<DbBrewActivity | null> {
  const { data: activity, error } = await supabase
    .from('brew_activities')
    .insert({
      profile_id: profileId,
      ...data
    })
    .select(`
      *,
      profiles(*),
      likes(profile_id),
      comments(*, profiles(*))
    `)
    .single();

  if (error) {
    console.error('Error creating activity:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Profile ID:', profileId);
    console.error('Data being inserted:', JSON.stringify(data, null, 2));
    return null;
  }

  // Track roaster submission for admin approval
  if (data.roaster && profileId) {
    await trackRoasterSubmission(data.roaster, profileId);
  }

  // Track coffee offering from brew log
  if (data.roaster && data.bean_origin) {
    // Construct coffee name from estate + lot, not from title
    let coffeeName = '';
    if (data.estate && data.lot) {
      coffeeName = `${data.estate} ${data.lot}`;
    } else if (data.estate) {
      coffeeName = data.estate;
    } else if (data.lot) {
      coffeeName = data.lot;
    } else {
      coffeeName = data.title || 'UNKNOWN';
    }

    await trackCoffeeFromBrewLog(
      data.roaster,
      coffeeName,
      data.bean_origin,
      profileId,
      data.estate,
      data.lot,
      data.varietal,
      data.process
    );
  }

  return activity;
}

export async function getActivitiesFeed(userId: string, limit = 20, offset = 0): Promise<DbBrewActivity[]> {
  // Get the user's profile ID
  const profile = await getProfile(userId);
  if (!profile) return [];

  // Get list of users the current user follows
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', profile.id);

  const followingIds = following?.map(f => f.following_id) || [];

  // Include user's own profile ID to see their own posts
  const profileIds = [profile.id, ...followingIds];

  // Fetch activities from followed users + own activities
  const { data, error } = await supabase
    .from('brew_activities')
    .select(`
      *,
      profiles(*),
      likes(profile_id),
      comments(*, profiles(*))
    `)
    .in('profile_id', profileIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching feed:', error);
    return [];
  }

  return data || [];
}

export async function getUserActivities(profileId: string, limit = 20, offset = 0): Promise<DbBrewActivity[]> {
  const { data, error } = await supabase
    .from('brew_activities')
    .select(`
      *,
      profiles(*),
      likes(profile_id),
      comments(*, profiles(*))
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }

  return data || [];
}

// Helper function to transform DbBrewActivity to BrewActivity
export function dbActivityToBrewActivity(data: DbBrewActivity): BrewActivity {
  return {
    id: data.id,
    userId: data.profile_id,
    userName: data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name}` : 'Unknown',
    userUsername: data.profiles?.username,
    userAvatar: data.profiles?.avatar_url || '',
    title: data.title,
    description: data.description || '',
    imageUrl: data.image_url || '',
    locationName: data.location_name,
    roaster: data.roaster,
    beanOrigin: data.bean_origin,
    estate: data.estate,
    producer: data.producer,
    lot: data.lot,
    varietal: data.varietal,
    process: data.process,
    brewType: data.brew_type,
    brewer: data.brewer,
    grinder: data.grinder,
    grindSetting: data.grind_setting,
    ratio: data.ratio,
    gramsIn: data.grams_in,
    gramsOut: data.grams_out,
    brewWeight: data.brew_weight,
    temperature: data.temperature,
    tempUnit: data.temp_unit || 'C',
    brewTime: data.brew_time,
    rating: data.rating,
    tds: data.tds,
    eyPercentage: data.ey_percentage,
    showParameters: data.show_parameters,
    isPrivate: data.is_private,
    isCafeLog: data.is_cafe_log,
    cafeName: data.cafe_name,
    timestamp: data.created_at,
    milkType: data.milk_type,
    steamedDrink: data.steamed_drink,
    drinkSize: data.drink_size,
    coldMilkOz: data.cold_milk_oz,
    podSize: data.pod_size,
    podName: data.pod_name,
    likeCount: data.likes?.length || 0,
    likedBy: data.likes?.map((l: any) => l.profile_id) || [],
    comments: data.comments?.map((c: any) => ({
      id: c.id,
      userId: c.profile_id,
      userName: c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name}` : 'Unknown',
      text: c.text,
      timestamp: c.created_at
    })) || []
  };
}

export async function getActivityById(activityId: string): Promise<BrewActivity | null> {
  const { data, error } = await supabase
    .from('brew_activities')
    .select(`
      *,
      profiles(*),
      likes(profile_id),
      comments(*, profiles(*))
    `)
    .eq('id', activityId)
    .single();

  if (error) {
    console.error('Error fetching activity:', error);
    return null;
  }

  if (!data) return null;

  return dbActivityToBrewActivity(data as DbBrewActivity);
}

export async function updateActivity(activityId: string, updates: Partial<DbBrewActivity>): Promise<DbBrewActivity | null> {
  console.log('updateActivity called with:', { activityId, updates });

  const { data, error } = await supabase
    .from('brew_activities')
    .update(updates)
    .eq('id', activityId)
    .select(`
      *,
      profiles(*),
      likes(profile_id),
      comments(*, profiles(*))
    `)
    .single();

  if (error) {
    console.error('Error updating activity:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return null;
  }

  console.log('Activity updated successfully:', data);
  return data;
}

export async function deleteActivity(activityId: string): Promise<boolean> {
  const { error } = await supabase
    .from('brew_activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('Error deleting activity:', error);
    return false;
  }

  return true;
}

// =====================================================
// LIKE FUNCTIONS
// =====================================================

export async function toggleLike(activityId: string, profileId: string): Promise<boolean> {
  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('activity_id', activityId)
    .eq('profile_id', profileId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('activity_id', activityId)
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error removing like:', error);
      return false;
    }
    return true;
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        activity_id: activityId,
        profile_id: profileId
      });

    if (error) {
      console.error('Error adding like:', error);
      return false;
    }
    return true;
  }
}

export async function getLikeCount(activityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('activity_id', activityId);

  if (error) {
    console.error('Error getting like count:', error);
    return 0;
  }

  return count || 0;
}

export async function hasUserLiked(activityId: string, profileId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('activity_id', activityId)
    .eq('profile_id', profileId)
    .single();

  return !!data && !error;
}

// =====================================================
// COMMENT FUNCTIONS
// =====================================================

export async function addComment(activityId: string, profileId: string, text: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .insert({
      activity_id: activityId,
      profile_id: profileId,
      text
    });

  if (error) {
    console.error('Error adding comment:', error);
    return false;
  }

  return true;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    return false;
  }

  return true;
}

// =====================================================
// FOLLOW FUNCTIONS
// =====================================================

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId
    });

  if (error) {
    console.error('Error following user:', error);
    return false;
  }

  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }

  return true;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  return !!data && !error;
}

export async function getFollowerCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profileId);

  if (error) {
    console.error('Error getting follower count:', error);
    return 0;
  }

  return count || 0;
}

export async function getFollowingCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profileId);

  if (error) {
    console.error('Error getting following count:', error);
    return 0;
  }

  return count || 0;
}

export async function getFollowers(profileId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles!follows_follower_id_fkey(*)')
    .eq('following_id', profileId);

  if (error) {
    console.error('Error getting followers:', error);
    return [];
  }

  return data?.map(f => f.profiles).filter(Boolean) as Profile[] || [];
}

export async function getFollowing(profileId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(*)')
    .eq('follower_id', profileId);

  if (error) {
    console.error('Error getting following:', error);
    return [];
  }

  return data?.map(f => f.profiles).filter(Boolean) as Profile[] || [];
}

// =====================================================
// SEARCH FUNCTIONS
// =====================================================

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching profiles:', error);
    return [];
  }

  return data || [];
}

export async function checkUsernameAvailability(username: string, currentProfileId?: string): Promise<boolean> {
  const normalizedUsername = username.toLowerCase().trim();

  // Check if username is valid format (alphanumeric, underscore, hyphen only)
  if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
    return false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  // Username is available if no one has it, or if it's the current user's username
  return !data || (currentProfileId && data.id === currentProfileId);
}

// =====================================================
// GEAR FUNCTIONS
// =====================================================

// =====================================================
// STATS FUNCTIONS
// =====================================================

export async function getBrewCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('brew_activities')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error getting brew count:', error);
    return 0;
  }

  return count || 0;
}

// =====================================================
// STORAGE FUNCTIONS
// =====================================================

export async function uploadBrewImage(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('brew-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return null;
  }

  const { data } = supabase.storage
    .from('brew-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteBrewImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('brew-images') + 1).join('/');

    const { error } = await supabase.storage
      .from('brew-images')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error parsing image URL:', err);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS TO CONVERT BETWEEN DB AND APP TYPES
// =====================================================

export function dbActivityToBrewActivity(dbActivity: DbBrewActivity): BrewActivity {
  const profile = dbActivity.profiles;

  return {
    id: dbActivity.id,
    userId: dbActivity.profile_id,
    userName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
    userUsername: profile?.username,
    userAvatar: profile?.avatar_url || '',
    title: dbActivity.title,
    description: dbActivity.description || '',
    timestamp: dbActivity.created_at,
    locationName: dbActivity.location_name,
    imageUrl: dbActivity.image_url,
    roaster: dbActivity.roaster,
    beanOrigin: dbActivity.bean_origin,
    estate: dbActivity.estate,
    lot: dbActivity.lot,
    varietal: dbActivity.varietal,
    process: dbActivity.process,
    brewer: dbActivity.brewer,
    grinder: dbActivity.grinder,
    grindSetting: dbActivity.grind_setting,
    ratio: dbActivity.ratio,
    gramsIn: dbActivity.grams_in,
    gramsOut: dbActivity.grams_out,
    brewWeight: dbActivity.brew_weight,
    temperature: dbActivity.temperature,
    tempUnit: dbActivity.temp_unit,
    brewTime: dbActivity.brew_time,
    rating: dbActivity.rating,
    tds: dbActivity.tds,
    eyPercentage: dbActivity.ey_percentage,
    showParameters: dbActivity.show_parameters,
    isPrivate: dbActivity.is_private,
    isCafeLog: dbActivity.is_cafe_log,
    cafeName: dbActivity.cafe_name,
    likeCount: dbActivity.likes?.length || 0,
    likedBy: dbActivity.likes?.map(l => l.profile_id) || [],
    comments: dbActivity.comments?.map(c => ({
      id: c.id,
      userId: c.profile_id,
      userName: c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name}` : 'Unknown',
      text: c.text,
      timestamp: c.created_at
    })) || []
  };
}

export function dbProfileToUser(profile: Profile, gear?: GearItem[], stats?: { totalBrews: number; followerCount: number }): User {
  const brewers = gear?.filter(g => g.type === 'brewer') || [];
  const grinders = gear?.filter(g => g.type === 'grinder') || [];

  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`,
    avatar: profile.avatar_url || '',
    username: profile.username,
    location: `${profile.city}, ${profile.country}`,
    email: profile.email,
    phoneNumber: profile.phone,
    stats: {
      totalBrews: stats?.totalBrews || 0,
      streak: 0, // TODO: Calculate streak
      countriesVisited: 0 // TODO: Calculate from activities
    },
    gear: {
      brewers,
      grinders
    }
  };
}

// =====================================================
// COFFEE OFFERINGS FUNCTIONS
// =====================================================

export interface Roaster {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  website?: string;
  founded_year?: number;
  created_at: string;
}

export interface CoffeeOffering {
  id: string;
  roaster_id: string;
  name: string;
  lot: string;
  origin: string;
  region?: string;
  estate?: string;
  varietals: string[];
  processing: string;
  roast_level?: string;
  tasting_notes: string[];
  elevation?: string;
  price?: number;
  size?: string;
  available: boolean;
  created_at: string;
  roaster?: Roaster;
}

export async function getRoasters(): Promise<Roaster[]> {
  const { data, error } = await supabase
    .from('roasters')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching roasters:', error);
    return [];
  }

  return data || [];
}

export async function getCoffeeOfferings(filters?: {
  roasterId?: string;
  origin?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<CoffeeOffering[]> {
  let query = supabase
    .from('coffee_offerings')
    .select(`
      *,
      roaster:roasters(*)
    `)
    .eq('available', true)
    .order('name');

  if (filters?.roasterId) {
    query = query.eq('roaster_id', filters.roasterId);
  }

  if (filters?.origin) {
    query = query.ilike('origin', `%${filters.origin}%`);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,origin.ilike.%${filters.search}%,region.ilike.%${filters.search}%`);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching coffee offerings:', error);
    return [];
  }

  return data || [];
}

export async function getCoffeeOfferingById(id: string): Promise<CoffeeOffering | null> {
  const { data, error } = await supabase
    .from('coffee_offerings')
    .select(`
      *,
      roaster:roasters(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching coffee offering:', error);
    return null;
  }

  return data;
}




// =====================================================
// NOTIFICATION FUNCTIONS
// =====================================================

export interface Notification {
  id: string;
  profile_id: string;
  type: 'like' | 'comment' | 'follow_request' | 'follow_accepted' | 'follow';
  from_profile_id: string;
  from_profile?: Profile;
  activity_id?: string;
  follow_request_id?: string;
  comment_text?: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(profileId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      from_profile:profiles!notifications_from_profile_id_fkey(*)
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function getUnreadNotificationCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(profileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('profile_id', profileId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    return false;
  }

  return true;
}

// =====================================================
// FOLLOW REQUEST FUNCTIONS
// =====================================================

export interface FollowRequest {
  id: string;
  requester_id: string;
  requested_id: string;
  requester?: Profile;
  requested?: Profile;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function createFollowRequest(requesterId: string, requestedId: string): Promise<FollowRequest | null> {
  const { data, error } = await supabase
    .from('follow_requests')
    .insert({
      requester_id: requesterId,
      requested_id: requestedId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating follow request:', error);
    return null;
  }

  return data;
}

export async function getFollowRequests(profileId: string): Promise<FollowRequest[]> {
  const { data, error } = await supabase
    .from('follow_requests')
    .select(`
      *,
      requester:profiles!follow_requests_requester_id_fkey(*)
    `)
    .eq('requested_id', profileId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching follow requests:', error);
    return [];
  }

  return data || [];
}

export async function getPendingFollowRequestCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follow_requests')
    .select('*', { count: 'exact', head: true })
    .eq('requested_id', profileId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending request count:', error);
    return 0;
  }

  return count || 0;
}

export async function acceptFollowRequest(requestId: string): Promise<boolean> {
  // Update request status
  const { data: request, error: updateError } = await supabase
    .from('follow_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError || !request) {
    console.error('Error accepting follow request:', updateError);
    return false;
  }

  // Create the actual follow relationship
  const { error: followError } = await supabase
    .from('follows')
    .insert({
      follower_id: request.requester_id,
      following_id: request.requested_id
    });

  if (followError) {
    console.error('Error creating follow relationship:', followError);
    return false;
  }

  return true;
}

export async function rejectFollowRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follow_requests')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    console.error('Error rejecting follow request:', error);
    return false;
  }

  return true;
}

export async function getExistingFollowRequest(
  requesterId: string,
  requestedId: string
): Promise<FollowRequest | null> {
  const { data, error } = await supabase
    .from('follow_requests')
    .select('*')
    .eq('requester_id', requesterId)
    .eq('requested_id', requestedId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    console.error('Error checking existing follow request:', error);
    return null;
  }

  return data;
}

// =====================================================
// PENDING ROASTERS FUNCTIONS
// =====================================================

export interface PendingRoaster {
  id: string;
  roaster_name: string;
  city?: string;
  country?: string;
  state?: string;
  website?: string;
  submission_count: number;
  first_submitted_at: string;
  last_submitted_at: string;
  submitted_by_users: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export async function trackRoasterSubmission(
  roasterName: string,
  userId: string,
  city?: string,
  country?: string,
  state?: string,
  website?: string
): Promise<void> {
  if (!roasterName || !userId) return;

  try {
    const { error } = await supabase.rpc('track_roaster_submission', {
      p_roaster_name: roasterName.trim(),
      p_user_id: userId,
      p_city: city?.trim() || null,
      p_country: country?.trim() || null,
      p_state: state?.trim() || null,
      p_website: website?.trim() || null
    });

    if (error) {
      console.error('Error tracking roaster submission:', error);
    }
  } catch (err) {
    console.error('Error in trackRoasterSubmission:', err);
  }
}

export async function getPendingRoasters(): Promise<PendingRoaster[]> {
  const { data, error } = await supabase
    .from('pending_roasters')
    .select('*')
    .eq('status', 'pending')
    .order('submission_count', { ascending: false });

  if (error) {
    console.error('Error fetching pending roasters:', error);
    return [];
  }

  return data || [];
}

export async function approveRoaster(roasterId: string, approvedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_roasters')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    })
    .eq('id', roasterId);

  if (error) {
    console.error('Error approving roaster:', error);
    return false;
  }

  return true;
}

export async function rejectRoaster(roasterId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_roasters')
    .update({ status: 'rejected' })
    .eq('id', roasterId);

  if (error) {
    console.error('Error rejecting roaster:', error);
    return false;
  }

  return true;
}

export async function addApprovedRoasterToDatabase(
  roasterName: string,
  city: string,
  country: string,
  state?: string,
  website?: string,
  foundedYear?: number
): Promise<boolean> {
  const { error } = await supabase
    .from('roasters')
    .insert({
      name: roasterName,
      city,
      country,
      state,
      website,
      founded_year: foundedYear
    });

  if (error) {
    console.error('Error adding roaster to database:', error);
    return false;
  }

  return true;
}

// =====================================================
// PENDING EQUIPMENT FUNCTIONS
// =====================================================

export interface PendingEquipment {
  id: string;
  equipment_name: string;
  equipment_type: 'brewer' | 'grinder' | 'filter' | 'water' | 'accessory';
  brand?: string;
  description?: string;
  submission_count: number;
  first_submitted_at: string;
  last_submitted_at: string;
  submitted_by_users: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  name: string;
  brand: string;
  type: 'brewer' | 'grinder' | 'filter' | 'water' | 'accessory';
  description?: string;
  image_url?: string;
  price?: number;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export async function trackEquipmentSubmission(
  equipmentName: string,
  equipmentType: string,
  brand: string,
  description: string,
  userId: string
): Promise<void> {
  if (!equipmentName || !equipmentType || !userId) return;

  try {
    const { error } = await supabase.rpc('track_equipment_submission', {
      p_equipment_name: equipmentName.trim(),
      p_equipment_type: equipmentType,
      p_brand: brand?.trim() || '',
      p_description: description?.trim() || '',
      p_user_id: userId
    });

    if (error) {
      console.error('Error tracking equipment submission:', error);
    }
  } catch (err) {
    console.error('Error in trackEquipmentSubmission:', err);
  }
}

export async function getPendingEquipment(): Promise<PendingEquipment[]> {
  const { data, error } = await supabase
    .from('pending_equipment')
    .select('*')
    .eq('status', 'pending')
    .order('submission_count', { ascending: false });

  if (error) {
    console.error('Error fetching pending equipment:', error);
    return [];
  }

  return data || [];
}

export async function approveEquipment(equipmentId: string, approvedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_equipment')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy
    })
    .eq('id', equipmentId);

  if (error) {
    console.error('Error approving equipment:', error);
    return false;
  }

  return true;
}

export async function rejectEquipment(equipmentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_equipment')
    .update({ status: 'rejected' })
    .eq('id', equipmentId);

  if (error) {
    console.error('Error rejecting equipment:', error);
    return false;
  }

  return true;
}

export async function addApprovedEquipmentToDatabase(
  equipmentName: string,
  brand: string,
  equipmentType: string,
  description?: string,
  imageUrl?: string,
  price?: number,
  websiteUrl?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('equipment')
    .insert({
      name: equipmentName,
      brand,
      type: equipmentType,
      description,
      image_url: imageUrl,
      price,
      website_url: websiteUrl
    });

  if (error) {
    console.error('Error adding equipment to database:', error);
    return false;
  }

  return true;
}

export async function getEquipment(type?: string): Promise<Equipment[]> {
  let query = supabase
    .from('equipment')
    .select('*')
    .order('brand');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// PENDING COFFEE OFFERINGS FUNCTIONS
// =====================================================

export interface PendingCoffee {
  id: string;
  roaster_name: string;
  coffee_name: string;
  origin: string;
  estate?: string;
  lot?: string;
  varietal?: string;
  process?: string;
  submission_count: number;
  first_submitted_at: string;
  last_submitted_at: string;
  submitted_by_users: string[];
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export async function trackCoffeeFromBrewLog(
  roasterName: string,
  coffeeName: string,
  origin: string,
  userId: string,
  estate?: string,
  lot?: string,
  varietal?: string,
  process?: string
): Promise<void> {
  const { error } = await supabase.rpc('track_coffee_submission', {
    p_roaster_name: roasterName.trim(),
    p_coffee_name: coffeeName.trim(),
    p_origin: origin.trim(),
    p_user_id: userId,
    p_estate: estate?.trim() || null,
    p_lot: lot?.trim() || null,
    p_varietal: varietal?.trim() || null,
    p_process: process?.trim() || null
  });

  if (error) {
    console.error('Error tracking coffee submission:', error);
  }
}

export async function getPendingCoffees(): Promise<PendingCoffee[]> {
  const { data, error } = await supabase
    .from('pending_coffee_offerings')
    .select('*')
    .eq('status', 'pending')
    .order('submission_count', { ascending: false })
    .order('roaster_name')
    .order('coffee_name');

  if (error) {
    console.error('Error fetching pending coffees:', error);
    return [];
  }

  return data || [];
}

export async function approveCoffee(coffeeId: string, adminId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_coffee_offerings')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', coffeeId);

  if (error) {
    console.error('Error approving coffee:', error);
    return false;
  }

  return true;
}

export async function rejectCoffee(coffeeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_coffee_offerings')
    .update({ status: 'rejected' })
    .eq('id', coffeeId);

  if (error) {
    console.error('Error rejecting coffee:', error);
    return false;
  }

  return true;
}

export async function addApprovedCoffeeToDatabase(
  roasterName: string,
  coffeeName: string,
  origin: string,
  estate?: string,
  lot?: string,
  varietal?: string,
  process?: string
): Promise<boolean> {
  // First find the roaster ID (case-insensitive)
  const { data: roasterData, error: roasterError } = await supabase
    .from('roasters')
    .select('id')
    .ilike('name', roasterName.trim())
    .limit(1)
    .single();

  if (roasterError || !roasterData) {
    console.error('Error finding roaster:', roasterError);
    console.error('Roaster name searched:', roasterName);
    alert(`Could not find roaster "${roasterName}" in database. Please add the roaster first in Admin Roasters.`);
    return false;
  }

  // Check if coffee already exists
  const { data: existingCoffee } = await supabase
    .from('coffee_offerings')
    .select('id')
    .eq('roaster_id', roasterData.id)
    .ilike('name', coffeeName.trim())
    .ilike('origin', origin.trim())
    .limit(1)
    .single();

  if (existingCoffee) {
    console.log('Coffee already exists in database');
    return true;
  }

  // Add to coffee_offerings table
  const { error } = await supabase
    .from('coffee_offerings')
    .insert({
      roaster_id: roasterData.id,
      name: coffeeName.trim(),
      lot: lot?.trim() || '',
      origin: origin.trim(),
      estate: estate?.trim() || null,
      varietals: varietal ? [varietal.trim()] : [],
      processing: process?.trim() || '',
      available: true
    });

  if (error) {
    console.error('Error adding coffee to database:', error);
    console.error('Coffee data:', { roasterName, coffeeName, origin, estate, lot, varietal, process });
    alert(`Error adding coffee: ${error.message}`);
    return false;
  }

  return true;
}

export async function backfillPendingCoffeesFromBrewLogs(): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  const result = {
    success: true,
    processed: 0,
    errors: [] as string[]
  };

  try {
    // Get all unique coffees from brew activities
    const { data: activities, error: fetchError } = await supabase
      .from('brew_activities')
      .select('roaster, title, bean_origin, estate, lot, varietal, process, profile_id, created_at')
      .not('roaster', 'is', null)
      .not('title', 'is', null)
      .not('bean_origin', 'is', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      result.success = false;
      result.errors.push(`Error fetching activities: ${fetchError.message}`);
      return result;
    }

    if (!activities || activities.length === 0) {
      return result;
    }

    // Process each unique coffee
    const seen = new Set<string>();
    for (const activity of activities) {
      // Construct coffee name from estate + lot, not from title
      let coffeeName = '';
      if (activity.estate && activity.lot) {
        coffeeName = `${activity.estate} ${activity.lot}`;
      } else if (activity.estate) {
        coffeeName = activity.estate;
      } else if (activity.lot) {
        coffeeName = activity.lot;
      } else {
        coffeeName = activity.title || 'UNKNOWN';
      }

      const key = `${activity.roaster}|${coffeeName}|${activity.bean_origin}`;
      if (seen.has(key)) continue;
      seen.add(key);

      try {
        await trackCoffeeFromBrewLog(
          activity.roaster,
          coffeeName,
          activity.bean_origin,
          activity.profile_id,
          activity.estate,
          activity.lot,
          activity.varietal,
          activity.process
        );
        result.processed++;
      } catch (err) {
        result.errors.push(`Error processing ${activity.roaster} - ${coffeeName}: ${err}`);
      }
    }
  } catch (err) {
    result.success = false;
    result.errors.push(`Unexpected error: ${err}`);
  }

  return result;
}

// =====================================================
// CAFE FUNCTIONS
// =====================================================

export interface Cafe {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  average_rating: number;
  visit_count: number;
  created_at: string;
  updated_at: string;
}

export interface PendingCafe {
  id: string;
  cafe_name: string;
  city: string;
  country: string;
  address?: string;
  submitted_by: string;
  submission_count: number;
  submitted_by_users: string[];
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export async function getCafes(): Promise<Cafe[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching cafes:', error);
    return [];
  }

  return data || [];
}

export async function getCafeById(cafeId: string): Promise<Cafe | null> {
  const { data, error} = await supabase
    .from('cafes')
    .select('*')
    .eq('id', cafeId)
    .single();

  if (error) {
    console.error('Error fetching cafe:', error);
    return null;
  }

  return data;
}

export async function searchCafes(query: string): Promise<Cafe[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`)
    .order('visit_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching cafes:', error);
    return [];
  }

  return data || [];
}

export async function trackCafeFromVisit(
  cafeName: string,
  city: string,
  country: string,
  submittedBy: string,
  address?: string
): Promise<boolean> {
  try {
    // First, check if this exact cafe already exists
    const { data: existing, error: searchError } = await supabase
      .from('cafes')
      .select('id')
      .eq('name', cafeName.toUpperCase())
      .eq('city', city.toUpperCase())
      .eq('country', country.toUpperCase())
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error checking for existing cafe:', searchError);
      return false;
    }

    // If cafe exists, we're done
    if (existing) {
      return true;
    }

    // Check if cafe is in pending approvals
    const { data: pending, error: pendingError } = await supabase
      .from('pending_cafes')
      .select('*')
      .eq('cafe_name', cafeName.toUpperCase())
      .eq('city', city.toUpperCase())
      .eq('country', country.toUpperCase())
      .eq('status', 'pending')
      .single();

    if (pendingError && pendingError.code !== 'PGRST116') {
      console.error('Error checking pending cafes:', pendingError);
      return false;
    }

    if (pending) {
      // Cafe is pending, increment submission count and add user
      const updatedUsers = Array.from(new Set([...pending.submitted_by_users, submittedBy]));

      const { error: updateError } = await supabase
        .from('pending_cafes')
        .update({
          submission_count: pending.submission_count + 1,
          submitted_by_users: updatedUsers,
          updated_at: new Date().toISOString()
        })
        .eq('id', pending.id);

      if (updateError) {
        console.error('Error updating pending cafe:', updateError);
        return false;
      }

      return true;
    }

    // Create new pending cafe
    const { error: insertError } = await supabase
      .from('pending_cafes')
      .insert({
        cafe_name: cafeName.toUpperCase(),
        city: city.toUpperCase(),
        country: country.toUpperCase(),
        address: address?.toUpperCase(),
        submitted_by: submittedBy,
        submission_count: 1,
        submitted_by_users: [submittedBy],
        status: 'pending'
      });

    if (insertError) {
      console.error('Error creating pending cafe:', insertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error in trackCafeFromVisit:', err);
    return false;
  }
}

export async function getPendingCafes(): Promise<PendingCafe[]> {
  const { data, error } = await supabase
    .from('pending_cafes')
    .select('*')
    .eq('status', 'pending')
    .order('submission_count', { ascending: false });

  if (error) {
    console.error('Error fetching pending cafes:', error);
    return [];
  }

  return data || [];
}

export async function approveCafe(cafeId: string, approvedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_cafes')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', cafeId);

  if (error) {
    console.error('Error approving cafe:', error);
    return false;
  }

  return true;
}

export async function rejectCafe(cafeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pending_cafes')
    .update({ status: 'rejected' })
    .eq('id', cafeId);

  if (error) {
    console.error('Error rejecting cafe:', error);
    return false;
  }

  return true;
}

export async function addApprovedCafeToDatabase(
  name: string,
  city: string,
  country: string,
  address?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('cafes')
    .insert({
      name: name.toUpperCase(),
      city: city.toUpperCase(),
      country: country.toUpperCase(),
      address: address?.toUpperCase(),
      average_rating: 0,
      visit_count: 0
    });

  if (error) {
    console.error('Error adding approved cafe:', error);
    return false;
  }

  return true;
}

export async function getActivitiesByCafe(cafeId: string): Promise<BrewActivity[]> {
  // First get the cafe name
  const { data: cafe, error: cafeError } = await supabase
    .from('cafes')
    .select('name')
    .eq('id', cafeId)
    .single();

  if (cafeError || !cafe) {
    console.error('Error fetching cafe:', cafeError);
    return [];
  }

  const { data, error } = await supabase
    .from('brew_activities')
    .select(`
      *,
      profiles!inner (
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('is_cafe_log', true)
    .eq('cafe_name', cafe.name)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching cafe activities:', error);
    return [];
  }

  return (data || []).map(rawActivity => transformActivity(rawActivity));
}
