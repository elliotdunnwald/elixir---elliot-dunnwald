import React, { useState, useEffect } from 'react';
import { Coffee, Search, Filter, X, DollarSign, MapPin, Sparkles, Flame, Loader2 } from 'lucide-react';
import { getCoffeeOfferings, getRoasters, type CoffeeOffering, type Roaster } from '../lib/database';

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
          // Fallback to generic coffee icon if favicon fails to load
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

  return <Coffee className="text-white" style={{ width: size, height: size }} />;
};

// Helper function for roast level colors
const getRoastLevelColor = (level?: string) => {
  if (!level) return 'bg-zinc-800';
  const l = level.toLowerCase();
  if (l.includes('light')) return 'bg-amber-900';
  if (l.includes('medium')) return 'bg-orange-900';
  if (l.includes('dark')) return 'bg-stone-900';
  return 'bg-zinc-800';
};

const CoffeeShopView: React.FC = () => {
  const [coffees, setCoffees] = useState<CoffeeOffering[]>([]);
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeOffering | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCoffees();
  }, [searchQuery, selectedRoaster]);

  async function loadData() {
    setLoading(true);
    const [coffeesData, roastersData] = await Promise.all([
      getCoffeeOfferings(),
      getRoasters()
    ]);
    // Sort by roaster name, then by coffee name
    const sorted = coffeesData.sort((a, b) => {
      const roasterCompare = (a.roaster?.name || '').localeCompare(b.roaster?.name || '');
      if (roasterCompare !== 0) return roasterCompare;
      return a.name.localeCompare(b.name);
    });
    setCoffees(sorted);
    setRoasters(roastersData);
    setLoading(false);
  }

  async function filterCoffees() {
    const filters: any = {};
    if (selectedRoaster) filters.roasterId = selectedRoaster;
    if (searchQuery) filters.search = searchQuery;

    const filtered = await getCoffeeOfferings(filters);
    // Sort by roaster name, then by coffee name
    const sorted = filtered.sort((a, b) => {
      const roasterCompare = (a.roaster?.name || '').localeCompare(b.roaster?.name || '');
      if (roasterCompare !== 0) return roasterCompare;
      return a.name.localeCompare(b.name);
    });
    setCoffees(sorted);
  }

  const CoffeeCard: React.FC<{ coffee: CoffeeOffering }> = ({ coffee }) => (
    <div
      onClick={() => setSelectedCoffee(coffee)}
      className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 hover:border-white transition-all shadow-lg shadow-white/5 cursor-pointer group"
    >
      {/* Header with logo and price */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
            <RoasterLogo roasterName={coffee.roaster?.name} size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-zinc-100 uppercase tracking-widest">
              {coffee.roaster?.name}
            </p>
          </div>
        </div>
        {coffee.price && (
          <div className="bg-white text-black px-3 py-2 rounded-xl">
            <span className="text-sm font-black">${coffee.price.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Coffee name */}
      <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-tight mb-4 group-hover:text-zinc-100 transition-colors">
        {coffee.name}
      </h3>

      {/* Origin */}
      <div className="flex items-center gap-2 text-zinc-100 mb-3">
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-black uppercase">
          {coffee.origin}
        </span>
      </div>

      {/* Roast level badge */}
      {coffee.roast_level && (
        <div className={`${getRoastLevelColor(coffee.roast_level)} inline-block px-3 py-1.5 rounded-lg mb-3`}>
          <span className="text-[10px] font-black text-white uppercase tracking-wide">
            {coffee.roast_level}
          </span>
        </div>
      )}

      {/* Tasting notes preview */}
      {coffee.tasting_notes && coffee.tasting_notes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {coffee.tasting_notes.slice(0, 3).map((note, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-[9px] font-black text-zinc-100 uppercase"
            >
              {note}
            </span>
          ))}
          {coffee.tasting_notes.length > 3 && (
            <span className="px-2 py-1 text-[9px] font-black text-zinc-400 uppercase">
              +{coffee.tasting_notes.length - 3} MORE
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-2">
              MARKETPLACE
            </h1>
            <p className="text-sm font-black text-zinc-100 uppercase tracking-widest">
              {coffees.length} OFFERINGS AVAILABLE
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl border-2 font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            FILTERS
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-200 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="SEARCH BY NAME, ORIGIN, OR REGION..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl py-7 pl-16 pr-16 text-sm font-black text-white outline-none focus:border-white transition-all uppercase placeholder:text-zinc-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-7 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-white transition-colors border-2 border-zinc-800 hover:border-white rounded-xl p-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-[2.5rem] p-8 space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                FILTER OPTIONS
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-zinc-100 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">
                  ROASTER
                </label>
                <select
                  value={selectedRoaster}
                  onChange={e => setSelectedRoaster(e.target.value)}
                  className="w-full bg-black border-2 border-zinc-800 rounded-xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase"
                >
                  <option value="">ALL ROASTERS</option>
                  {roasters.map(roaster => (
                    <option key={roaster.id} value={roaster.id}>
                      {roaster.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3">
                <button
                  onClick={() => {
                    setSelectedRoaster('');
                    setSearchQuery('');
                    loadData();
                  }}
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-zinc-800 text-zinc-100 hover:text-white hover:border-zinc-600 font-black text-xs uppercase tracking-[0.2em] transition-all"
                >
                  RESET FILTERS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coffee Grid */}
      {coffees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {coffees.map(coffee => (
            <CoffeeCard key={coffee.id} coffee={coffee} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center border-4 border-dashed border-zinc-900 rounded-[3.5rem]">
          <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-6">
            <Coffee className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">
            NO COFFEES FOUND
          </h3>
          <p className="text-zinc-100 text-sm font-black uppercase tracking-widest">
            TRY ADJUSTING YOUR SEARCH OR FILTERS
          </p>
        </div>
      )}

      {/* Coffee Detail Modal */}
      {selectedCoffee && (
        <CoffeeDetailModal
          coffee={selectedCoffee}
          onClose={() => setSelectedCoffee(null)}
        />
      )}
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div
          className="max-w-3xl w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl">
              <RoasterLogo roasterName={coffee.roaster?.name} size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">
                {coffee.name}
              </h2>
              <p className="text-sm font-black text-zinc-100 uppercase tracking-widest mt-1">
                {coffee.roaster?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-100 hover:text-white transition-colors border-2 border-zinc-800 hover:border-white rounded-xl p-2"
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
            <div className="bg-zinc-900 border-2 border-zinc-800 text-white px-6 py-3 rounded-xl">
              <span className="text-sm font-black uppercase">{coffee.size}</span>
            </div>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-white" />
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Origin</h3>
            </div>
            <p className="text-xl font-black text-white uppercase">{coffee.origin}</p>
            {coffee.region && (
              <p className="text-sm font-black text-zinc-200 uppercase">{coffee.region}</p>
            )}
          </div>

          {/* Estate */}
          {coffee.estate && coffee.estate !== 'N/A' && coffee.estate !== 'Varies' && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Estate</h3>
              <p className="text-lg font-black text-white uppercase">{coffee.estate}</p>
            </div>
          )}

          {/* Elevation */}
          {coffee.elevation && (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Elevation</h3>
              <p className="text-lg font-black text-white uppercase">{coffee.elevation}</p>
            </div>
          )}

          {/* Lot */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Lot</h3>
            <p className="text-lg font-black text-white uppercase">{coffee.lot}</p>
          </div>
        </div>

        {/* Varietals */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-white" />
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Varietals</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {coffee.varietals.map((v, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-zinc-900 border-2 border-zinc-800 rounded-xl text-sm font-black text-white uppercase"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Processing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Processing</h3>
          </div>
          <p className="text-xl font-black text-white uppercase">{coffee.processing}</p>
        </div>

        {/* Roast Level */}
        {coffee.roast_level && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-white" />
              <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Roast Level</h3>
            </div>
            <div className={`${getRoastLevelColor(coffee.roast_level)} inline-block px-6 py-3 rounded-xl`}>
              <span className="text-lg font-black text-white uppercase">{coffee.roast_level} ROAST</span>
            </div>
          </div>
        )}

        {/* Tasting Notes */}
        {coffee.tasting_notes && coffee.tasting_notes.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Tasting Notes</h3>
            <div className="flex flex-wrap gap-2">
              {coffee.tasting_notes.map((note, i) => (
                <span
                  key={i}
                  className="px-4 py-2 bg-black border-2 border-zinc-800 rounded-xl text-sm font-black text-white uppercase"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Close button at bottom */}
        <div className="pt-6 border-t-2 border-zinc-800">
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

export default CoffeeShopView;
