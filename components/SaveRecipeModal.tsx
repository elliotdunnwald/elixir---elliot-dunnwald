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

  if (!isOpen || !activity) return null;

  // Automatically include all available brewing parameters
  const parametersToSave: string[] = ['coffee_name', 'roaster_name'];

  if (activity.brewer) parametersToSave.push('brewer');
  if (activity.temperature !== undefined && activity.temperature !== null) parametersToSave.push('temperature_c');
  if (activity.brewTime) parametersToSave.push('brew_time_seconds');
  if (activity.grindSetting) parametersToSave.push('grind_size');
  if (activity.gramsIn) parametersToSave.push('grams_in');
  if (activity.gramsOut) parametersToSave.push('grams_out');
  if (activity.tds !== undefined && activity.tds !== null) parametersToSave.push('tds');
  if (activity.eyPercentage !== undefined && activity.eyPercentage !== null) parametersToSave.push('extraction_yield');

  const handleSave = () => {
    onSave(parametersToSave, notes.trim() || undefined);
    setNotes('');
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
            <p className="text-lg font-black text-black">@{activity.userUsername || activity.userName}</p>
            <p className="text-xs text-zinc-600 mt-2">
              {activity.title} • {activity.roaster}
            </p>
          </div>

          {/* What will be saved */}
          <div>
            <p className="text-xs font-black text-black uppercase tracking-wider mb-3">
              This recipe includes:
            </p>
            <div className="bg-zinc-50 border-2 border-black rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Coffee</p>
                  <p className="text-xs font-black text-black">{activity.title}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Roaster</p>
                  <p className="text-xs font-black text-black">{activity.roaster}</p>
                </div>
                {activity.brewer && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Method</p>
                    <p className="text-xs font-black text-black">{cleanBrewerName(activity.brewer)}</p>
                  </div>
                )}
                {activity.temperature !== undefined && activity.temperature !== null && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Temp</p>
                    <p className="text-xs font-black text-black">{activity.temperature}°{activity.tempUnit}</p>
                  </div>
                )}
                {activity.brewTime && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Time</p>
                    <p className="text-xs font-black text-black">{activity.brewTime}</p>
                  </div>
                )}
                {activity.grindSetting && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Grind</p>
                    <p className="text-xs font-black text-black">{activity.grindSetting}</p>
                  </div>
                )}
                {activity.gramsIn && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Dose</p>
                    <p className="text-xs font-black text-black">{activity.gramsIn}g</p>
                  </div>
                )}
                {activity.gramsOut && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Water</p>
                    <p className="text-xs font-black text-black">{activity.gramsOut}g</p>
                  </div>
                )}
                {activity.tds !== undefined && activity.tds !== null && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">TDS</p>
                    <p className="text-xs font-black text-black">{activity.tds}%</p>
                  </div>
                )}
                {activity.eyPercentage !== undefined && activity.eyPercentage !== null && (
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-wider">Extraction</p>
                    <p className="text-xs font-black text-black">{activity.eyPercentage}%</p>
                  </div>
                )}
              </div>
            </div>
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
            disabled={parametersToSave.length === 0}
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
