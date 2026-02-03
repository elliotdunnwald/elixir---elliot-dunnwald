import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, X, ExternalLink, Coffee, MapPin, Calendar } from 'lucide-react';
import Fuse from 'fuse.js';
import { Roaster, CoffeeOffering } from '../types';
import { getCoffeeOfferings, getRoasters as getSupabaseRoasters } from '../lib/database';

const RoasterDatabase: React.FC = () => {
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<Roaster | null>(null);
  const [isAddingRoaster, setIsAddingRoaster] = useState(false);
  const [isAddingOffering, setIsAddingOffering] = useState(false);

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
    const loadRoasters = async () => {
      // Clean up old localStorage key
      localStorage.removeItem('elixr_roasters_v1');
      localStorage.removeItem('elixr_roasters_custom');

      try {
        // Load roasters directly from Supabase
        const [supabaseOfferings, supabaseRoasters] = await Promise.all([
          getCoffeeOfferings(),
          getSupabaseRoasters()
        ]);

        // Group offerings by roaster ID
        const offeringsByRoaster = new Map<string, typeof supabaseOfferings>();
        supabaseOfferings.forEach(offering => {
          const roasterOfferings = offeringsByRoaster.get(offering.roaster_id) || [];
          roasterOfferings.push(offering);
          offeringsByRoaster.set(offering.roaster_id, roasterOfferings);
        });

        // Convert Supabase roasters to local format
        const allRoasters: Roaster[] = supabaseRoasters.map(sr => {
          const supabaseOfferingsForRoaster = offeringsByRoaster.get(sr.id) || [];

          // Convert Supabase offerings to local format
          const convertedOfferings = supabaseOfferingsForRoaster.map(so => ({
            id: so.id,
            name: so.name,
            lot: so.lot,
            origin: so.origin,
            region: so.region,
            estate: so.estate,
            producer: so.producer,
            varietals: so.varietals,
            processing: so.processing,
            roastLevel: so.roast_level,
            tastingNotes: so.tasting_notes,
            elevation: so.elevation,
            available: so.available,
            price: so.price,
            size: so.size,
            harvestDate: undefined
          }));

          return {
            id: sr.id,
            name: sr.name,
            city: sr.city,
            state: sr.state,
            country: sr.country,
            foundedYear: sr.founded_year,
            website: sr.website,
            offerings: convertedOfferings
          };
        });

        let finalRoasters = allRoasters;

        // Sort roasters alphabetically by name
        finalRoasters.sort((a, b) => a.name.localeCompare(b.name));
        setRoasters(finalRoasters);
      } catch (error) {
        console.error('Failed to load roasters:', error);
        setRoasters([]);
      }
    };
    loadRoasters();
  }, []);

  const saveRoasters = async (updatedRoasters: Roaster[]) => {
    // Just update state - roasters are now managed via Supabase approval system
    setRoasters(updatedRoasters);
  };

  const fuse = useMemo(() => {
    return new Fuse(roasters, {
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
        { name: 'offerings.tastingNotes', weight: 1 },
        'offerings.roastLevel'
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true
    });
  }, [roasters]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return roasters;
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse, roasters]);

  const handleAddRoaster = (newRoaster: Omit<Roaster, 'id'>) => {
    const roaster: Roaster = {
      ...newRoaster,
      id: Date.now().toString()
    };
    saveRoasters([...roasters, roaster]);
    setIsAddingRoaster(false);
  };

  const handleAddOffering = (roasterId: string, offering: Omit<CoffeeOffering, 'id'>) => {
    const updated = roasters.map(r => {
      if (r.id === roasterId) {
        return {
          ...r,
          offerings: [...r.offerings, { ...offering, id: Date.now().toString() }]
        };
      }
      return r;
    });
    saveRoasters(updated);
    setIsAddingOffering(false);
    setSelectedRoaster(updated.find(r => r.id === roasterId) || null);
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">ROASTER DATABASE</h1>
          <p className="text-xs text-zinc-900 mt-2 tracking-wider">{roasters.length} ROASTERS • {roasters.reduce((sum, r) => sum + r.offerings.length, 0)} OFFERINGS</p>
        </div>
        <button
          onClick={() => setIsAddingRoaster(true)}
          className="bg-white text-black px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-xl border-2 border-black"
        >
          <Plus className="w-4 h-4" /> ADD ROASTER
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-200" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="SEARCH BY ROASTER, ORIGIN, VARIETAL, PROCESS, OR ESTATE..."
            className="w-full bg-zinc-50 border-2 border-black rounded-2xl py-4 pl-12 pr-12 text-sm font-black text-black outline-none focus:border-white uppercase placeholder:text-black"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-black active:text-black transition-colors border-2 border-black hover:border-black rounded-lg p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center px-2">
            Quick Search:
          </span>
          {quickFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => handleQuickFilter(filter.label)}
              className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                searchQuery.toLowerCase() === filter.label.toLowerCase()
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent border-black text-zinc-200 hover:border-black'
              }`}
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {searchQuery && searchResults.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-black font-black uppercase tracking-wider">
            {searchResults.length} roaster{searchResults.length !== 1 ? 's' : ''} found
          </span>
          <span className="text-black">•</span>
          <span className="text-black font-black uppercase tracking-wider">
            {searchResults.reduce((sum, r) => sum + r.offerings.length, 0)} total offerings
          </span>
        </div>
      )}

      {/* Compact list view */}
      <div className="space-y-3">
        {searchResults.map(roaster => (
          <div
            key={roaster.id}
            onClick={() => setSelectedRoaster(roaster)}
            className="bg-white border-2 border-black rounded-2xl p-5 hover:border-black active:border-black transition-all cursor-pointer group flex items-center justify-between gap-4 shadow-2xl shadow-black/5"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h3 className="text-sm font-black tracking-tight uppercase group-hover:text-black active:text-black transition-colors truncate">
                {roaster.name}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-black">
                <MapPin className="w-2.5 h-2.5" />
                <span className="font-bold uppercase tracking-wide whitespace-nowrap">{roaster.city}, {roaster.country}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-black font-bold uppercase whitespace-nowrap">
              {roaster.foundedYear && (
                <span>EST. {roaster.foundedYear}</span>
              )}
              <div className="flex items-center gap-1">
                <Coffee className="w-2.5 h-2.5" />
                <span>{roaster.offerings.length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && searchQuery && (
        <div className="text-center py-20 space-y-4">
          <p className="text-zinc-200 text-lg font-black uppercase tracking-wider">NO RESULTS FOUND</p>
          <p className="text-black text-xs font-black uppercase tracking-wider">
            Try searching for: Ethiopia, Kenya, Gesha, Natural, Washed, or a roaster name
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-6 py-3 bg-white border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider hover:border-black active:border-black transition-all"
          >
            Clear Search
          </button>
        </div>
      )}

      {selectedRoaster && (
        <RoasterDetailModal
          roaster={selectedRoaster}
          onClose={() => setSelectedRoaster(null)}
          onAddOffering={() => setIsAddingOffering(true)}
        />
      )}

      {isAddingRoaster && (
        <AddRoasterModal
          onClose={() => setIsAddingRoaster(false)}
          onAdd={handleAddRoaster}
        />
      )}

      {isAddingOffering && selectedRoaster && (
        <AddOfferingModal
          roaster={selectedRoaster}
          onClose={() => setIsAddingOffering(false)}
          onAdd={(offering) => handleAddOffering(selectedRoaster.id, offering)}
        />
      )}
    </div>
  );
};

const RoasterDetailModal: React.FC<{
  roaster: Roaster;
  onClose: () => void;
  onAddOffering: () => void;
}> = ({ roaster, onClose, onAddOffering }) => {
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
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm overflow-y-auto p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-10">
        <div
          className="max-w-4xl w-full bg-white border-2 border-black rounded-[3.5rem] p-8 space-y-6 shadow-2xl shadow-black/5"
          onClick={(e) => e.stopPropagation()}
        >
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
                <ExternalLink className="w-3 h-3" />
                VISIT WEBSITE
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black active:text-black transition-colors border-2 border-black hover:border-black rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tighter text-black">CURRENT OFFERINGS</h3>
            <button
              onClick={onAddOffering}
              className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider active:scale-95 transition-all border-2 border-white"
            >
              <Plus className="w-3 h-3" /> ADD OFFERING
            </button>
          </div>

          {roaster.offerings.length === 0 ? (
            <div className="text-center py-10 text-black text-sm font-black uppercase">
              NO OFFERINGS YET
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roaster.offerings.map(offering => (
                <div
                  key={offering.id}
                  className="bg-zinc-50 border-2 border-black rounded-2xl p-5 space-y-3 shadow-xl"
                >
                  <div>
                    <h4 className="text-lg font-black tracking-tighter">{offering.name}</h4>
                    {offering.lot && (
                      <p className="text-xs text-zinc-900 mt-1">LOT: {offering.lot}</p>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-200">ORIGIN:</span>
                      <span className="text-black font-black">{offering.origin} {offering.region && `• ${offering.region}`}</span>
                    </div>
                    {offering.producer && (
                      <div className="flex justify-between">
                        <span className="text-zinc-200">PRODUCER:</span>
                        <span className="text-black font-black">{offering.producer}</span>
                      </div>
                    )}
                    {offering.estate && (
                      <div className="flex justify-between">
                        <span className="text-zinc-200">ESTATE:</span>
                        <span className="text-black font-black">{offering.estate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-200">VARIETALS:</span>
                      <span className="text-black font-black">{offering.varietals.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-200">PROCESSING:</span>
                      <span className="text-black font-black">{offering.processing}</span>
                    </div>
                    {offering.elevation && (
                      <div className="flex justify-between">
                        <span className="text-zinc-200">ELEVATION:</span>
                        <span className="text-black font-black">{offering.elevation}</span>
                      </div>
                    )}
                    {offering.tastingNotes && offering.tastingNotes.length > 0 && (
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-zinc-200">NOTES:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {offering.tastingNotes.map((note, i) => (
                            <span key={i} className="bg-white px-2 py-1 rounded text-black font-black text-[10px]">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {offering.price && (
                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
                      <span className="text-zinc-200 text-xs">PRICE:</span>
                      <span className="text-black font-black">${offering.price} / {offering.size}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button at bottom */}
        <div className="pt-6 border-t-2 border-black">
          <button
            onClick={onClose}
            className="w-full bg-white text-black px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all border-2 border-white shadow-xl"
          >
            BACK TO ROASTERS
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

const AddRoasterModal: React.FC<{
  onClose: () => void;
  onAdd: (roaster: Omit<Roaster, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    country: '',
    website: '',
    foundedYear: ''
  });

  // ESC key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = () => {
    if (!formData.name || !formData.city || !formData.country) return;

    onAdd({
      name: formData.name.toUpperCase(),
      city: formData.city.toUpperCase(),
      state: formData.state.toUpperCase(),
      country: formData.country.toUpperCase(),
      website: formData.website,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
      offerings: []
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-white border-2 border-black rounded-[3.5rem] p-8 space-y-6 shadow-2xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter text-black">ADD ROASTER</h2>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black active:text-black transition-colors border-2 border-black hover:border-black rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="ROASTER NAME *"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CITY *"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="STATE"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
          </div>
          <input
            type="text"
            placeholder="COUNTRY *"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />
          <input
            type="url"
            placeholder="WEBSITE"
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white"
          />
          <input
            type="number"
            placeholder="FOUNDED YEAR"
            value={formData.foundedYear}
            onChange={e => setFormData({ ...formData, foundedYear: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.city || !formData.country}
          className="w-full bg-white text-black disabled:bg-white disabled:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl border-2 border-black"
        >
          ADD ROASTER
        </button>
      </div>
    </div>
  );
};

const AddOfferingModal: React.FC<{
  roaster: Roaster;
  onClose: () => void;
  onAdd: (offering: Omit<CoffeeOffering, 'id'>) => void;
}> = ({ roaster, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    lot: '',
    origin: '',
    region: '',
    estate: '',
    producer: '',
    varietals: '',
    processing: '',
    roastLevel: '',
    tastingNotes: '',
    elevation: '',
    price: '',
    size: '',
    harvestDate: ''
  });

  // ESC key to close
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = () => {
    if (!formData.name || !formData.lot || !formData.origin || !formData.varietals || !formData.processing) return;

    onAdd({
      name: formData.name.toUpperCase(),
      lot: formData.lot.toUpperCase(),
      origin: formData.origin.toUpperCase(),
      region: formData.region.toUpperCase() || undefined,
      estate: formData.estate.toUpperCase() || undefined,
      producer: formData.producer.toUpperCase() || undefined,
      varietals: formData.varietals.split(',').map(v => v.trim().toUpperCase()),
      processing: formData.processing.toUpperCase(),
      roastLevel: formData.roastLevel || undefined,
      tastingNotes: formData.tastingNotes ? formData.tastingNotes.split(',').map(n => n.trim()) : undefined,
      elevation: formData.elevation || undefined,
      available: true,
      price: formData.price ? parseFloat(formData.price) : undefined,
      size: formData.size || undefined,
      harvestDate: formData.harvestDate || undefined
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white border-2 border-black rounded-[3.5rem] p-8 space-y-6 my-10 shadow-2xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-black">ADD OFFERING</h2>
            <p className="text-xs text-zinc-900 mt-1">{roaster.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-900 hover:text-black active:text-black transition-colors border-2 border-black hover:border-black rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="COFFEE NAME *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="LOT NUMBER *"
              value={formData.lot}
              onChange={e => setFormData({ ...formData, lot: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ORIGIN *"
              value={formData.origin}
              onChange={e => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="REGION"
              value={formData.region}
              onChange={e => setFormData({ ...formData, region: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
          </div>

          <input
            type="text"
            placeholder="ESTATE/FARM"
            value={formData.estate}
            onChange={e => setFormData({ ...formData, estate: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />

          <input
            type="text"
            placeholder="PRODUCER"
            value={formData.producer}
            onChange={e => setFormData({ ...formData, producer: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />

          <input
            type="text"
            placeholder="VARIETALS (COMMA SEPARATED) *"
            value={formData.varietals}
            onChange={e => setFormData({ ...formData, varietals: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="PROCESSING *"
              value={formData.processing}
              onChange={e => setFormData({ ...formData, processing: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="ROAST LEVEL"
              value={formData.roastLevel}
              onChange={e => setFormData({ ...formData, roastLevel: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
          </div>

          <input
            type="text"
            placeholder="TASTING NOTES (COMMA SEPARATED)"
            value={formData.tastingNotes}
            onChange={e => setFormData({ ...formData, tastingNotes: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white"
          />

          <input
            type="text"
            placeholder="ELEVATION (e.g. 1800-2000m)"
            value={formData.elevation}
            onChange={e => setFormData({ ...formData, elevation: e.target.value })}
            className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
          />

          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="PRICE"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="SIZE"
              value={formData.size}
              onChange={e => setFormData({ ...formData, size: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
            <input
              type="month"
              placeholder="HARVEST"
              value={formData.harvestDate}
              onChange={e => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full bg-zinc-50 border-2 border-black rounded-xl py-3 px-4 text-sm font-black text-black outline-none focus:border-white uppercase"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.lot || !formData.origin || !formData.varietals || !formData.processing}
          className="w-full bg-white text-black disabled:bg-white disabled:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl border-2 border-black"
        >
          ADD OFFERING
        </button>
      </div>
    </div>
  );
};

export default RoasterDatabase;
