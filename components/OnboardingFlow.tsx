import React, { useState } from 'react';
import { Coffee, Home, MapPin, Sliders, ChevronRight, Check } from 'lucide-react';

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: (preferences: BrewPreferences) => void;
}

export interface BrewPreferences {
  userType: 'coffee' | 'caffeine';
  brewsAtHome: boolean;
  visitsCafes: boolean;
  detailLevel: 'simplified' | 'balanced' | 'detailed';
  customFields: {
    temperature: boolean;
    brewTime: boolean;
    grindSize: boolean;
    coffeeDose: boolean;
    waterAmount: boolean;
    tds: boolean;
    extractionYield: boolean;
    description: boolean;
    rating: boolean;
  };
}

const DEFAULT_FIELDS = {
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
    grindSize: true,
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
    grindSize: true,
    coffeeDose: true,
    waterAmount: true,
    tds: true,
    extractionYield: true,
    description: true,
    rating: true,
  },
};

const FIELD_LABELS: Record<keyof BrewPreferences['customFields'], string> = {
  temperature: 'Temperature',
  brewTime: 'Brew Time',
  grindSize: 'Grind Size',
  coffeeDose: 'Coffee Dose',
  waterAmount: 'Water Amount',
  tds: 'TDS (Total Dissolved Solids)',
  extractionYield: 'Extraction Yield %',
  description: 'Description/Notes',
  rating: 'Rating',
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<BrewPreferences>({
    userType: 'coffee',
    brewsAtHome: false,
    visitsCafes: false,
    detailLevel: 'balanced',
    customFields: DEFAULT_FIELDS.balanced,
  });

  if (!isOpen) return null;

  const handleDetailLevelChange = (level: 'simplified' | 'balanced' | 'detailed') => {
    setPreferences(prev => ({
      ...prev,
      detailLevel: level,
      customFields: DEFAULT_FIELDS[level],
    }));
  };

  const handleFieldToggle = (field: keyof BrewPreferences['customFields']) => {
    setPreferences(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [field]: !prev.customFields[field],
      },
    }));
  };

  const handleComplete = () => {
    onComplete(preferences);
  };

  return (
    <div className="fixed inset-0 bg-white z-[3000] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(preferences.userType === 'caffeine' ? [1, 2] : [1, 2, 3, 4]).map(num => (
            <div
              key={num}
              className={`h-2 rounded-full transition-all ${
                num === step ? 'w-8 bg-black' : 'w-2 bg-zinc-300'
              }`}
            />
          ))}
        </div>

        {/* Step 1: User Type Selection */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                Welcome to ELIXR
              </h1>
              <p className="text-sm font-black text-zinc-600 uppercase tracking-wider">
                Let's personalize your experience
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-xs font-black text-black uppercase tracking-wider">
                What brings you to ELIXR?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPreferences(p => ({ ...p, userType: 'coffee' }))}
                  className={`border-2 rounded-xl p-8 transition-all ${
                    preferences.userType === 'coffee'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <Coffee className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-base font-black uppercase tracking-wider">I Brew Coffee</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-3 opacity-70">
                    Track recipes, parameters, and brewing methods
                  </p>
                </button>

                <button
                  onClick={() => setPreferences(p => ({ ...p, userType: 'caffeine' }))}
                  className={`border-2 rounded-xl p-8 transition-all ${
                    preferences.userType === 'caffeine'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <div className="text-4xl mx-auto mb-4">⚡</div>
                  <p className="text-base font-black uppercase tracking-wider">I Track Caffeine</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-3 opacity-70">
                    Log matcha, energy drinks, and caffeine intake
                  </p>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Coffee Habits (Coffee users only) */}
        {step === 2 && preferences.userType === 'coffee' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter">
                Welcome to ELIXR
              </h1>
              <p className="text-sm font-black text-zinc-600 uppercase tracking-wider">
                Let's personalize your experience
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-xs font-black text-black uppercase tracking-wider">
                How do you make and enjoy coffee?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setPreferences(p => ({ ...p, brewsAtHome: !p.brewsAtHome }))}
                  className={`border-2 rounded-xl p-6 transition-all ${
                    preferences.brewsAtHome
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <Home className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm font-black uppercase tracking-wider">I Brew at Home</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-2 opacity-70">
                    Track my home brewing
                  </p>
                </button>

                <button
                  onClick={() => setPreferences(p => ({ ...p, visitsCafes: !p.visitsCafes }))}
                  className={`border-2 rounded-xl p-6 transition-all ${
                    preferences.visitsCafes
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black hover:bg-zinc-50'
                  }`}
                >
                  <MapPin className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-sm font-black uppercase tracking-wider">I Visit Cafes</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-2 opacity-70">
                    Discover & review cafes
                  </p>
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={!preferences.brewsAtHome && !preferences.visitsCafes}
              className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Caffeine User Completion */}
        {step === 2 && preferences.userType === 'caffeine' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">⚡✨</div>
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                You're All Set!
              </h2>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-wider max-w-md mx-auto">
                ELIXR will help you track your caffeine intake from matcha, energy drinks, and more
              </p>
            </div>

            <div className="bg-zinc-50 border-2 border-black rounded-xl p-6 space-y-4">
              <p className="text-xs font-black text-black uppercase tracking-wider">Your Experience:</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-xs text-black">Simple logging: just drink name & caffeine amount</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-xs text-black">Track your daily caffeine intake</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <p className="text-xs text-black">Discover cafes and explore the community</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-zinc-50 border-2 border-black text-black py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Detail Level (Coffee users only) */}
        {step === 3 && preferences.userType === 'coffee' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <Sliders className="w-12 h-12 mx-auto text-black" />
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                Choose Your Detail Level
              </h2>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-wider">
                You can customize individual fields next
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleDetailLevelChange('simplified')}
                className={`w-full border-2 rounded-xl p-5 text-left transition-all ${
                  preferences.detailLevel === 'simplified'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-black uppercase tracking-tight">Simplified</p>
                  {preferences.detailLevel === 'simplified' && <Check className="w-5 h-5" />}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Just the essentials: coffee, roaster, rating, notes
                </p>
              </button>

              <button
                onClick={() => handleDetailLevelChange('balanced')}
                className={`w-full border-2 rounded-xl p-5 text-left transition-all ${
                  preferences.detailLevel === 'balanced'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-black uppercase tracking-tight">Balanced</p>
                  {preferences.detailLevel === 'balanced' && <Check className="w-5 h-5" />}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Core brewing details: temp, time, grind, dose, water
                </p>
              </button>

              <button
                onClick={() => handleDetailLevelChange('detailed')}
                className={`w-full border-2 rounded-xl p-5 text-left transition-all ${
                  preferences.detailLevel === 'detailed'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-black uppercase tracking-tight">Detailed</p>
                  {preferences.detailLevel === 'detailed' && <Check className="w-5 h-5" />}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  Everything: all core details + TDS and extraction yield %
                </p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-zinc-50 border-2 border-black text-black py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Customize Individual Fields (Coffee users only) */}
        {step === 4 && preferences.userType === 'coffee' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-3">
              <Coffee className="w-12 h-12 mx-auto text-black" />
              <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
                Customize Fields
              </h2>
              <p className="text-xs font-black text-zinc-600 uppercase tracking-wider">
                Toggle individual fields on or off
              </p>
            </div>

            <div className="bg-zinc-50 border-2 border-black rounded-xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <button
                    key={field}
                    onClick={() => handleFieldToggle(field as keyof BrewPreferences['customFields'])}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white transition-all border-2 border-transparent hover:border-black"
                  >
                    <span className="text-xs font-black text-black uppercase tracking-wide">
                      {label}
                    </span>
                    <div
                      className={`w-12 h-6 rounded-full transition-all relative ${
                        preferences.customFields[field as keyof BrewPreferences['customFields']]
                          ? 'bg-black'
                          : 'bg-zinc-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          preferences.customFields[field as keyof BrewPreferences['customFields']]
                            ? 'right-1'
                            : 'left-1'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-zinc-50 border-2 border-black text-black py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Complete Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
