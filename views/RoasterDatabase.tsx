import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, X, ExternalLink, Coffee, MapPin, Calendar } from 'lucide-react';
import Fuse from 'fuse.js';
import { Roaster, CoffeeOffering } from '../types';

const RoasterDatabase: React.FC = () => {
  const [roasters, setRoasters] = useState<Roaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoaster, setSelectedRoaster] = useState<Roaster | null>(null);
  const [isAddingRoaster, setIsAddingRoaster] = useState(false);
  const [isAddingOffering, setIsAddingOffering] = useState(false);

  useEffect(() => {
    const loadRoasters = async () => {
      // Clean up old localStorage key
      localStorage.removeItem('elixr_roasters_v1');

      try {
        // Always load from JSON first to get the latest data
        const response = await fetch('/data/roasters.json');
        const data = await response.json();

        // Check if user has custom additions in localStorage
        const saved = localStorage.getItem('elixr_roasters_custom');
        if (saved) {
          const customRoasters = JSON.parse(saved);
          // Merge: keep custom roasters that aren't in the base data
          const baseIds = new Set(data.map((r: Roaster) => r.id));
          const customOnly = customRoasters.filter((r: Roaster) => !baseIds.has(r.id));
          setRoasters([...data, ...customOnly]);
        } else {
          setRoasters(data);
        }
      } catch (error) {
        console.error('Failed to load roasters:', error);
        setRoasters([]);
      }
    };
    loadRoasters();
  }, []);

  const saveRoasters = async (updatedRoasters: Roaster[]) => {
    setRoasters(updatedRoasters);

    // Only save custom roasters (not in base JSON) to localStorage
    try {
      const response = await fetch('/data/roasters.json');
      const baseData = await response.json();
      const baseIds = new Set(baseData.map((r: Roaster) => r.id));
      const customRoasters = updatedRoasters.filter(r => !baseIds.has(r.id));
      localStorage.setItem('elixr_roasters_custom', JSON.stringify(customRoasters));
    } catch (error) {
      // If can't load base data, save everything
      localStorage.setItem('elixr_roasters_custom', JSON.stringify(updatedRoasters));
    }
  };

  const fuse = useMemo(() => {
    return new Fuse(roasters, {
      keys: [
        'name',
        'city',
        'country',
        'offerings.name',
        'offerings.origin',
        'offerings.varietals',
        'offerings.processing'
      ],
      threshold: 0.3,
      includeScore: true
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
          <p className="text-xs text-zinc-500 mt-2 tracking-wider">{roasters.length} ROASTERS • {roasters.reduce((sum, r) => sum + r.offerings.length, 0)} OFFERINGS</p>
        </div>
        <button
          onClick={() => setIsAddingRoaster(true)}
          className="bg-white text-black px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> ADD ROASTER
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="SEARCH ROASTERS, ORIGINS, VARIETALS, PROCESSING..."
          className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-black text-white outline-none focus:border-white uppercase"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searchResults.map(roaster => (
          <div
            key={roaster.id}
            onClick={() => setSelectedRoaster(roaster)}
            className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-6 hover:border-white transition-all cursor-pointer"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-black tracking-tighter">{roaster.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  <span>{roaster.city}, {roaster.country}</span>
                </div>
              </div>
              {roaster.foundedYear && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <Calendar className="w-3 h-3" />
                  <span>EST. {roaster.foundedYear}</span>
                </div>
              )}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Coffee className="w-3 h-3" />
                  <span>{roaster.offerings.length} OFFERING{roaster.offerings.length !== 1 ? 'S' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {searchResults.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-600 text-sm font-black uppercase tracking-wider">NO RESULTS FOUND</p>
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
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-4xl w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">{roaster.name}</h2>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
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
                className="flex items-center gap-2 text-xs text-white hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                VISIT WEBSITE
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tighter">CURRENT OFFERINGS</h3>
            <button
              onClick={onAddOffering}
              className="bg-white text-black px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
            >
              <Plus className="w-3 h-3" /> ADD OFFERING
            </button>
          </div>

          {roaster.offerings.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 text-sm font-black uppercase">
              NO OFFERINGS YET
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roaster.offerings.map(offering => (
                <div
                  key={offering.id}
                  className="bg-black border-2 border-zinc-900 rounded-2xl p-5 space-y-3"
                >
                  <div>
                    <h4 className="text-lg font-black tracking-tighter">{offering.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{offering.lot}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">ORIGIN:</span>
                      <span className="text-white font-black">{offering.origin} {offering.region && `• ${offering.region}`}</span>
                    </div>
                    {offering.estate && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ESTATE:</span>
                        <span className="text-white font-black">{offering.estate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-600">VARIETALS:</span>
                      <span className="text-white font-black">{offering.varietals.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">PROCESSING:</span>
                      <span className="text-white font-black">{offering.processing}</span>
                    </div>
                    {offering.elevation && (
                      <div className="flex justify-between">
                        <span className="text-zinc-600">ELEVATION:</span>
                        <span className="text-white font-black">{offering.elevation}</span>
                      </div>
                    )}
                    {offering.tastingNotes && offering.tastingNotes.length > 0 && (
                      <div className="pt-2 border-t border-zinc-900">
                        <span className="text-zinc-600">NOTES:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {offering.tastingNotes.map((note, i) => (
                            <span key={i} className="bg-zinc-900 px-2 py-1 rounded text-white font-black text-[10px]">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {offering.price && (
                    <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
                      <span className="text-zinc-600 text-xs">PRICE:</span>
                      <span className="text-white font-black">${offering.price} / {offering.size}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tighter">ADD ROASTER</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="ROASTER NAME *"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CITY *"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="STATE"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>
          <input
            type="text"
            placeholder="COUNTRY *"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />
          <input
            type="url"
            placeholder="WEBSITE"
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white"
          />
          <input
            type="number"
            placeholder="FOUNDED YEAR"
            value={formData.foundedYear}
            onChange={e => setFormData({ ...formData, foundedYear: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.city || !formData.country}
          className="w-full bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95"
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
    varietals: '',
    processing: '',
    roastLevel: '',
    tastingNotes: '',
    elevation: '',
    price: '',
    size: '',
    harvestDate: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.lot || !formData.origin || !formData.varietals || !formData.processing) return;

    onAdd({
      name: formData.name.toUpperCase(),
      lot: formData.lot.toUpperCase(),
      origin: formData.origin.toUpperCase(),
      region: formData.region.toUpperCase() || undefined,
      estate: formData.estate.toUpperCase() || undefined,
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
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 space-y-6 my-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter">ADD OFFERING</h2>
            <p className="text-xs text-zinc-500 mt-1">{roaster.name}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
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
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="LOT NUMBER *"
              value={formData.lot}
              onChange={e => setFormData({ ...formData, lot: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="ORIGIN *"
              value={formData.origin}
              onChange={e => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="REGION"
              value={formData.region}
              onChange={e => setFormData({ ...formData, region: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>

          <input
            type="text"
            placeholder="ESTATE/FARM"
            value={formData.estate}
            onChange={e => setFormData({ ...formData, estate: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />

          <input
            type="text"
            placeholder="VARIETALS (COMMA SEPARATED) *"
            value={formData.varietals}
            onChange={e => setFormData({ ...formData, varietals: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="PROCESSING *"
              value={formData.processing}
              onChange={e => setFormData({ ...formData, processing: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="ROAST LEVEL"
              value={formData.roastLevel}
              onChange={e => setFormData({ ...formData, roastLevel: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>

          <input
            type="text"
            placeholder="TASTING NOTES (COMMA SEPARATED)"
            value={formData.tastingNotes}
            onChange={e => setFormData({ ...formData, tastingNotes: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white"
          />

          <input
            type="text"
            placeholder="ELEVATION (e.g. 1800-2000m)"
            value={formData.elevation}
            onChange={e => setFormData({ ...formData, elevation: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />

          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="PRICE"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="text"
              placeholder="SIZE"
              value={formData.size}
              onChange={e => setFormData({ ...formData, size: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="month"
              placeholder="HARVEST"
              value={formData.harvestDate}
              onChange={e => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.lot || !formData.origin || !formData.varietals || !formData.processing}
          className="w-full bg-white text-black disabled:bg-zinc-900 disabled:text-zinc-700 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95"
        >
          ADD OFFERING
        </button>
      </div>
    </div>
  );
};

export default RoasterDatabase;
