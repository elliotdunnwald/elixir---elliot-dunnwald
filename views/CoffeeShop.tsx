import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Coffee, Search, X, MapPin, Sparkles, Flame, Loader2, ShoppingBag, Calendar, DollarSign, Plus, Package } from 'lucide-react';
import Fuse from 'fuse.js';
import { getCoffeeOfferings, getRoasters, trackRoasterSubmission, trackEquipmentSubmission } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

// Type definitions
interface CoffeeOffering {
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
  tasting_notes?: string[];
  elevation?: string;
  available: boolean;
  price?: number;
  size?: string;
  roaster?: {
    id: string;
    name: string;
    city: string;
    country: string;
    website?: string;
  };
}

interface RoasterWithOfferings {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  website?: string;
  foundedYear?: number;
  offerings: CoffeeOffering[];
}

// Roaster logo component using favicons
const RoasterLogo: React.FC<{ roasterName?: string; size?: number }> = ({ roasterName, size = 16 }) => {
  if (roasterName?.toLowerCase().includes('blue bottle')) {
    return (
      <img
        src="https://bluebottlecoffee.com/favicon.ico"
        alt="Blue Bottle Coffee"
        className="object-contain"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  if (roasterName?.toLowerCase().includes('onyx')) {
    return (
      <img
        src="https://onyxcoffeelab.com/favicon.ico"
        alt="Onyx Coffee Lab"
        className="object-contain"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return <Coffee className="text-black" style={{ width: size, height: size }} />;
};

// Helper function for roast level colors
const getRoastLevelColor = (level?: string) => {
  if (!level) return 'bg-zinc-50';
  const l = level.toLowerCase();
  if (l.includes('light')) return 'bg-amber-900';
  if (l.includes('medium')) return 'bg-orange-900';
  if (l.includes('dark')) return 'bg-stone-900';
  return 'bg-zinc-50';
};

const CoffeeShopView: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [roastersWithOfferings, setRoastersWithOfferings] = useState<RoasterWithOfferings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<RoasterWithOfferings | null>(null);
  const [showRoasterSubmit, setShowRoasterSubmit] = useState(false);
  const [showEquipmentSubmit, setShowEquipmentSubmit] = useState(false);
  const [activeView, setActiveView] = useState<'main' | 'roasters' | 'equipment'>('main');

  // Quick filter suggestions
  const quickFilters = [
    { label: 'Ethiopia', icon: '🇪🇹' },
    { label: 'Kenya', icon: '🇰🇪' },
    { label: 'Colombia', icon: '🇨🇴' },
    { label: 'Natural', icon: '☀️' },
    { label: 'Washed', icon: '💧' },
    { label: 'Anaerobic', icon: '🔬' },
    { label: 'Gesha', icon: '✨' },
    { label: 'SL-28', icon: '🌱' },
    { label: 'Bourbon', icon: '🍒' }
  ];

  const handleQuickFilter = (filter: string) => {
    setSearchQuery(filter);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle roaster selection from navigation state
  useEffect(() => {
    const state = location.state as { selectedRoaster?: string } | null;
    if (state?.selectedRoaster && roastersWithOfferings.length > 0) {
      const roaster = roastersWithOfferings.find(
        r => r.name.toLowerCase() === state.selectedRoaster.toLowerCase()
      );
      if (roaster) {
        setSelectedRoaster(roaster);
        setActiveView('main');
      }
    }
  }, [location.state, roastersWithOfferings]);

  async function loadData() {
    setLoading(true);
    try {
      const [coffeesData, roastersData] = await Promise.all([
        getCoffeeOfferings(),
        getRoasters()
      ]);

      // Group coffees by roaster
      const roasterMap = new Map<string, RoasterWithOfferings>();

      roastersData.forEach(roaster => {
        roasterMap.set(roaster.id, {
          id: roaster.id,
          name: roaster.name,
          city: roaster.city,
          state: roaster.state,
          country: roaster.country,
          website: roaster.website,
          foundedYear: roaster.founded_year,
          offerings: []
        });
      });

      coffeesData.forEach(coffee => {
        if (coffee.roaster_id && roasterMap.has(coffee.roaster_id)) {
          roasterMap.get(coffee.roaster_id)!.offerings.push(coffee);
        }
      });

      // Sort roasters alphabetically (show all roasters, even without offerings)
      const roastersArray = Array.from(roasterMap.values())
        .sort((a, b) => a.name.localeCompare(b.name));

      setRoastersWithOfferings(roastersArray);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fuse.js search configuration
  const fuse = useMemo(() => {
    return new Fuse(roastersWithOfferings, {
      keys: [
        { name: 'name', weight: 2 },
        'city',
        'country',
        { name: 'offerings.name', weight: 1.5 },
        { name: 'offerings.origin', weight: 2 },
        { name: 'offerings.region', weight: 1.5 },
        { name: 'offerings.estate', weight: 1 },
        { name: 'offerings.varietals', weight: 2 },
        { name: 'offerings.processing', weight: 2 },
        { name: 'offerings.tasting_notes', weight: 1 },
        'offerings.roast_level'
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [roastersWithOfferings]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return roastersWithOfferings;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse, roastersWithOfferings]);

  const totalOfferings = roastersWithOfferings.reduce((sum, r) => sum + r.offerings.length, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main view with 2 placards */}
      {activeView === 'main' && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase">MARKETPLACE</h1>
            <p className="text-xs text-zinc-900 mt-2 tracking-wider uppercase">
              EXPLORE ROASTERS & EQUIPMENT
            </p>
          </div>

          {/* Placards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* Roasters Placard */}
            <div
              onClick={() => setActiveView('roasters')}
              className="bg-zinc-50 border-2 border-zinc-900 rounded-3xl p-16 hover:border-white transition-all cursor-pointer group"
            >
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase mb-3 group-hover:text-black transition-colors">ROASTERS</h2>
                  <p className="text-lg text-zinc-600 uppercase tracking-wider font-black">
                    {roastersWithOfferings.length} ROASTERS • {totalOfferings} OFFERINGS
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment Placard */}
            <div
              onClick={() => setActiveView('equipment')}
              className="bg-zinc-50 border-2 border-zinc-900 rounded-3xl p-16 hover:border-white transition-all cursor-pointer group"
            >
              <div className="space-y-6 text-center">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter uppercase mb-3 group-hover:text-black transition-colors">EQUIPMENT</h2>
                  <p className="text-lg text-zinc-600 uppercase tracking-wider font-black">
                    BREWERS • GRINDERS • ACCESSORIES
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roasters view */}
      {activeView === 'roasters' && (
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveView('main');
              setSearchQuery('');
            }}
            className="bg-zinc-50 border-2 border-zinc-900 text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:border-white transition-all"
          >
            ← BACK
          </button>
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase">ROASTERS</h1>
            <p className="text-xs text-zinc-900 mt-2 tracking-wider uppercase">
              {roastersWithOfferings.length} ROASTERS • {totalOfferings} OFFERINGS
            </p>
          </div>
          <button
            onClick={() => setShowRoasterSubmit(true)}
            className="bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center gap-2"
          >
            <Coffee className="w-4 h-4" />
            <span className="hidden sm:inline">SUBMIT ROASTER</span>
          </button>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY ROASTER, ORIGIN, VARIETAL, PROCESS, OR ESTATE..."
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-black text-black outline-none focus:border-white uppercase placeholder:text-zinc-700"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-black transition-colors border-2 border-zinc-300 hover:border-white rounded-lg p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Count */}
        {searchQuery && searchResults.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600 font-black uppercase tracking-wider">
              {searchResults.length} roaster{searchResults.length !== 1 ? 's' : ''} found
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-600 font-black uppercase tracking-wider">
              {searchResults.reduce((sum, r) => sum + r.offerings.length, 0)} total offerings
            </span>
          </div>
        )}

        {/* Roasters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchResults.map(roaster => {
            // Show matching offerings preview if searching
            const matchingOfferings = searchQuery
              ? roaster.offerings.filter(o =>
                  o.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  o.varietals.some(v => v.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  o.processing.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (o.region && o.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (o.estate && o.estate.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (o.tasting_notes && o.tasting_notes.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())))
                ).slice(0, 3)
              : [];

            return (
              <div
                key={roaster.id}
                onClick={() => setSelectedRoaster(roaster)}
                className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-10 hover:border-white transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter group-hover:text-black transition-colors">{roaster.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-900">
                      <MapPin className="w-3 h-3" />
                      <span>{roaster.city}, {roaster.country}</span>
                    </div>
                  </div>
                  {roaster.foundedYear && (
                    <div className="flex items-center gap-2 text-xs text-zinc-700">
                      <Calendar className="w-3 h-3" />
                      <span>EST. {roaster.foundedYear}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-zinc-300">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2">
                      <ShoppingBag className="w-3 h-3" />
                      <span>{roaster.offerings.length} OFFERING{roaster.offerings.length !== 1 ? 'S' : ''}</span>
                    </div>

                    {/* Show matching offerings preview */}
                    {matchingOfferings.length > 0 && (
                      <div className="space-y-1 mt-3 pt-3 border-t border-zinc-300">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Matches:</p>
                        {matchingOfferings.map(offering => (
                          <div key={offering.id} className="text-[10px] text-zinc-300 font-black uppercase tracking-wide">
                            • {offering.name} - {offering.origin}
                          </div>
                        ))}
                        {roaster.offerings.length > matchingOfferings.length && (
                          <p className="text-[9px] text-zinc-500 font-black uppercase mt-1">
                            +{roaster.offerings.length - matchingOfferings.length} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {searchResults.length === 0 && searchQuery && (
          <div className="text-center py-20 space-y-4">
            <p className="text-zinc-700 text-lg font-black uppercase tracking-wider">NO RESULTS FOUND</p>
            <p className="text-zinc-600 text-xs font-black uppercase tracking-wider">
              Try searching for: Ethiopia, Kenya, Gesha, Natural, Washed, or a roaster name
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-6 py-3 bg-white border-2 border-zinc-300 rounded-xl text-xs font-black uppercase tracking-wider hover:border-white transition-all"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
      )}

      {/* Equipment view */}
      {activeView === 'equipment' && (
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('main')}
            className="bg-zinc-50 border-2 border-zinc-900 text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:border-white transition-all"
          >
            ← BACK
          </button>
          <div className="flex-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase">EQUIPMENT</h1>
            <p className="text-xs text-zinc-900 mt-2 tracking-wider uppercase">
              BREWERS • GRINDERS • ACCESSORIES
            </p>
          </div>
          <button
            onClick={() => setShowEquipmentSubmit(true)}
            className="bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">SUBMIT EQUIPMENT</span>
          </button>
        </div>

        {/* Coming soon placeholder */}
        <div className="text-center py-32 space-y-6">
          <Package className="w-24 h-24 text-zinc-700 mx-auto" />
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-zinc-600 uppercase mb-3">COMING SOON</h2>
            <p className="text-sm text-zinc-500 uppercase tracking-wider font-black">
              Equipment marketplace launching soon
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Roaster Detail Modal */}
      {selectedRoaster && (
        <RoasterOfferingsModal
          roaster={selectedRoaster}
          onClose={() => setSelectedRoaster(null)}
        />
      )}

      {/* Roaster Submission Modal */}
      {showRoasterSubmit && (
        <RoasterSubmitModal
          onClose={() => setShowRoasterSubmit(false)}
          onSubmit={async (data) => {
            if (profile) {
              await trackRoasterSubmission(
                data.name,
                profile.id,
                data.city,
                data.country,
                data.state,
                data.website
              );
              setShowRoasterSubmit(false);
            }
          }}
        />
      )}

      {/* Equipment Submission Modal */}
      {showEquipmentSubmit && (
        <EquipmentSubmitModal
          onClose={() => setShowEquipmentSubmit(false)}
          onSubmit={async (data) => {
            if (profile) {
              await trackEquipmentSubmission(
                data.name,
                data.type,
                data.brand,
                data.description,
                profile.id
              );
              setShowEquipmentSubmit(false);
            }
          }}
        />
      )}
    </>
  );
};

// Modal showing all offerings from a roaster
const RoasterOfferingsModal: React.FC<{
  roaster: RoasterWithOfferings;
  onClose: () => void;
}> = ({ roaster, onClose }) => {
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeOffering | null>(null);

  // ESC key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCoffee) {
          setSelectedCoffee(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedCoffee]);

  if (selectedCoffee) {
    return (
      <CoffeeDetailModal
        coffee={selectedCoffee}
        onClose={() => setSelectedCoffee(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm overflow-y-auto p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div
          className="max-w-6xl w-full bg-zinc-50 border-2 border-zinc-300 rounded-3xl p-8 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-black">{roaster.name}</h2>
              <div className="flex items-center gap-4 text-sm text-zinc-900">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{roaster.city}, {roaster.country}</span>
                </div>
                {roaster.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>EST. {roaster.foundedYear}</span>
                  </div>
                )}
              </div>
              {roaster.website && (
                <a
                  href={roaster.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-black hover:underline"
                >
                  VISIT WEBSITE
                </a>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-zinc-900 hover:text-black transition-colors border-2 border-zinc-300 hover:border-white rounded-xl p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Offerings Grid */}
          <div className="space-y-4">
            <h3 className="text-xl font-black tracking-tighter text-black">
              AVAILABLE COFFEES ({roaster.offerings.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roaster.offerings.map(offering => (
                <div
                  key={offering.id}
                  onClick={() => setSelectedCoffee(offering)}
                  className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-5 hover:border-white transition-all cursor-pointer group"
                >
                  {/* Price */}
                  {offering.price && (
                    <div className="flex justify-end mb-3">
                      <div className="bg-white text-black px-3 py-2 rounded-xl">
                        <span className="text-sm font-black">${offering.price.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Coffee name */}
                  <h4 className="text-lg font-black text-black uppercase tracking-tighter leading-tight mb-3 group-hover:text-zinc-900 transition-colors">
                    {offering.name}
                  </h4>

                  {/* Origin */}
                  <div className="flex items-center gap-2 text-zinc-900 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="text-xs font-black uppercase">{offering.origin}</span>
                  </div>

                  {/* Varietals preview */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {offering.varietals.slice(0, 2).map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-white border border-zinc-300 rounded-lg text-[9px] font-black text-zinc-900 uppercase"
                      >
                        {v}
                      </span>
                    ))}
                    {offering.varietals.length > 2 && (
                      <span className="px-2 py-1 text-[9px] font-black text-zinc-500 uppercase">
                        +{offering.varietals.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Processing */}
                  <div className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">
                    {offering.processing}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close button at bottom */}
          <div className="pt-6 border-t-2 border-zinc-300">
            <button
              onClick={onClose}
              className="w-full bg-white text-black px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all border-2 border-white"
            >
              BACK TO MARKETPLACE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Coffee Detail Modal Component
const CoffeeDetailModal: React.FC<{
  coffee: CoffeeOffering;
  onClose: () => void;
}> = ({ coffee, onClose }) => {
  // ESC key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-zinc-50/80 backdrop-blur-sm overflow-y-auto p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div
          className="max-w-3xl w-full bg-zinc-50 border-2 border-zinc-300 rounded-3xl p-8 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl">
              <RoasterLogo roasterName={coffee.roaster?.name} size={32} />
            </div>
            <div>
              <h2 className="text-5xl font-black text-black uppercase tracking-tighter leading-tight">
                {coffee.name}
              </h2>
              <p className="text-sm font-black text-zinc-900 uppercase tracking-widest mt-1">
                {coffee.roaster?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black transition-colors border-2 border-zinc-300 hover:border-white rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Price and Size */}
        <div className="flex items-center gap-4">
          {coffee.price && (
            <div className="bg-white text-black px-6 py-3 rounded-xl">
              <span className="text-2xl font-black">${coffee.price.toFixed(2)}</span>
            </div>
          )}
          {coffee.size && (
            <div className="bg-white border-2 border-zinc-300 text-black px-6 py-3 rounded-xl">
              <span className="text-sm font-black uppercase">{coffee.size}</span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-black" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Origin</h3>
            </div>
            <p className="text-xl font-black text-black uppercase">{coffee.origin}</p>
            {coffee.region && (
              <p className="text-sm font-black text-zinc-700 uppercase">{coffee.region}</p>
            )}
          </div>

          {/* Estate */}
          {coffee.estate && coffee.estate !== 'N/A' && coffee.estate !== 'Varies' && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Estate</h3>
              <p className="text-lg font-black text-black uppercase">{coffee.estate}</p>
            </div>
          )}

          {/* Elevation */}
          {coffee.elevation && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Elevation</h3>
              <p className="text-lg font-black text-black uppercase">{coffee.elevation}</p>
            </div>
          )}

          {/* Lot */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Lot</h3>
            <p className="text-lg font-black text-black uppercase">{coffee.lot}</p>
          </div>
        </div>

        {/* Varietals */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-black" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Varietals</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {coffee.varietals.map((v, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-white border-2 border-zinc-300 rounded-xl text-sm font-black text-black uppercase"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Processing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Processing</h3>
          </div>
          <p className="text-xl font-black text-black uppercase">{coffee.processing}</p>
        </div>

        {/* Roast Level */}
        {coffee.roast_level && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-black" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Roast Level</h3>
            </div>
            <div className={`${getRoastLevelColor(coffee.roast_level)} inline-block px-6 py-3 rounded-xl`}>
              <span className="text-lg font-black text-black uppercase">{coffee.roast_level} ROAST</span>
            </div>
          </div>
        )}

        {/* Tasting Notes */}
        {coffee.tasting_notes && coffee.tasting_notes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Tasting Notes</h3>
            <div className="flex flex-wrap gap-2">
              {coffee.tasting_notes.map((note, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-zinc-50 border-2 border-zinc-300 rounded-xl text-sm font-black text-black uppercase"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Close button at bottom */}
        <div className="pt-6 border-t-2 border-zinc-300">
          <button
            onClick={onClose}
            className="w-full bg-white text-black px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all border-2 border-white"
          >
            CLOSE
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

// Roaster Submission Modal
const RoasterSubmitModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    city: string;
    country: string;
    state?: string;
    website?: string;
  }) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    state: '',
    website: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim() || !formData.country.trim()) {
      alert('Please fill in roaster name, city, and country');
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      state: formData.state.trim() || undefined,
      website: formData.website.trim() || undefined
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-zinc-50 border-2 border-zinc-300 rounded-3xl p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tighter text-black uppercase">SUBMIT ROASTER</h2>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black transition-colors border-2 border-zinc-300 hover:border-white rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          Know a great roaster that should be in the marketplace? Submit it for review!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
              Roaster Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="ONYX COFFEE LAB"
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="BENTONVILLE"
                className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
                State/Region
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="ARKANSAS"
                className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
              Country *
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
              placeholder="USA"
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://onyxcoffeelab.com"
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black text-sm outline-none focus:border-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-zinc-300 text-zinc-900 hover:text-black hover:border-zinc-600 font-black text-sm uppercase tracking-wider transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-white text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Coffee className="w-4 h-4" />
              SUBMIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Equipment Submission Modal
const EquipmentSubmitModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    brand: string;
    description: string;
  }) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'brewer',
    brand: '',
    description: ''
  });

  const equipmentTypes = [
    { value: 'brewer', label: 'Brewer' },
    { value: 'grinder', label: 'Grinder' },
    { value: 'filter', label: 'Filter' },
    { value: 'water', label: 'Water Equipment' },
    { value: 'accessory', label: 'Accessory' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.brand.trim()) {
      alert('Please fill in equipment name and brand');
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      type: formData.type,
      brand: formData.brand.trim(),
      description: formData.description.trim()
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-zinc-50 border-2 border-zinc-300 rounded-3xl p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tighter text-black uppercase">SUBMIT EQUIPMENT</h2>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black transition-colors border-2 border-zinc-300 hover:border-white rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          Submit brewers, grinders, filters, water equipment, or accessories to help grow the marketplace!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
              Equipment Type *
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
            >
              {equipmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
                Brand *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                placeholder="HARIO"
                className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
                Model *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="V60"
                className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-4 px-5 text-black font-black text-sm outline-none focus:border-white uppercase"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description (optional)"
              className="w-full bg-zinc-50 border-2 border-zinc-900 rounded-xl py-3 px-5 text-black text-sm outline-none focus:border-white resize-none h-20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-zinc-300 text-zinc-900 hover:text-black hover:border-zinc-600 font-black text-sm uppercase tracking-wider transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-white text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" />
              SUBMIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoffeeShopView;
