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
}

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({ isOpen, activity, onClose, onSave }) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['coffee_name', 'roaster_name']));
  const [notes, setNotes] = useState('');

  if (!isOpen || !activity) return null;

  // Build available fields from the activity
  const availableFields: FieldOption[] = [];

  if (activity.coffee_name) availableFields.push({ key: 'coffee_name', label: 'Coffee', value: activity.coffee_name });
  if (activity.roaster_name) availableFields.push({ key: 'roaster_name', label: 'Roaster', value: activity.roaster_name });
  if (activity.brewer) availableFields.push({ key: 'brewer', label: 'Brewing Method', value: activity.brewer });
  if (activity.temperature_c !== undefined && activity.temperature_c !== null) availableFields.push({ key: 'temperature_c', label: 'Temperature', value: `${activity.temperature_c}°C` });
  if (activity.brew_time_seconds) availableFields.push({ key: 'brew_time_seconds', label: 'Brew Time', value: `${Math.floor(activity.brew_time_seconds / 60)}:${(activity.brew_time_seconds % 60).toString().padStart(2, '0')}` });
  if (activity.grind_size) availableFields.push({ key: 'grind_size', label: 'Grind Size', value: activity.grind_size });
  if (activity.grams_in) availableFields.push({ key: 'grams_in', label: 'Coffee Dose', value: `${activity.grams_in}g` });
  if (activity.grams_out) availableFields.push({ key: 'grams_out', label: 'Water Amount', value: `${activity.grams_out}g` });
  if (activity.tds !== undefined && activity.tds !== null) availableFields.push({ key: 'tds', label: 'TDS', value: `${activity.tds}%` });
  if (activity.extraction_yield !== undefined && activity.extraction_yield !== null) availableFields.push({ key: 'extraction_yield', label: 'Extraction Yield', value: `${activity.extraction_yield}%` });
  if (activity.rating) availableFields.push({ key: 'rating', label: 'Rating', value: `${activity.rating}/5` });
  if (activity.description) availableFields.push({ key: 'description', label: 'Notes/Description', value: activity.description });

  const toggleField = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      // Don't allow deselecting coffee and roaster - they're required
      if (fieldKey === 'coffee_name' || fieldKey === 'roaster_name') return;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000] p-4">
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
            <p className="text-lg font-black text-black">@{activity.username}</p>
            <p className="text-xs text-zinc-600 mt-2">
              {activity.coffee_name} • {activity.roaster_name}
            </p>
          </div>

          {/* Field Selection */}
          <div>
            <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
              Select Fields to Save
            </p>
            <div className="space-y-2 bg-zinc-50 border-2 border-black rounded-xl p-4 max-h-[300px] overflow-y-auto">
              {availableFields.map((field) => {
                const isSelected = selectedFields.has(field.key);
                const isRequired = field.key === 'coffee_name' || field.key === 'roaster_name';

                return (
                  <button
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    disabled={isRequired}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all border-2 ${
                      isSelected
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black hover:bg-zinc-50'
                    } ${isRequired ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    <div className="text-left flex-1">
                      <p className="text-xs font-black uppercase tracking-wide">
                        {field.label} {isRequired && '(Required)'}
                      </p>
                      <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-zinc-600'}`}>
                        {field.value}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-white bg-white' : 'border-black'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wider">
              {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected
            </p>
          </div>

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
