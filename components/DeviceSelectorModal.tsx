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
  const [pendingDevice, setPendingDevice] = useState<Device | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);

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
    console.log('🎯 handleSelectDevice called:', { name, brand, category });
    // Check if device is already in user's gear
    const isInGear = userGear.some(g => g.brand === brand && g.name === name);

    if (!isInGear && profile) {
      // Show prompt to add to gear
      console.log('📦 Device not in gear, showing prompt with category:', category);
      setPendingDevice({ name, brand, type: 'brewer', category });
      setShowAddPrompt(true);
    } else {
      // Device is in gear or no profile, just select it
      console.log('✅ Device in gear or no profile, selecting with category:', category);
      const deviceName = `${brand} ${name}`.trim();
      onSelect(deviceName, category);
      onClose();
    }
  };

  const handleUseWithoutAdding = () => {
    if (pendingDevice) {
      console.log('🚫 Use without adding, pending device:', pendingDevice);
      const deviceName = `${pendingDevice.brand} ${pendingDevice.name}`.trim();
      console.log('🚫 Calling onSelect with category:', pendingDevice.category);
      onSelect(deviceName, pendingDevice.category);
      setShowAddPrompt(false);
      setPendingDevice(null);
      onClose();
    }
  };

  const handleAddAndUse = async () => {
    if (pendingDevice && profile) {
      console.log('➕ Add and use, pending device:', pendingDevice);
      await handleAddToGear(pendingDevice);
      setShowAddPrompt(false);
      setPendingDevice(null);
    }
  };

  const handleAddToGear = async (device: Device) => {
    if (!profile) return;

    console.log('💾 Adding to gear, device:', device);
    const deviceName = `${device.brand} ${device.name}`.trim();
    const newGear = await addGearItem(profile.id, {
      name: device.name,
      brand: device.brand,
      type: 'brewer',
      notes: device.category
    });

    if (newGear) {
      console.log('✅ Gear added, calling onSelect with category:', device.category);
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl border border-black overflow-hidden flex flex-col pointer-events-auto">

        {/* Header */}
        <div className="px-8 py-6 border-b border-black flex justify-between items-center bg-white">
          <h2 className="text-xl font-black text-black tracking-tighter uppercase">Select Brewing Device</h2>
          <button onClick={onClose} className="text-zinc-900 hover:text-black active:text-black transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* User's Gear */}
          {userGear.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Your Gear</h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
                {userGear.map(item => {
                  const deviceName = `${item.brand} ${item.name}`.trim();
                  const isSelected = currentDevice === deviceName;

                  // Look up correct category from device database with flexible matching
                  // Try exact match first
                  let deviceInDb = allDevices.find(d =>
                    d.brand.toUpperCase() === item.brand.toUpperCase() &&
                    d.name.toUpperCase() === item.name.toUpperCase()
                  );

                  // If no exact match, try matching the full device name
                  if (!deviceInDb) {
                    const fullName = deviceName.toUpperCase();
                    deviceInDb = allDevices.find(d => {
                      const dbFullName = `${d.brand} ${d.name}`.toUpperCase();
                      return dbFullName === fullName;
                    });
                  }

                  const correctCategory = deviceInDb?.category || item.notes || 'pourover';
                  console.log(`🔍 Gear item: "${item.brand}" "${item.name}" → Found in DB:`, deviceInDb ? `${deviceInDb.brand} ${deviceInDb.name} (${deviceInDb.category})` : 'NOT FOUND, using fallback');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectDevice(item.name, item.brand, correctCategory)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'bg-white text-black border-black'
                          : 'bg-white text-black border-black hover:border-black'
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

          {/* Search */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Search All Devices</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="SEARCH DEVICES..."
                className="w-full bg-white border-2 border-black rounded-2xl pl-12 pr-5 py-4 text-black font-black text-sm outline-none focus:border-black uppercase placeholder:text-black"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Search Results</h3>
              {loading ? (
                <p className="text-black text-sm uppercase tracking-widest">Loading...</p>
              ) : filteredDevices.length === 0 ? (
                <p className="text-black text-sm uppercase tracking-widest">No devices found</p>
              ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredDevices.slice(0, 50).map((device, idx) => {
                  const deviceName = `${device.brand} ${device.name}`.trim();
                  const isInGear = userGear.some(g => g.brand === device.brand && g.name === device.name);
                  const isSelected = currentDevice === deviceName;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectDevice(device.name, device.brand, device.category)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'bg-white text-black border-black'
                          : 'bg-white border-black hover:border-black'
                      }`}
                    >
                      <p className="font-black text-sm uppercase tracking-tight">{device.brand}</p>
                      <p className="text-xs uppercase tracking-wider mt-1 opacity-70">{device.name}</p>
                      <p className="text-[8px] uppercase tracking-widest mt-1 opacity-50">{device.category}</p>
                    </button>
                  );
                })}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add to Gear Prompt */}
      {showAddPrompt && pendingDevice && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-10 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border-2 border-black p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <Coffee className="w-12 h-12 text-black mx-auto" />
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Add to Your Gear?</h3>
              <p className="text-sm font-black text-black uppercase tracking-wider">
                {pendingDevice.brand} {pendingDevice.name}
              </p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Save this device to your collection for quick access next time
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddAndUse}
                className="w-full bg-white text-black border-2 border-black rounded-xl py-4 font-black text-sm uppercase tracking-widest hover:bg-zinc-50 active:scale-[0.98] transition-all"
              >
                Add to Gear & Use
              </button>
              <button
                onClick={handleUseWithoutAdding}
                className="w-full bg-zinc-50 text-black border-2 border-black rounded-xl py-4 font-black text-[11px] uppercase tracking-widest hover:bg-zinc-100 active:scale-[0.98] transition-all"
              >
                Just Use This Once
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSelectorModal;
