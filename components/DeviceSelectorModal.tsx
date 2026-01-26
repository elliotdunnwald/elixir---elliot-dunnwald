import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Coffee } from 'lucide-react';
import { getUserGear, addGearItem, type DbGearItem } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

interface Device {
  name: string;
  brand: string;
  type: string;
  category: string;
}

interface DeviceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (device: string, category: string) => void;
  currentDevice?: string;
}

const DeviceSelectorModal: React.FC<DeviceSelectorModalProps> = ({ isOpen, onClose, onSelect, currentDevice }) => {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [userGear, setUserGear] = useState<DbGearItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && profile) {
      loadData();
    }
  }, [isOpen, profile]);

  const loadData = async () => {
    setLoading(true);

    // Load brewing equipment database
    try {
      const response = await fetch('/data/brewing-equipment.json');
      const data = await response.json();
      setAllDevices(data.brewers || []);
    } catch (err) {
      console.error('Error loading brewing equipment:', err);
    }

    // Load user's personal gear
    if (profile) {
      const gear = await getUserGear(profile.id);
      setUserGear(gear.filter(item => item.type === 'brewer'));
    }

    setLoading(false);
  };

  const handleSelectDevice = (name: string, brand: string, category: string) => {
    const deviceName = `${brand} ${name}`.trim();
    onSelect(deviceName, category);
    onClose();
  };

  const handleAddToGear = async (device: Device) => {
    if (!profile) return;

    const deviceName = `${device.brand} ${device.name}`.trim();
    const newGear = await addGearItem(profile.id, {
      name: device.name,
      brand: device.brand,
      type: 'brewer',
      notes: device.category
    });

    if (newGear) {
      setUserGear([newGear, ...userGear]);
      onSelect(deviceName, device.category);
      onClose();
    }
  };

  const filteredDevices = allDevices.filter(device => {
    const searchLower = searchQuery.toLowerCase();
    return (
      device.name.toLowerCase().includes(searchLower) ||
      device.brand.toLowerCase().includes(searchLower) ||
      device.category.toLowerCase().includes(searchLower)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">Select Brewing Device</h2>
          <button onClick={onClose} className="text-zinc-100 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="px-8 py-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH DEVICES..."
              className="w-full bg-black border-2 border-zinc-800 rounded-2xl pl-12 pr-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* User's Gear */}
          {userGear.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.3em]">Your Gear</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userGear.map(item => {
                  const deviceName = `${item.brand} ${item.name}`.trim();
                  const isSelected = currentDevice === deviceName;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectDevice(item.name, item.brand, item.notes || 'pourover')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white'
                          : 'bg-black text-white border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <p className="font-black text-sm uppercase tracking-tight">{item.brand}</p>
                      <p className="text-xs uppercase tracking-wider mt-1 opacity-70">{item.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Devices Database */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.3em]">
              {searchQuery ? 'Search Results' : 'All Devices'}
            </h3>
            {loading ? (
              <p className="text-zinc-500 text-sm uppercase tracking-widest">Loading...</p>
            ) : filteredDevices.length === 0 ? (
              <p className="text-zinc-500 text-sm uppercase tracking-widest">No devices found</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredDevices.slice(0, 50).map((device, idx) => {
                  const deviceName = `${device.brand} ${device.name}`.trim();
                  const isInGear = userGear.some(g => g.brand === device.brand && g.name === device.name);
                  const isSelected = currentDevice === deviceName;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white'
                          : 'bg-black border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <button
                        onClick={() => handleSelectDevice(device.name, device.brand, device.category)}
                        className="flex-1 text-left"
                      >
                        <p className="font-black text-sm uppercase tracking-tight">{device.brand}</p>
                        <p className="text-xs uppercase tracking-wider mt-1 opacity-70">{device.name}</p>
                        <p className="text-[8px] uppercase tracking-widest mt-1 opacity-50">{device.category}</p>
                      </button>
                      {!isInGear && (
                        <button
                          onClick={() => handleAddToGear(device)}
                          className="ml-4 p-2 rounded-lg border-2 border-zinc-700 hover:border-white transition-all"
                          title="Add to your gear"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSelectorModal;
