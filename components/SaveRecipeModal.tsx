import React, { useState } from 'react';
import { X, Check, Bookmark } from 'lucide-react';
import { BrewActivity } from '../types';

interface SaveRecipeModalProps {
  isOpen: boolean;
  activity: BrewActivity | null;
  onClose: () => void;
  onSave: (selectedFields: string[], notes?: string) => void;
}

interface FieldOption {
  key: string;
  label: string;
  value: any;
  category: 'coffee' | 'brewing';
}

// Helper to clean up duplicate brand names in brewer string
const cleanBrewerName = (brewer: string): string => {
  if (!brewer) return brewer;

  const parts = brewer.split(' ');
  // Check if first word is repeated (e.g., "AEROPRESS AEROPRESS CLEAR" -> "AEROPRESS CLEAR")
  if (parts.length >= 2 && parts[0] === parts[1]) {
    return parts.slice(1).join(' ');
  }

  return brewer;
};

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({ isOpen, activity, onClose, onSave }) => {
  const [notes, setNotes] = useState('');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['coffee_name', 'roaster_name']));

  if (!isOpen || !activity) return null;

  // Build available fields
  const availableFields: FieldOption[] = [
    { key: 'coffee_name', label: 'Coffee Name', value: activity.title, category: 'coffee' },
    { key: 'roaster_name', label: 'Roaster', value: activity.roaster, category: 'coffee' },
  ];

  if (activity.brewer) {
    availableFields.push({ key: 'brewer', label: 'Brewing Method', value: cleanBrewerName(activity.brewer), category: 'brewing' });
  }
  if (activity.temperature !== undefined && activity.temperature !== null) {
    availableFields.push({ key: 'temperature_c', label: 'Temperature', value: `${activity.temperature}°${activity.tempUnit}`, category: 'brewing' });
  }
  if (activity.brewTime) {
    availableFields.push({ key: 'brew_time_seconds', label: 'Brew Time', value: activity.brewTime, category: 'brewing' });
  }
  if (activity.gramsIn) {
    availableFields.push({ key: 'grams_in', label: 'Coffee Dose', value: `${activity.gramsIn}g`, category: 'brewing' });
  }
  if (activity.gramsOut) {
    availableFields.push({ key: 'grams_out', label: 'Water Amount', value: `${activity.gramsOut}g`, category: 'brewing' });
  }
  if (activity.tds !== undefined && activity.tds !== null) {
    availableFields.push({ key: 'tds', label: 'TDS', value: `${activity.tds}%`, category: 'brewing' });
  }
  if (activity.eyPercentage !== undefined && activity.eyPercentage !== null) {
    availableFields.push({ key: 'extraction_yield', label: 'Extraction Yield', value: `${activity.eyPercentage}%`, category: 'brewing' });
  }

  const coffeeFields = availableFields.filter(f => f.category === 'coffee');
  const brewingFields = availableFields.filter(f => f.category === 'brewing');

  const toggleField = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSave = () => {
    onSave(Array.from(selectedFields), notes.trim() || undefined);
    setNotes('');
    setSelectedFields(new Set(['coffee_name', 'roaster_name']));
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-black shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-black" />
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Save Recipe</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <X className="w-6 h-6 text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Attribution */}
          <div className="bg-zinc-50 border-2 border-black rounded-xl p-4">
            <p className="text-xs font-black text-black uppercase tracking-wider mb-1">Recipe By</p>
            <p className="text-lg font-black text-black">@{activity.userUsername || activity.userName}</p>
          </div>

          {/* Coffee Details Section */}
          <div>
            <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
              Coffee Details
            </p>
            <div className="space-y-2">
              {coffeeFields.map(field => (
                <button
                  key={field.key}
                  onClick={() => toggleField(field.key)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedFields.has(field.key)
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider opacity-70">{field.label}</p>
                    <p className="text-sm font-black mt-1">{field.value}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedFields.has(field.key)
                      ? 'bg-white border-white'
                      : 'bg-white border-black'
                  }`}>
                    {selectedFields.has(field.key) && <Check className="w-4 h-4 text-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brewing Parameters Section */}
          {brewingFields.length > 0 && (
            <div>
              <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
                Brewing Parameters
              </p>
              <div className="grid grid-cols-2 gap-2">
                {brewingFields.map(field => (
                  <button
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      selectedFields.has(field.key)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-zinc-50'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-70">{field.label}</p>
                      <p className="text-xs font-black mt-0.5">{field.value}</p>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedFields.has(field.key)
                        ? 'bg-white border-white'
                        : 'bg-white border-black'
                    }`}>
                      {selectedFields.has(field.key) && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Notes */}
          <div>
            <label className="text-xs font-black text-black uppercase tracking-wider mb-2 block">
              Add Personal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your own notes about this recipe..."
              className="w-full bg-white border-2 border-black rounded-xl p-4 text-sm text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black resize-none"
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
            onClick={handleSave}
            disabled={selectedFields.size === 0}
            className="flex-1 bg-black text-white border-2 border-black py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Bookmark className="w-4 h-4" />
            Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveRecipeModal;
