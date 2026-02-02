import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { User, Plus, Search, ChevronRight, Check, X, MapPin, Loader2, Eye, EyeOff, Home, Mail, Phone, Coffee, ShoppingBag, Bell } from 'lucide-react';
import FeedView from './views/Feed';
import ProfileView from './views/Profile';
import ExploreView from './views/Search';
import CoffeeShopView from './views/CoffeeShop';
import AuthView from './views/AuthView';
import AdminRoasters from './views/AdminRoasters';
import AdminEquipment from './views/AdminEquipment';
import AdminCoffees from './views/AdminCoffees';
import AdminCafes from './views/AdminCafes';
import CafeProfile from './views/CafeProfile';
import BrewLogModal from './components/BrewLogModal';
import BrewLogDetailModal from './components/BrewLogDetailModal';
import NotificationsPanel from './components/NotificationsPanel';
import { BrewActivity } from './types';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { createProfile, createActivity, deleteActivity, getUnreadNotificationCount, getPendingFollowRequestCount } from './lib/database';
import { BREWING_DEVICES } from './data/database';
import { supabase } from './lib/supabase';
// Migration utility removed - not needed for new installations

const PageTitle: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'ELIXR';

    if (path === '/' || path === '') {
      title = 'ELIXR - Feed';
    } else if (path.startsWith('/profile/me')) {
      title = 'ELIXR - My Profile';
    } else if (path.startsWith('/profile/')) {
      title = 'ELIXR - Profile';
    } else if (path.startsWith('/explore')) {
      title = 'ELIXR - Explore';
    } else if (path.startsWith('/roasters')) {
      title = 'ELIXR - Roasters';
    }

    document.title = title;
  }, [location]);

  return null;
};

const formatCountryAcronym = (country: string): string => {
  if (!country) return '';
  const c = country.trim().toUpperCase();
  if (c.includes('UNITED STATES') || c === 'USA' || c === 'US' || c === 'AMERICA') return 'USA';
  if (c.includes('UNITED KINGDOM') || c === 'UK' || c === 'GB') return 'UK';
  if (c.includes('UNITED ARAB EMIRATES') || c === 'UAE') return 'UAE';
  if (c.includes('EUROPEAN UNION') || c === 'EU') return 'EU';
  const stopWords = ['OF', 'THE', 'AND', 'FOR', 'A', 'AN', 'IN', 'WITH'];
  const words = c.split(/[\s-]+/).filter(w => w.length > 0 && !stopWords.includes(w));
  return words.length > 1 ? words.map(w => w[0]).join('') : c;
};

const PRONOUN_OPTIONS = ['HE/HIM', 'SHE/HER', 'THEY/THEM', 'OTHER'];

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetupView: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [isDetecting, setIsDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    pronouns: '',
    city: '',
    country: '',
    methods: [] as string[],
    isPrivate: false,
    bio: '',
    avatar: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDevices = BREWING_DEVICES.filter(d =>
    d.name.toUpperCase().includes(searchQuery.toUpperCase()) ||
    d.brand.toUpperCase().includes(searchQuery.toUpperCase())
  );

  const isStepValid = () => {
    if (step === 1) {
      return formData.firstName.trim().length >= 1 && formData.lastName.trim().length >= 1;
    }
    if (step === 2) {
      return formData.city.trim().length > 1 && formData.country.trim().length > 1;
    }
    if (step === 3) return formData.methods.length > 0;
    return true;
  };

  const handleComplete = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }

    setLoading(true);
    console.log('Starting profile creation...');
    console.log('Form data:', formData);

    try {
      // Generate username from email
      const username = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(7);
      console.log('Generated username:', username);

      // Create profile in Supabase
      console.log('Creating profile...');
      const profile = await createProfile(user.id, {
        username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        pronouns: formData.pronouns,
        city: formData.city,
        country: formData.country,
        avatar_url: formData.avatar,
        bio: formData.bio,
        is_private: formData.isPrivate
      });

      console.log('Profile created:', profile);

      if (profile) {
        // Add gear items
        if (formData.methods.length > 0) {
          console.log('Adding gear items:', formData.methods);
          const { supabase } = await import('./lib/supabase');
          const gearPromises = formData.methods.map(method => {
            const parts = method.split(' ');
            const brand = parts[0] || 'Unknown';
            const name = parts.slice(1).join(' ') || method;

            return supabase.from('gear_items').insert({
              profile_id: profile.id,
              name,
              brand,
              type: 'brewer'
            });
          });

          const gearResults = await Promise.all(gearPromises);
          console.log('Gear added:', gearResults);
        }

        console.log('Refreshing profile...');
        await refreshProfile();
        console.log('Profile setup complete!');
        onComplete();
      } else {
        console.error('Profile creation returned null');
        alert('Failed to create profile. Please try again.');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          city: (data.city || data.locality || '').toUpperCase(),
          country: formatCountryAcronym(data.countryName || '')
        }));
      } catch (error) {
        console.warn("Location detection failed", error);
      } finally {
        setIsDetecting(false);
      }
    }, () => setIsDetecting(false));
  };

  useEffect(() => {
    if (step === 2 && !formData.city && !formData.country) {
      detectLocation();
    }
  }, [step]);

  const toggleMethod = (m: string) => {
    setFormData(prev => {
      const newMethods = prev.methods.includes(m) ? prev.methods.filter(x => x !== m) : [...prev.methods, m];
      console.log('Selected devices:', newMethods);
      return {
        ...prev,
        methods: newMethods
      };
    });
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 sm:space-y-12 py-6 sm:py-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-black tracking-tighter uppercase leading-none">ELIXR</h1>
          <div className="flex justify-center gap-1 mt-4 sm:mt-6">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-black' : 'bg-zinc-300'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-8 sm:space-y-10">
          {step === 1 && (
            <div className="space-y-6 sm:space-y-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-5 sm:space-y-6">
                <p className="text-[11px] sm:text-[12px] font-black text-zinc-100 uppercase tracking-[0.3em]">IDENTITY</p>
                <div className="space-y-3 sm:space-y-4">
                  <input type="text" value={formData.firstName} onChange={e => setFormData(p => ({...p, firstName: e.target.value.toUpperCase()}))} placeholder="FIRST NAME" autoCapitalize="words" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl sm:text-3xl font-black text-white text-center uppercase tracking-tighter py-3 sm:py-4" />
                  <input type="text" value={formData.lastName} onChange={e => setFormData(p => ({...p, lastName: e.target.value.toUpperCase()}))} placeholder="LAST NAME" autoCapitalize="words" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl sm:text-3xl font-black text-white text-center uppercase tracking-tighter py-3 sm:py-4" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.2em]">PRONOUNS</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {PRONOUN_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setFormData(p => ({...p, pronouns: p.pronouns === opt ? '' : opt}))} className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.pronouns === opt ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-100'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[12px] font-black text-zinc-100 uppercase tracking-[0.3em]">LOCATION</p>
                  {isDetecting && <div className="flex items-center gap-2 text-[8px] font-black text-white animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> DISCOVERING...</div>}
                </div>
                <div className="space-y-4">
                  <input autoFocus type="text" value={formData.city} onChange={e => setFormData(p => ({...p, city: e.target.value.toUpperCase()}))} placeholder="CITY" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-3xl font-black text-white text-center uppercase tracking-tighter py-4" />
                  <input type="text" value={formData.country} onChange={e => setFormData(p => ({...p, country: formatCountryAcronym(e.target.value)}))} placeholder="COUNTRY" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-3xl font-black text-white text-center uppercase tracking-tighter py-4" />
                </div>
              </div>
              <div className="space-y-4">
                <button onClick={() => setFormData(p => ({...p, isPrivate: !p.isPrivate}))} className={`w-full py-5 rounded-2xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${formData.isPrivate ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-white text-black border-white'}`}>
                  {formData.isPrivate ? <><EyeOff className="w-4 h-4" /> PRIVATE PROFILE</> : <><Eye className="w-4 h-4" /> PUBLIC PROFILE</>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-[12px] font-black text-zinc-100 uppercase tracking-[0.3em] text-center">GEAR</p>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="SEARCH OR ADD GEAR..." className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black text-white outline-none focus:border-white uppercase" />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {searchQuery.trim() !== '' && !filteredDevices.some(d => `${d.brand} ${d.name}`.toUpperCase() === searchQuery.toUpperCase()) && (
                  <button
                    onClick={() => {
                      toggleMethod(searchQuery.toUpperCase());
                      setSearchQuery('');
                    }}
                    className="col-span-full py-5 rounded-2xl border-2 border-white bg-zinc-800 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3 h-3" /> ADD CUSTOM: {searchQuery.toUpperCase()}
                  </button>
                )}

                {filteredDevices.map(d => (
                  <button key={`${d.brand}-${d.name}`} onClick={() => toggleMethod(`${d.brand} ${d.name}`.toUpperCase())} className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.methods.includes(`${d.brand} ${d.name}`.toUpperCase()) ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700'}`}>{d.brand} {d.name}</button>
                ))}

                {filteredDevices.length === 0 && searchQuery.trim() === '' && (
                  <div className="col-span-full py-10 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">
                    BEGIN TYPING TO FILTER
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="bg-zinc-900 text-zinc-100 p-7 rounded-3xl font-black hover:text-white transition-all"><X className="w-6 h-6" /></button>}
            <button disabled={!isStepValid() || loading} onClick={() => step < 3 ? setStep(step + 1) : handleComplete()} className="flex-grow bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700 py-7 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> CREATING</>
              ) : (
                <>{step === 3 ? "COMPLETE SETUP" : 'NEXT'} <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC<{ onLogBrew: () => void; onOpenNotifications: () => void; notificationCount: number }> = ({ onLogBrew, onOpenNotifications, notificationCount }) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: '/', label: 'FEED' },
    { path: '/explore', label: 'EXPLORE' },
    { path: '/coffee-shop', label: 'MARKETPLACE' },
    { path: '/profile/me', label: 'PROFILE' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b-2 border-black hidden sm:block">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <Link to="/" className="flex items-center"><span className="text-2xl font-black text-black tracking-tighter uppercase leading-none">ELIXR</span></Link>
          <div className="flex items-center space-x-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link key={item.label} to={item.path} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === item.path ? 'text-black underline underline-offset-8 decoration-4' : 'text-zinc-600 hover:text-black active:text-black'}`}>{item.label}</Link>
              ))}
            </div>
            <button onClick={onOpenNotifications} className="relative p-3 rounded-xl border-2 border-zinc-300 text-zinc-600 hover:text-black hover:border-black active:border-black transition-all">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            <button onClick={onLogBrew} className="bg-black text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl border-2 border-black hover:bg-zinc-900"><Plus className="w-4 h-4" /> <span>LOG BREW</span></button>
            <button onClick={signOut} className="px-5 py-2 rounded-xl border-2 border-zinc-300 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-black hover:border-black active:border-black transition-all">SIGN OUT</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const MobileHeader: React.FC<{ onOpenNotifications: () => void; notificationCount: number }> = ({ onOpenNotifications, notificationCount }) => {
  return (
    <div className="sm:hidden sticky top-0 z-40 bg-white border-b-2 border-black h-16 flex items-center justify-between px-6">
      <Link to="/" className="flex items-center">
        <span className="text-xl font-black text-black tracking-tighter uppercase leading-none">ELIXR</span>
      </Link>
      <button onClick={onOpenNotifications} className="relative p-2 rounded-xl border-2 border-zinc-300 text-zinc-600 hover:text-black hover:border-black active:border-black transition-all">
        <Bell className="w-5 h-5" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>
    </div>
  );
};

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'FEED', icon: <Home className="w-6 h-6" /> },
    { path: '/explore', label: 'EXPLORE', icon: <Search className="w-6 h-6" /> },
    { path: '/coffee-shop', label: 'MARKET', icon: <ShoppingBag className="w-6 h-6" /> },
    { path: '/profile/me', label: 'PROFILE', icon: <User className="w-6 h-6" /> },
  ];
  return (
    <nav className="bg-zinc-100 border-t-2 border-zinc-300 sm:hidden flex justify-around items-center h-20 px-2 shadow-2xl shadow-black/5">
      {navItems.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all min-h-[44px] min-w-[44px] ${
            location.pathname === item.path
              ? 'text-black border-black bg-black/10'
              : 'text-zinc-600 border-transparent active:text-black active:border-zinc-300'
          }`}
        >
          {item.icon}
          <span className="text-[8px] font-black tracking-widest">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const AppContent: React.FC = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // Load notification count
  useEffect(() => {
    if (!profile) return;

    const loadNotificationCount = async () => {
      const unreadCount = await getUnreadNotificationCount(profile.id);
      const pendingRequests = await getPendingFollowRequestCount(profile.id);
      setNotificationCount(unreadCount + pendingRequests);
    };

    loadNotificationCount();

    // Subscribe to notification changes
    const notifChannel = supabase
      .channel('notification_count_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profile.id}`
        },
        loadNotificationCount
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follow_requests',
          filter: `requested_id=eq.${profile.id}`
        },
        loadNotificationCount
      )
      .subscribe();

    return () => {
      notifChannel.unsubscribe();
    };
  }, [profile]);

  // Debug logging
  console.log('AppContent state:', { loading, hasUser: !!user, hasProfile: !!profile });

  // Show loading screen while checking auth
  if (loading) {
    console.log('Showing loading screen');
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">ELIXR</h1>
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Show auth view if no user
  if (!user) {
    return <AuthView />;
  }

  // Show profile setup if no profile
  if (!profile) {
    return <ProfileSetupView onComplete={() => {}} />;
  }

  // Show main app
  return (
    <Router>
      <PageTitle />
      <div className="min-h-screen flex flex-col bg-white text-black selection:bg-black selection:text-white">
        <Navbar
          onLogBrew={() => setIsLogModalOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={notificationCount}
        />
        <MobileHeader
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={notificationCount}
        />
        <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 sm:py-12">
          <Routes>
            <Route path="/" element={<FeedView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/coffee-shop" element={<CoffeeShopView />} />
            <Route path="/admin/roasters" element={<AdminRoasters />} />
            <Route path="/admin/equipment" element={<AdminEquipment />} />
            <Route path="/admin/coffees" element={<AdminCoffees />} />
            <Route path="/admin/cafes" element={<AdminCafes />} />
            <Route path="/cafe/:cafeId" element={<CafeProfile />} />
            <Route path="/profile/me" element={<ProfileView isMe={true} />} />
            <Route path="/profile/:userId" element={<ProfileView />} />
          </Routes>
        </main>
        <MobileNav />
        <button onClick={() => setIsLogModalOpen(true)} className="fixed bottom-28 right-6 z-30 bg-black text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl shadow-black/20 border-4 border-white sm:hidden active:scale-90 transition-all">
          <Plus className="w-8 h-8" />
        </button>
        <BrewLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
        <NotificationsPanel
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onActivityClick={(activityId) => setSelectedActivityId(activityId)}
        />
        {selectedActivityId && (
          <BrewLogDetailModal
            activityId={selectedActivityId}
            onClose={() => setSelectedActivityId(null)}
            onDelete={async (activityId) => {
              await deleteActivity(activityId);
              setSelectedActivityId(null);
            }}
          />
        )}
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
