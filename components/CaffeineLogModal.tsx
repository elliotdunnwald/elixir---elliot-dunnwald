import React, { useState } from 'react';
import { X, Zap, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { createActivity } from '../lib/database';

interface CaffeineLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Common drinks and their caffeine content (in mg)
const COMMON_DRINKS = [
  { name: 'MATCHA LATTE', caffeine: 70 },
  { name: 'GREEN TEA', caffeine: 30 },
  { name: 'BLACK TEA', caffeine: 50 },
  { name: 'YERBA MATE', caffeine: 85 },
  { name: 'RED BULL (8.4 OZ)', caffeine: 80 },
  { name: 'MONSTER (16 OZ)', caffeine: 160 },
  { name: 'CELSIUS', caffeine: 200 },
  { name: 'BANG ENERGY', caffeine: 300 },
  { name: 'COKE (12 OZ)', caffeine: 34 },
  { name: 'DIET COKE (12 OZ)', caffeine: 46 },
];

const CaffeineLogModal: React.FC<CaffeineLogModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [drinkName, setDrinkName] = useState('');
  const [caffeineMg, setCaffeineMg] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickSelect = (drink: typeof COMMON_DRINKS[0]) => {
    setDrinkName(drink.name);
    setCaffeineMg(drink.caffeine.toString());
  };

  const handleSubmit = async () => {
    if (!profile || !drinkName || !caffeineMg) return;

    setLoading(true);

    try {
      await createActivity({
        profile_id: profile.id,
        title: drinkName,
        description: notes || undefined,
        location_name: brand || 'Home',
        roaster: brand || 'Unknown',
        bean_origin: 'N/A',
        brewer: `Caffeine: ${caffeineMg}mg`,
        ratio: '1:1',
        grams_in: parseInt(caffeineMg) || 0,
        grams_out: 0,
        temperature: 0,
        temp_unit: 'C',
        brew_time: '00:00',
        rating: undefined,
        show_parameters: false,
        is_cafe_log: false,
        brew_type: 'filter',
      });

      // Reset form
      setDrinkName('');
      setCaffeineMg('');
      setBrand('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error logging caffeine:', error);
      alert('Failed to log caffeine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-black shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-black" />
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Log Caffeine</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Select */}
          <div>
            <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_DRINKS.slice(0, 6).map((drink) => (
                <button
                  key={drink.name}
                  onClick={() => handleQuickSelect(drink)}
                  className={`border-2 rounded-xl p-3 text-left transition-all ${
                    drinkName === drink.name
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-tight">{drink.name}</p>
                  <p className="text-[9px] font-bold opacity-70 mt-1">{drink.caffeine}mg</p>
                </button>
              ))}
            </div>
          </div>

          {/* Drink Name */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider mb-2 block">
              What did you drink?
            </label>
            <input
              type="text"
              value={drinkName}
              onChange={(e) => setDrinkName(e.target.value)}
              placeholder="E.G., MATCHA LATTE, RED BULL..."
              className="w-full bg-white border-2 border-black rounded-xl p-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black uppercase font-black"
            />
          </div>

          {/* Caffeine Amount */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider mb-2 block">
              Caffeine Amount (mg)
            </label>
            <input
              type="number"
              value={caffeineMg}
              onChange={(e) => setCaffeineMg(e.target.value)}
              placeholder="100"
              className="w-full bg-white border-2 border-black rounded-xl p-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black font-black"
              min="0"
              step="5"
            />
            <p className="text-[9px] text-zinc-500 mt-2 uppercase tracking-wider">
              Check the label or search online for caffeine content
            </p>
          </div>

          {/* Brand (Optional) */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider mb-2 block">
              Brand (Optional)
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="E.G., CELSIUS, STARBUCKS..."
              className="w-full bg-white border-2 border-black rounded-xl p-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black uppercase font-black"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider mb-2 block">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it taste? How did you feel?..."
              className="w-full bg-white border-2 border-black rounded-xl p-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black resize-none uppercase font-black"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black px-6 py-4 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black border-2 border-black py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!drinkName || !caffeineMg || loading}
            className="flex-1 bg-black text-white border-2 border-black py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? 'Logging...' : (
              <>
                <Check className="w-4 h-4" />
                Log Caffeine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaffeineLogModal;
