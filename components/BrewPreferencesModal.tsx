import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Coffee, Check } from 'lucide-react';
import { getBrewPreferences, updateBrewPreferences, BrewPreferences } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

interface BrewPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BrewPreferencesModal: React.FC<BrewPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [brewPreferences, setBrewPreferences] = useState<BrewPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile || !isOpen) return;

    const loadPreferences = async () => {
      setLoading(true);
      const prefs = await getBrewPreferences(profile.id);
      if (prefs) {
        setBrewPreferences(prefs);
      } else {
        // Set defaults
        setBrewPreferences({
          userType: 'coffee',
          detailLevel: 'balanced',
          customFields: {
            temperature: true,
            brewTime: true,
            grindSize: true,
            coffeeDose: true,
            waterAmount: true,
            tds: false,
            extractionYield: false,
            description: true,
            rating: true,
          },
        });
      }
      setLoading(false);
    };

    loadPreferences();
  }, [profile, isOpen]);

  const handleSave = async () => {
    if (!profile || !brewPreferences) return;

    setSaving(true);
    const success = await updateBrewPreferences(profile.id, brewPreferences);
    setSaving(false);

    if (success) {
      onClose();
    } else {
      alert('Failed to save preferences. Please try again.');
    }
  };

  const handleDetailLevelChange = (level: 'simplified' | 'balanced' | 'detailed') => {
    if (!brewPreferences) return;

    const presets = {
      simplified: {
        temperature: false,
        brewTime: false,
        grindSize: false,
        coffeeDose: false,
        waterAmount: false,
        tds: false,
        extractionYield: false,
        description: true,
        rating: true,
      },
      balanced: {
        temperature: true,
        brewTime: true,
        grindSize: false,
        coffeeDose: true,
        waterAmount: true,
        tds: false,
        extractionYield: false,
        description: true,
        rating: true,
      },
      detailed: {
        temperature: true,
        brewTime: true,
        grindSize: false,
        coffeeDose: true,
        waterAmount: true,
        tds: true,
        extractionYield: true,
        description: true,
        rating: true,
      },
    };

    setBrewPreferences({
      ...brewPreferences,
      detailLevel: level,
      customFields: presets[level],
    });
  };

  const handleFieldToggle = (field: keyof BrewPreferences['customFields']) => {
    if (!brewPreferences) return;

    setBrewPreferences({
      ...brewPreferences,
      customFields: {
        ...brewPreferences.customFields,
        [field]: !brewPreferences.customFields[field],
      },
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" onClick={onClose} style={{ top: 0, left: 0, right: 0, bottom: 0 }} />
      <div className="relative bg-white w-full max-w-2xl h-full sm:h-auto sm:rounded-xl shadow-2xl shadow-black/5 sm:border-2 border-black overflow-hidden flex flex-col sm:max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 sm:px-8 pb-6 border-b-2 border-black flex justify-between items-center bg-white sticky top-0 z-20" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-black" />
            <h2 className="text-xl font-black text-black tracking-tighter uppercase">Brew Preferences</h2>
          </div>
          <button onClick={onClose} className="text-black hover:text-black transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 sm:px-10 py-10 space-y-12 custom-scrollbar flex-1">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-500 uppercase tracking-wider">Loading...</p>
            </div>
          ) : brewPreferences ? (
            <>
              {/* Detail Level Presets */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">Detail Level</p>
                <div className="space-y-2">
                  {['simplified', 'balanced', 'detailed'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleDetailLevelChange(level as any)}
                      className={`w-full py-4 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-wider transition-all text-left flex items-center justify-between ${
                        brewPreferences.detailLevel === level
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black'
                      }`}
                    >
                      <span>{level}</span>
                      {brewPreferences.detailLevel === level && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* Individual Field Toggles */}
              <section className="space-y-3">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest px-1">Custom Fields</p>
                <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {Object.entries({
                      temperature: 'Temperature',
                      brewTime: 'Brew Time',
                      coffeeDose: 'Coffee Dose',
                      waterAmount: 'Water Amount',
                      tds: 'TDS',
                      extractionYield: 'Extraction Yield',
                      description: 'Description',
                      rating: 'Rating',
                    }).map(([field, label]) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => handleFieldToggle(field as keyof BrewPreferences['customFields'])}
                        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white transition-all border-2 border-transparent hover:border-black"
                      >
                        <span className="text-[10px] font-black text-black uppercase tracking-wide">
                          {label}
                        </span>
                        <div
                          className={`w-11 h-6 rounded-full transition-all relative ${
                            brewPreferences.customFields[field as keyof BrewPreferences['customFields']]
                              ? 'bg-black'
                              : 'bg-zinc-300'
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              brewPreferences.customFields[field as keyof BrewPreferences['customFields']]
                                ? 'right-1'
                                : 'left-1'
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black px-6 sm:px-8 py-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black border-2 border-black py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-50 active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-black text-white border-2 border-black py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BrewPreferencesModal;
