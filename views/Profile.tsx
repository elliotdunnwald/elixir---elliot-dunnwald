import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Bookmark, LayoutGrid, BarChart3, User as UserIcon, Settings2, X, Plus, Image as ImageIcon, Search, Lock, Eye, EyeOff, Share2, Check, Trash2, Loader2, ZoomIn, ZoomOut, Sun, Moon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop';
import { BREWING_DEVICES } from '../data/database';
import { useAuth } from '../hooks/useAuth';
import { useActivities } from '../hooks/useActivities';
import { useTheme } from '../context/ThemeContext';
import {
  getProfileByUsername,
  updateProfile,
  getUserGear,
  addGearItem,
  deleteGearItem,
  getFollowerCount,
  getFollowingCount,
  followUser,
  unfollowUser,
  isFollowing,
  uploadBrewImage,
  deleteActivity as deleteActivityDb,
  createFollowRequest,
  getExistingFollowRequest,
  checkUsernameAvailability,
  type ProfileWithStats
} from '../lib/database';
import PostCard from '../components/PostCard';
import { getCroppedImg } from '../utils/cropImage';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleComplete = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(croppedBlob);
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Failed to crop image');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-2xl rounded-[2rem]" style={{ backgroundColor: '#18181b', overflow: 'hidden' }}>
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center" style={{ backgroundColor: '#18181b' }}>
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">CROP AVATAR</h2>
          <button onClick={onCancel} className="text-zinc-100 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative h-[400px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">ZOOM</label>
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4 text-zinc-200" />
                <span className="text-xs font-black text-white">{Math.round(zoom * 100)}%</span>
                <ZoomIn className="w-4 h-4 text-zinc-200" />
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-zinc-800 text-zinc-400 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:text-white"
            >
              CANCEL
            </button>
            <button
              onClick={handleComplete}
              disabled={processing}
              className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> PROCESSING
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> APPLY
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ThemeToggleSection: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">THEME</label>
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${theme === 'light' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-700 text-white'}`}
      >
        {theme === 'light' ? (
          <>
            <Sun className="w-4 h-4" /> LIGHT MODE
          </>
        ) : (
          <>
            <Moon className="w-4 h-4" /> DARK MODE
          </>
        )}
      </button>
    </div>
  );
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onSave: (data: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userData, onSave }) => {
  const initialFirstName = userData.firstName || userData.first_name || '';
  const initialLastName = userData.lastName || userData.last_name || '';

  const [formData, setFormData] = useState({
    username: userData.username || '',
    firstName: initialFirstName,
    lastName: initialLastName,
    email: userData.email || '',
    phone: userData.phone || '',
    pronouns: userData.pronouns || '',
    city: userData.city || '',
    country: userData.country || '',
    bio: userData.bio || '',
    avatar: userData.avatar || userData.avatar_url || '',
    isPrivate: userData.isPrivate || userData.is_private || false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create object URL for cropping
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    setUploading(true);
    setCropModalOpen(false);

    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to upload an avatar');
        return;
      }

      // Upload cropped image to Supabase Storage
      const fileName = `avatar_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('brew-images')
        .upload(filePath, croppedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('brew-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar: data.publicUrl }));
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      alert(`Failed to upload avatar: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  // Check username availability with debouncing
  useEffect(() => {
    const checkUsername = async () => {
      const username = formData.username.trim().toLowerCase();

      // Reset if empty or same as current username
      if (!username || username === (userData.username || '').toLowerCase()) {
        setUsernameAvailable(null);
        return;
      }

      // Check if valid format
      if (!/^[a-z0-9_-]+$/.test(username)) {
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      const available = await checkUsernameAvailability(username, userData.id);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, userData.username, userData.id]);

  const handleSave = () => {
    // Don't save if username is taken
    if (usernameAvailable === false) {
      alert('Username is already taken. Please choose another.');
      return;
    }

    onSave(formData);
    onClose();
  };

  const filteredDevices = BREWING_DEVICES.filter(d => d.name.toUpperCase().includes(searchQuery.toUpperCase()) || d.brand.toUpperCase().includes(searchQuery.toUpperCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full sm:h-auto sm:rounded-[2rem] flex flex-col sm:max-h-[90vh] animate-in zoom-in-95" style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
        <div className="px-8 py-6 border-b-2 border-zinc-800 flex justify-between items-center" style={{ backgroundColor: '#000000' }}>
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">EDIT PROFILE</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="overflow-y-auto px-6 sm:px-10 py-10 space-y-12 custom-scrollbar flex-1">
          <section className="flex flex-col items-center gap-6">
            <div onClick={() => !uploading && mediaInputRef.current?.click()} className={`w-32 h-32 rounded-3xl border-4 border-zinc-800 bg-black flex items-center justify-center overflow-hidden ${uploading ? 'cursor-wait' : 'cursor-pointer hover:border-white'} transition-all group relative`}>
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-12 h-12 text-zinc-800" />}
              {uploading ? (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
            <input type="file" ref={mediaInputRef} onChange={handleAvatarSelect} className="hidden" accept="image/*" />
            <p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">TAP TO CHANGE PHOTO</p>
          </section>
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">FIRST NAME</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">LAST NAME</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">USERNAME</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 pr-12 text-white font-black text-sm outline-none focus:border-white lowercase"
                  placeholder="choose your username"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {checkingUsername && (
                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {formData.username && !checkingUsername && usernameAvailable === false && (
                <p className="text-[9px] font-black text-red-500 uppercase tracking-wider px-1">Username taken</p>
              )}
              {formData.username && formData.username.length < 3 && (
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider px-1">Minimum 3 characters</p>
              )}
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-wider px-1">Letters, numbers, _ and - only</p>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">EMAIL</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">PHONE</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white" placeholder="OPTIONAL" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">PRONOUNS</label><input type="text" value={formData.pronouns} onChange={e => setFormData({ ...formData, pronouns: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">CITY</label><input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">COUNTRY</label><input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">BIO</label><textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value.toUpperCase() })} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase min-h-[100px] resize-none" placeholder="SHARE YOUR BREW PHILOSOPHY..." /></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">PRIVACY</label>
              <button type="button" onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })} className={`w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.isPrivate ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-white text-black border-white'}`}>
                {formData.isPrivate ? <><EyeOff className="w-4 h-4" /> PRIVATE PROFILE</> : <><Eye className="w-4 h-4" /> PUBLIC PROFILE</>}
              </button>
            </div>
            <ThemeToggleSection />
          </section>
        </div>
        <div className="px-6 sm:px-10 py-6 border-t-2 border-zinc-800 shrink-0">
          <button type="button" onClick={handleSave} className="w-full bg-white text-black font-black text-sm uppercase tracking-[0.4em] py-7 rounded-[2.5rem] transition-all active:scale-[0.98]">SAVE CHANGES</button>
        </div>
      </div>
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={imageToCrop}
        onComplete={handleCroppedImage}
        onCancel={() => setCropModalOpen(false)}
      />
    </div>
  );
};

interface ProfileViewProps {
  isMe?: boolean;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isMe }) => {
  const { userId } = useParams<{ userId: string }>();
  const { user, profile: currentProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'activity' | 'locker' | 'analytics'>('activity');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState<ProfileWithStats | null>(null);
  const [gear, setGear] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isAddingGear, setIsAddingGear] = useState(false);
  const [newGearSearch, setNewGearSearch] = useState('');
  const [deletingGearId, setDeletingGearId] = useState<string | null>(null);

  // Fetch activities for this profile
  const { activities, loading: activitiesLoading } = useActivities({
    userId: isMe ? currentProfile?.id : profileData?.id,
    realtime: true
  });

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      if (isMe && currentProfile) {
        // Load own profile
        const [gearData, followerCount, followingCount] = await Promise.all([
          getUserGear(currentProfile.id),
          getFollowerCount(currentProfile.id),
          getFollowingCount(currentProfile.id)
        ]);

        setProfileData({
          ...currentProfile,
          follower_count: followerCount,
          following_count: followingCount,
          brew_count: 0 // Will be updated separately
        });
        setGear(gearData);
      } else if (userId) {
        // Load other user's profile by username
        const profile = await getProfileByUsername(userId);
        if (profile) {
          setProfileData(profile);
          const gearData = await getUserGear(profile.id);
          setGear(gearData);

          // Check if following or has pending request
          if (currentProfile) {
            const [isFollowingUser, pendingRequest] = await Promise.all([
              isFollowing(currentProfile.id, profile.id),
              getExistingFollowRequest(currentProfile.id, profile.id)
            ]);
            setFollowing(isFollowingUser);
            setHasPendingRequest(!!pendingRequest);
          }
        }
      }

      setLoading(false);
    }

    loadProfile();
  }, [isMe, userId, currentProfile?.id]);

  // Update brew count when activities change
  useEffect(() => {
    if (profileData) {
      setProfileData(prev => prev ? { ...prev, brew_count: activities.length } : null);
    }
  }, [activities.length]);

  const handleUpdateProfile = async (updates: any) => {
    if (!user || !currentProfile) return;

    const result = await updateProfile(user.id, {
      username: updates.username,
      first_name: updates.firstName,
      last_name: updates.lastName,
      email: updates.email,
      phone: updates.phone,
      pronouns: updates.pronouns,
      city: updates.city,
      country: updates.country,
      bio: updates.bio,
      avatar_url: updates.avatar,
      is_private: updates.isPrivate
    });

    if (result) {
      await refreshProfile();
      // Reload profile data
      const [followerCount, followingCount] = await Promise.all([
        getFollowerCount(currentProfile.id),
        getFollowingCount(currentProfile.id)
      ]);

      setProfileData({
        ...result,
        follower_count: followerCount,
        following_count: followingCount,
        brew_count: activities.length
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (confirm('Delete this brew log? This action cannot be undone.')) {
      const success = await deleteActivityDb(activityId);
      if (success) {
        // Activity will be removed via real-time subscription
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!currentProfile || !profileData || followLoading) return;

    setFollowLoading(true);
    try {
      if (following) {
        // Unfollow
        await unfollowUser(currentProfile.id, profileData.id);
        setFollowing(false);
      } else if (hasPendingRequest) {
        // If there's already a pending request, don't do anything
        // (user should wait for it to be accepted/rejected)
        return;
      } else {
        // Check if profile is private
        if (profileData.is_private) {
          // Create follow request for private profile
          await createFollowRequest(currentProfile.id, profileData.id);
          setHasPendingRequest(true);
        } else {
          // Direct follow for public profile
          await followUser(currentProfile.id, profileData.id);
          setFollowing(true);
        }
      }

      // Update follower count
      const followerCount = await getFollowerCount(profileData.id);
      setProfileData({ ...profileData, follower_count: followerCount });
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const shareProfile = () => {
    if (!isMe || !profileData) return;

    const url = `${window.location.origin}/#/profile/${profileData.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddGear = async (gearName: string) => {
    if (!profileData) return;

    const parts = gearName.split(' ');
    const brand = parts[0] || 'Unknown';
    const name = parts.slice(1).join(' ') || gearName;

    const newGear = await addGearItem(profileData.id, {
      name,
      brand,
      type: 'brewer',
      notes: ''
    });

    if (newGear) {
      setGear([...gear, newGear]);
      setIsAddingGear(false);
      setNewGearSearch('');
    }
  };

  const handleDeleteGear = async (gearId: string) => {
    if (!profileData) return;

    setDeletingGearId(gearId);
    const success = await deleteGearItem(gearId);

    if (success) {
      setGear(gear.filter(g => g.id !== gearId));
    }
    setDeletingGearId(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <h3 className="text-3xl font-black text-zinc-100 uppercase tracking-tighter">PROFILE NOT FOUND</h3>
      </div>
    );
  }

  const displayUser = {
    id: profileData.id,
    name: `${profileData.first_name} ${profileData.last_name}`,
    pronouns: profileData.pronouns || '',
    bio: profileData.bio || '',
    location: `${profileData.city}, ${profileData.country}`,
    stats: {
      followers: profileData.follower_count?.toString() || '0',
      following: profileData.following_count?.toString() || '0',
      brews: activities.length.toString()
    },
    avatar: profileData.avatar_url || '',
    gear: gear.map(g => `${g.brand} ${g.name}`.toUpperCase()),
    isPrivate: profileData.is_private || false
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="bg-zinc-900 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border-2 border-zinc-800 shadow-2xl relative">
        <div className="h-32 sm:h-40 bg-zinc-950 flex items-center justify-center"></div>
        {isMe && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3">
            <button onClick={shareProfile} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black border-2 border-zinc-800 text-zinc-100 hover:text-white hover:border-white transition-all shadow-xl z-10 flex items-center gap-2">
              {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">{copied ? 'LINK COPIED' : 'SHARE PROFILE'}</span>
            </button>
            <button onClick={() => setIsEditModalOpen(true)} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black border-2 border-zinc-800 text-zinc-100 hover:text-white hover:border-white transition-all shadow-xl z-10"><Settings2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        )}
        {!isMe && currentProfile && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              onClick={handleFollowToggle}
              disabled={followLoading || hasPendingRequest}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
                following
                  ? 'bg-zinc-800 text-zinc-400 border-2 border-zinc-700 hover:border-red-900 hover:text-red-400'
                  : hasPendingRequest
                  ? 'bg-yellow-900 text-yellow-400 border-2 border-yellow-700 cursor-not-allowed'
                  : 'bg-white text-black border-2 border-white hover:bg-zinc-100'
              }`}
            >
              {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : following ? 'UNFOLLOW' : hasPendingRequest ? 'REQUESTED' : 'FOLLOW'}
            </button>
          </div>
        )}
        <div className="px-6 sm:px-10 pb-8 sm:pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 mb-6 sm:mb-8 gap-4 sm:gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-2xl shadow-white/10 shrink-0">
              {displayUser.avatar ? <img src={displayUser.avatar} className="w-full h-full object-cover" alt="" /> : <UserIcon className="w-10 h-10 sm:w-14 sm:h-14 text-black" />}
            </div>
            <div className="sm:pb-2 flex-grow text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-tight sm:leading-none">{displayUser.name}</h1>
                {displayUser.isPrivate && <span title="Private Profile"><Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" /></span>}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 sm:mt-3">
                <p className="text-[10px] sm:text-[11px] font-black text-zinc-100 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{displayUser.location}</p>
                {displayUser.pronouns && <span className="text-[8px] sm:text-[9px] font-black text-zinc-700 border border-zinc-800 px-2 py-0.5 rounded uppercase tracking-widest">{displayUser.pronouns}</span>}
              </div>
            </div>
          </div>
          {displayUser.bio && (
            <p className="mb-8 sm:mb-10 text-zinc-400 font-black uppercase tracking-widest text-[10px] sm:text-xs leading-relaxed max-w-2xl border-l-4 border-zinc-800 pl-4 sm:pl-6 italic mx-auto sm:mx-0">
              "{displayUser.bio}"
            </p>
          )}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 py-8 sm:py-10 border-t-2 border-zinc-800">
            {[{ label: 'FOLLOWERS', val: displayUser.stats.followers }, { label: 'FOLLOWING', val: displayUser.stats.following }, { label: 'BREWS', val: displayUser.stats.brews }].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[8px] sm:text-[10px] font-black text-zinc-200 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2">{s.label}</p>
                <p className="text-xl sm:text-3xl font-black text-white tracking-tighter">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex bg-black p-1 sm:p-2 rounded-2xl sm:rounded-3xl border-2 border-zinc-900 sticky top-18 sm:top-24 z-40 backdrop-blur-xl">
        {[{ id: 'activity', label: 'HISTORY', icon: <LayoutGrid className="w-4 h-4" /> }, { id: 'locker', label: 'GEAR', icon: <Settings2 className="w-4 h-4" /> }, { id: 'analytics', label: 'STATS', icon: <BarChart3 className="w-4 h-4" /> }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 sm:py-5 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all flex items-center justify-center gap-2 sm:gap-3 ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-zinc-200 hover:text-white'}`}>
            {tab.icon} <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="min-h-[400px]">
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            ) : activities.length > 0 ? (
              activities.map(a => (
                <PostCard
                  key={a.id}
                  activity={a}
                  onDelete={isMe ? handleDeleteActivity : undefined}
                />
              ))
            ) : (
              <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem] space-y-6 px-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center"><LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" /></div>
                <h3 className="text-zinc-100 font-black uppercase text-xs sm:text-base tracking-[0.3em] sm:tracking-[0.4em]">HISTORY EMPTY</h3>
              </div>
            )}
          </div>
        )}
        {activeTab === 'locker' && (
          <div className="animate-in fade-in duration-500 px-2 sm:px-0">
            {isMe && (
              <div className="mb-6">
                {!isAddingGear ? (
                  <button
                    onClick={() => setIsAddingGear(true)}
                    className="w-full py-5 rounded-2xl border-2 border-dashed border-zinc-800 text-zinc-100 hover:text-white hover:border-white transition-all font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> ADD GEAR
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                      <input
                        autoFocus
                        type="text"
                        value={newGearSearch}
                        onChange={e => setNewGearSearch(e.target.value)}
                        placeholder="SEARCH OR TYPE CUSTOM GEAR..."
                        className="w-full bg-black border-2 border-zinc-800 rounded-xl py-4 pl-11 pr-4 text-xs font-black text-white outline-none focus:border-white uppercase"
                      />
                    </div>
                    {newGearSearch.trim() && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {BREWING_DEVICES
                          .filter(d =>
                            d.name.toUpperCase().includes(newGearSearch.toUpperCase()) ||
                            d.brand.toUpperCase().includes(newGearSearch.toUpperCase())
                          )
                          .slice(0, 5)
                          .map(d => {
                            const fullName = `${d.brand} ${d.name}`.toUpperCase();
                            return (
                              <button
                                key={fullName}
                                onClick={() => handleAddGear(fullName)}
                                className="w-full text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-white text-white text-xs font-black uppercase transition-all"
                              >
                                {fullName}
                              </button>
                            );
                          })}
                        <button
                          onClick={() => handleAddGear(newGearSearch.toUpperCase())}
                          className="w-full text-left px-4 py-3 rounded-xl bg-zinc-800 border-2 border-white text-white text-xs font-black uppercase flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> ADD CUSTOM: {newGearSearch.toUpperCase()}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsAddingGear(false);
                        setNewGearSearch('');
                      }}
                      className="w-full py-3 rounded-xl bg-zinc-900 text-zinc-100 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
                    >
                      CANCEL
                    </button>
                  </div>
                )}
              </div>
            )}
            {displayUser.gear.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gear.map((item: any) => (
                  <div key={item.id} className="bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border-2 border-zinc-800 flex items-center justify-between group hover:border-white transition-all">
                    <div className="space-y-1">
                      <p className="text-[8px] sm:text-[9px] font-black text-zinc-200 uppercase tracking-widest">DEVICE</p>
                      <p className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter italic">{item.brand} {item.name}</p>
                    </div>
                    {isMe ? (
                      <button
                        onClick={() => handleDeleteGear(item.id)}
                        disabled={deletingGearId === item.id}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center hover:border-red-900 hover:bg-red-950 transition-all group"
                      >
                        {deletingGearId === item.id ? (
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-200 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 group-hover:text-red-400 transition-colors" />
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                        <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 group-hover:text-white transition-colors" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem] space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center"><Settings2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" /></div>
                <h3 className="text-zinc-100 font-black uppercase text-xs sm:text-base tracking-[0.4em]">LOCKER UNSET</h3>
              </div>
            )}
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-500">
            <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem] space-y-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center"><BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" /></div>
              <h3 className="text-zinc-100 font-black uppercase text-xs sm:text-base tracking-[0.4em]">COMING SOON</h3>
            </div>
          </div>
        )}
      </div>
      {isMe && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} userData={profileData} onSave={handleUpdateProfile} />}
    </div>
  );
};

export default ProfileView;
