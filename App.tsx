
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, User, Plus, Search, ChevronRight, Check, Users, X, MapPin, Loader2, Eye, EyeOff, Home, Mail, Phone, ShieldCheck, Navigation, Coffee } from 'lucide-react';
import FeedView from './views/Feed';
import ProfileView from './views/Profile';
import ExploreView from './views/Search';
import RoasterDatabase from './views/RoasterDatabase';
import BrewLogModal from './components/BrewLogModal';
import { BrewActivity, Club } from './types';
import { SettingsProvider } from './context/SettingsContext';
import { BREWING_DEVICES } from './data/database';

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

const OnboardingView: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isDetecting, setIsDetecting] = useState(false);
  const [formData, setFormData] = useState({
    id: Math.random().toString(36).substr(2, 9),
    firstName: '',
    lastName: '',
    email: '',
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
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(formData.email);
    }
    if (step === 3) return formData.city.trim().length > 1 && formData.country.trim().length > 1;
    if (step === 4) return formData.methods.length > 0;
    return true;
  };

  const handleComplete = () => {
    const finalData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.toUpperCase()
    };
    onComplete(finalData);
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

  // Trigger automatic location detection when entering Step 3
  useEffect(() => {
    if (step === 3 && !formData.city && !formData.country) {
      detectLocation();
    }
  }, [step]);

  const toggleMethod = (m: string) => {
    setFormData(prev => ({
      ...prev,
      methods: prev.methods.includes(m) ? prev.methods.filter(x => x !== m) : [...prev.methods, m]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-12 py-10">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">ELIXR</h1>
          <div className="flex justify-center gap-1 mt-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 w-8 rounded-full ${step >= s ? 'bg-white' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-10">
          {step === 1 && (
            <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6">
                <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em]">IDENTITY</p>
                <div className="space-y-4">
                  <input autoFocus type="text" value={formData.firstName} onChange={e => setFormData(p => ({...p, firstName: e.target.value.toUpperCase()}))} placeholder="FIRST NAME" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-3xl font-black text-white text-center uppercase tracking-tighter py-4" />
                  <input type="text" value={formData.lastName} onChange={e => setFormData(p => ({...p, lastName: e.target.value.toUpperCase()}))} placeholder="LAST NAME" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-3xl font-black text-white text-center uppercase tracking-tighter py-4" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">PRONOUNS</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {PRONOUN_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => setFormData(p => ({...p, pronouns: p.pronouns === opt ? '' : opt}))} className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.pronouns === opt ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-8">
                <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em]">CONTACT</p>
                <div className="space-y-6">
                  <div className="relative group">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-colors" />
                    <input autoFocus type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} placeholder="EMAIL ADDRESS" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl font-black text-white text-center uppercase tracking-tighter py-4 pl-8" />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700 group-focus-within:text-white transition-colors" />
                    <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} placeholder="PHONE" className="w-full bg-transparent border-b-4 border-zinc-800 focus:border-white outline-none text-xl font-black text-white text-center uppercase tracking-tighter py-4 pl-8" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em]">LOCATION</p>
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

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center">GEAR</p>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
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
                  <button key={`${d.brand}-${d.name}`} onClick={() => toggleMethod(`${d.brand} ${d.name}`.toUpperCase())} className={`py-5 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.methods.includes(`${d.brand} ${d.name}`.toUpperCase()) ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>{d.brand} {d.name}</button>
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
            {step > 1 && <button onClick={() => setStep(step - 1)} className="bg-zinc-900 text-zinc-500 p-7 rounded-3xl font-black hover:text-white transition-all"><X className="w-6 h-6" /></button>}
            <button disabled={!isStepValid()} onClick={() => step < 4 ? setStep(step + 1) : handleComplete()} className="flex-grow bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700 py-7 rounded-3xl font-black text-sm uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 active:scale-95">
              {step === 4 ? "INITIALIZE" : 'NEXT'} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar: React.FC<{ onLogBrew: () => void }> = ({ onLogBrew }) => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'FEED' },
    { path: '/explore', label: 'EXPLORE' },
    { path: '/roasters', label: 'ROASTERS' },
    { path: '/profile/me', label: 'PROFILE' },
  ];
  return (
    <nav className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900 hidden sm:block">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-20">
          <Link to="/" className="flex items-center"><span className="text-2xl font-black text-white tracking-tighter uppercase leading-none">ELIXR</span></Link>
          <div className="flex items-center space-x-8">
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <Link key={item.label} to={item.path} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${location.pathname === item.path ? 'text-white underline underline-offset-8 decoration-4' : 'text-zinc-500 hover:text-white'}`}>{item.label}</Link>
              ))}
            </div>
            <button onClick={onLogBrew} className="bg-white text-black px-8 py-3 rounded-2xl flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl shadow-white/5"><Plus className="w-4 h-4" /> <span>LOG BREW</span></button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const MobileHeader: React.FC = () => {
  return (
    <div className="sm:hidden sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-900 h-16 flex items-center px-6">
      <Link to="/" className="flex items-center">
        <span className="text-xl font-black text-white tracking-tighter uppercase leading-none">ELIXR</span>
      </Link>
    </div>
  );
};

const MobileNav: React.FC = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'FEED', icon: <Home className="w-6 h-6" /> },
    { path: '/explore', label: 'EXPLORE', icon: <Search className="w-6 h-6" /> },
    { path: '/roasters', label: 'ROASTERS', icon: <Coffee className="w-6 h-6" /> },
    { path: '/profile/me', label: 'PROFILE', icon: <User className="w-6 h-6" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl border-t border-zinc-900 sm:hidden flex justify-around items-center h-20 px-4">
      {navItems.map((item) => (
        <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-1 transition-all ${location.pathname === item.path ? 'text-white' : 'text-zinc-600'}`}>
          {item.icon}
          <span className="text-[8px] font-black tracking-widest">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const App: React.FC = () => {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [activities, setActivities] = useState<BrewActivity[]>([]);
  const [discoveredPeers, setDiscoveredPeers] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('elixr_profile_v7');
    if (saved) setOnboardingData(JSON.parse(saved));
    const savedPeers = localStorage.getItem('elixr_discovered_peers_v7');
    if (savedPeers) setDiscoveredPeers(JSON.parse(savedPeers));
    const savedActivities = localStorage.getItem('elixr_my_activities_v7');
    if (savedActivities) setActivities(JSON.parse(savedActivities));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedUser = params.get('u');
    if (encodedUser) {
      try {
        const decoded = JSON.parse(atob(encodedUser));
        if (decoded && decoded.id && decoded.id !== onboardingData?.id) {
          setDiscoveredPeers(prev => {
            if (prev.find(p => p.id === decoded.id)) return prev;
            const next = [...prev, decoded];
            localStorage.setItem('elixr_discovered_peers_v7', JSON.stringify(next));
            return next;
          });
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
      } catch (e) { console.error("Discovery failed", e); }
    }
  }, [onboardingData]);

  const handleOnboarding = (data: any) => {
    setOnboardingData(data);
    localStorage.setItem('elixr_profile_v7', JSON.stringify(data));
  };

  const handleUpdateProfile = (updatedData: any) => {
    const newData = { ...onboardingData, ...updatedData };
    setOnboardingData(newData);
    localStorage.setItem('elixr_profile_v7', JSON.stringify(newData));
  };

  const handleShare = (newActivity: BrewActivity) => {
    const updated = [{...newActivity, userName: onboardingData?.name || 'BREWER', userId: 'me', userAvatar: onboardingData?.avatar || '', likedBy: [], likeCount: 0, comments: [], isPrivate: onboardingData?.isPrivate || false}, ...activities];
    setActivities(updated);
    localStorage.setItem('elixr_my_activities_v7', JSON.stringify(updated));
    setIsLogModalOpen(false);
  };

  const handleDeleteActivity = (activityId: string) => {
    const updated = activities.filter(a => a.id !== activityId);
    setActivities(updated);
    localStorage.setItem('elixr_my_activities_v7', JSON.stringify(updated));
  };

  if (!onboardingData) return <OnboardingView onComplete={handleOnboarding} />;

  return (
    <SettingsProvider>
      <Router>
        <PageTitle />
        <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black pb-24 sm:pb-0">
          <Navbar onLogBrew={() => setIsLogModalOpen(true)} />
          <MobileHeader />
          <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 sm:py-12">
            <Routes>
              <Route path="/" element={<FeedView activities={activities} following={discoveredPeers.map(p => p.id)} discoveredPeers={discoveredPeers} onDeleteActivity={handleDeleteActivity} />} />
              <Route path="/explore" element={<ExploreView currentUser={onboardingData} discoveredPeers={discoveredPeers} following={discoveredPeers.map(p => p.id)} />} />
              <Route path="/roasters" element={<RoasterDatabase />} />
              <Route path="/profile/:userId" element={<ProfileView userActivities={activities} following={discoveredPeers.map(p => p.id)} discoveredPeers={discoveredPeers} />} />
              <Route path="/profile/me" element={<ProfileView isMe={true} following={discoveredPeers.map(p => p.id)} userData={onboardingData} userActivities={activities} onUpdateProfile={handleUpdateProfile} onDeleteActivity={handleDeleteActivity} />} />
            </Routes>
          </main>
          <MobileNav />
          <button onClick={() => setIsLogModalOpen(true)} className="fixed bottom-24 right-6 z-30 bg-white text-black w-16 h-16 rounded-full flex items-center justify-center shadow-2xl sm:hidden active:scale-90 transition-all">
            <Plus className="w-8 h-8" />
          </button>
          <BrewLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} onShare={handleShare} userCity={onboardingData.city} userCountry={onboardingData.country} />
        </div>
      </Router>
    </SettingsProvider>
  );
};

export default App;
