
import React, { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Bookmark, LayoutGrid, BarChart3, User as UserIcon, Settings2, X, Plus, Image as ImageIcon, Search, Lock, Eye, EyeOff, Share2, Check, Trash2 } from 'lucide-react';
import { PEERS, BREWING_DEVICES } from '../data/database';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  onSave: (data: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, userData, onSave }) => {
  // Try to split existing name if firstName/lastName aren't present
  const initialFirstName = userData.firstName || (userData.name?.split(' ')[0] || '');
  const initialLastName = userData.lastName || (userData.name?.split(' ').slice(1).join(' ') || '');
  
  const [formData, setFormData] = useState({ 
    ...userData,
    firstName: initialFirstName,
    lastName: initialLastName
  });
  const [searchQuery, setSearchQuery] = useState('');
  const mediaInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const toggleMethod = (m: string) => setFormData((prev: any) => ({ ...prev, methods: prev.methods.includes(m) ? prev.methods.filter((x: string) => x !== m) : [...prev.methods, m] }));
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData((prev: any) => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = () => {
    const finalData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.toUpperCase()
    };
    onSave(finalData);
    onClose();
  };

  const filteredDevices = BREWING_DEVICES.filter(d => d.name.toUpperCase().includes(searchQuery.toUpperCase()) || d.brand.toUpperCase().includes(searchQuery.toUpperCase()));
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 w-full max-w-2xl h-full sm:h-auto sm:rounded-[3rem] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col sm:max-h-[90vh] animate-in zoom-in-95">
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">EDIT PROFILE</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
        <form className="overflow-y-auto px-6 sm:px-10 py-10 space-y-12 pb-32 custom-scrollbar">
          <section className="flex flex-col items-center gap-6">
            <div onClick={() => mediaInputRef.current?.click()} className="w-32 h-32 rounded-3xl border-4 border-zinc-800 bg-black flex items-center justify-center overflow-hidden cursor-pointer hover:border-white transition-all group relative">
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover grayscale" alt="" /> : <UserIcon className="w-12 h-12 text-zinc-800" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><ImageIcon className="w-8 h-8 text-white" /></div>
            </div>
            <input type="file" ref={mediaInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TAP TO CHANGE PHOTO</p>
          </section>
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">FIRST NAME</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">LAST NAME</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" />
              </div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">PRONOUNS</label><input type="text" value={formData.pronouns} onChange={e => setFormData({...formData, pronouns: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">CITY</label><input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">COUNTRY</label><input type="text" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" /></div>
            </div>
            <div className="space-y-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">BIO</label><textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value.toUpperCase()})} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase min-h-[100px] resize-none" placeholder="SHARE YOUR BREW PHILOSOPHY..." /></div>
          </section>
          <div className="sticky bottom-0 pt-10 pb-12 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent"><button type="button" onClick={handleSave} className="w-full bg-white text-black font-black text-sm uppercase tracking-[0.4em] py-7 rounded-[2.5rem] shadow-2xl transition-all active:scale-[0.98]">SAVE CHANGES</button></div>
        </form>
      </div>
    </div>
  );
};

interface ProfileViewProps {
  isMe?: boolean;
  following: string[];
  userData?: any;
  userActivities: any[];
  discoveredPeers?: any[];
  onUpdateProfile?: (data: any) => void;
  onDeleteActivity?: (activityId: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isMe, following, userData, userActivities, discoveredPeers = [], onUpdateProfile, onDeleteActivity }) => {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<'activity' | 'locker' | 'analytics'>('activity');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const activities = isMe ? userActivities : [];
  const hasData = activities.length > 0;

  const displayUser = useMemo(() => {
    if (isMe) {
      return {
        id: userData?.id,
        name: userData?.name || 'NEW MEMBER',
        pronouns: userData?.pronouns || '',
        bio: userData?.bio || '',
        location: (userData?.city && userData?.country) ? `${userData.city}, ${userData.country}` : 'UNKNOWN',
        stats: { followers: '0', following: following.length.toString(), brews: activities.length.toString() },
        avatar: userData?.avatar || '',
        gear: userData?.methods || [],
        isPrivate: userData?.isPrivate || false
      };
    }
    const peer = PEERS.find(p => p.id === userId) || discoveredPeers.find(p => p.id === userId);
    if (peer) {
      return {
        id: peer.id,
        name: peer.name,
        pronouns: peer.pronouns || '',
        bio: peer.bio || '',
        location: peer.location || `${peer.city}, ${peer.country}`,
        stats: { followers: '0', following: '0', brews: peer.brews?.toString() || '0' },
        avatar: peer.avatar,
        gear: peer.methods || [],
        isPrivate: peer.isPrivate || false
      };
    }
    return { name: 'NOT FOUND', pronouns: '', bio: '', location: 'UNKNOWN', stats: { followers: '0', following: '0', brews: '0' }, avatar: '', gear: [], isPrivate: false };
  }, [isMe, userData, following, activities, userId, discoveredPeers]);

  const shareProfile = () => {
    if (!isMe || !userData) return;
    const encoded = btoa(JSON.stringify(userData));
    const url = `${window.location.origin}${window.location.pathname}?u=${encoded}${window.location.hash}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="bg-zinc-900 rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border-2 border-zinc-800 shadow-2xl relative">
        <div className="h-32 sm:h-40 bg-zinc-950 flex items-center justify-center"></div>
        {isMe && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 sm:gap-3">
             <button onClick={shareProfile} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all shadow-xl z-10 flex items-center gap-2">
                {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest hidden sm:inline">{copied ? 'LINK COPIED' : 'SHARE PROFILE'}</span>
             </button>
             <button onClick={() => setIsEditModalOpen(true)} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black border-2 border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all shadow-xl z-10"><Settings2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          </div>
        )}
        <div className="px-6 sm:px-10 pb-8 sm:pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-12 sm:-mt-16 mb-6 sm:mb-8 gap-4 sm:gap-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-zinc-900 bg-white flex items-center justify-center overflow-hidden shadow-2xl shrink-0">
              {displayUser.avatar ? <img src={displayUser.avatar} className="w-full h-full object-cover grayscale" alt="" /> : <UserIcon className="w-10 h-10 sm:w-14 sm:h-14 text-black" />}
            </div>
            <div className="sm:pb-2 flex-grow text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-tight sm:leading-none">{displayUser.name}</h1>
                {displayUser.isPrivate && <span title="Private Profile"><Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-700" /></span>}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 sm:mt-3">
                <p className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] sm:tracking-[0.4em]">{displayUser.location}</p>
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
                <p className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2">{s.label}</p>
                <p className="text-xl sm:text-3xl font-black text-white tracking-tighter">{s.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex bg-black p-1 sm:p-2 rounded-2xl sm:rounded-3xl border-2 border-zinc-900 sticky top-18 sm:top-24 z-40 backdrop-blur-xl">
        {[{ id: 'activity', label: 'HISTORY', icon: <LayoutGrid className="w-4 h-4" /> }, { id: 'locker', label: 'GEAR', icon: <Settings2 className="w-4 h-4" /> }, { id: 'analytics', label: 'STATS', icon: <BarChart3 className="w-4 h-4" /> }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-4 sm:py-5 px-1 sm:px-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all flex items-center justify-center gap-2 sm:gap-3 ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-zinc-600 hover:text-white'}`}>
            {tab.icon} <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="min-h-[400px]">
        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {hasData ? (
               activities.map(a => (
                 <div key={a.id} className="bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] border-2 border-zinc-800 hover:border-white transition-all group">
                   <div className="flex items-start justify-between gap-4">
                     <div className="flex-grow">
                       <h4 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-3 group-hover:translate-x-2 transition-transform">{a.title}</h4>
                       <div className="flex gap-4">
                         <p className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-lg">{a.roaster}</p>
                         <p className="text-[10px] sm:text-[11px] font-black text-zinc-500 uppercase tracking-widest px-3 py-1 border border-zinc-800 rounded-lg">{a.rating.toFixed(1)}/10</p>
                       </div>
                     </div>
                     {isMe && onDeleteActivity && (
                       <button
                         onClick={() => {
                           if (confirm('Delete this brew log? This action cannot be undone.')) {
                             onDeleteActivity(a.id);
                           }
                         }}
                         className="text-zinc-600 hover:text-red-500 transition-all p-2"
                         title="Delete this brew log"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                     )}
                   </div>
                 </div>
               ))
            ) : (
              <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem] space-y-6 px-6">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center"><LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" /></div>
                 <h3 className="text-zinc-500 font-black uppercase text-xs sm:text-base tracking-[0.3em] sm:tracking-[0.4em]">HISTORY EMPTY</h3>
              </div>
            )}
          </div>
        )}
        {activeTab === 'locker' && (
          <div className="animate-in fade-in duration-500 px-2 sm:px-0">
            {displayUser.gear.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayUser.gear.map((item: string) => (
                  <div key={item} className="bg-zinc-900 p-6 sm:p-8 rounded-[2rem] border-2 border-zinc-800 flex items-center justify-between group hover:border-white transition-all">
                    <div className="space-y-1"><p className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest">DEVICE</p><p className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter italic">{item}</p></div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center"><Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800 group-hover:text-white transition-colors" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem] space-y-6">
                 <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl mx-auto flex items-center justify-center"><Settings2 className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" /></div>
                 <h3 className="text-zinc-500 font-black uppercase text-xs sm:text-base tracking-[0.4em]">LOCKER UNSET</h3>
              </div>
            )}
          </div>
        )}
      </div>
      {isMe && onUpdateProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} userData={userData} onSave={onUpdateProfile} />}
    </div>
  );
};
export default ProfileView;
