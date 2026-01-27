import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Coffee, Award, Eye, EyeOff, Settings2, Calculator, Plus, Image as ImageIcon, MessageSquare, ArrowRight, RotateCcw, FlaskConical, Beaker, Loader2, ChevronRight } from 'lucide-react';
import { BrewActivity } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { createActivity, uploadBrewImage, updateActivity } from '../lib/database';
import DeviceSelectorModal from './DeviceSelectorModal';

const INITIAL_FORM_DATA = {
  title: '',
  description: '',
  roaster: '',
  origin: '',
  estate: '',
  varietal: '',
  process: '',
  brewType: 'filter' as 'espresso' | 'filter',
  brewer: '',
  grindSetting: '',
  ratio: '1:15',
  gramsIn: '15.0',
  gramsOut: '225.0',
  brewWeight: '',
  temp: '94',
  brewTime: '02:30',
  rating: 8.0,
  tds: '0',
  eyPercentage: 0,
  isPrivate: false,
  showParameters: true,
  showEstate: false,
  showVarietal: false,
  showProcess: false,
  showEY: false,
  showMilk: false,
  milkType: 'none' as 'none' | 'steamed' | 'cold',
  steamedDrink: 'latte' as 'macchiato' | 'cortado' | 'flatwhite' | 'cappuccino' | 'latte',
  drinkSize: 12,
  coldMilkOz: 2,
  podSize: 'medium' as 'small' | 'medium' | 'large',
  podName: '',
  location: ''
};

interface BrewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  editActivity?: BrewActivity | null;
}

const BrewLogModal: React.FC<BrewLogModalProps> = ({ isOpen, onClose, editActivity = null }) => {
  const { tempUnit, setTempUnit } = useSettings();
  const { user, profile } = useAuth();
  const defaultLocation = profile ? `${profile.city}, ${profile.country}`.toUpperCase() : '';
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA, location: defaultLocation });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [deviceCategory, setDeviceCategory] = useState<string>('');
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const isPodMachine = deviceCategory === 'pod';

  // Load saved draft or edit activity data on open
  useEffect(() => {
    if (isOpen && profile) {
      if (editActivity) {
        // Load activity data for editing
        setFormData({
          title: editActivity.title || '',
          description: editActivity.description || '',
          roaster: editActivity.roaster || '',
          origin: editActivity.beanOrigin || '',
          estate: editActivity.estate || '',
          varietal: editActivity.varietal || '',
          process: editActivity.process || '',
          brewType: (editActivity.brewType as 'espresso' | 'filter') || 'filter',
          brewer: editActivity.brewer || '',
          grindSetting: editActivity.grindSetting || '',
          ratio: editActivity.ratio || '1:15',
          gramsIn: editActivity.gramsIn?.toString() || '15.0',
          gramsOut: editActivity.gramsOut?.toString() || '225.0',
          brewWeight: editActivity.brewWeight?.toString() || '',
          temp: editActivity.temperature?.toString() || '94',
          brewTime: editActivity.brewTime || '02:30',
          rating: editActivity.rating || 8.0,
          tds: editActivity.tds?.toString() || '0',
          eyPercentage: editActivity.eyPercentage || 0,
          isPrivate: editActivity.isPrivate || false,
          showParameters: editActivity.showParameters !== false,
          showEstate: !!editActivity.estate,
          showVarietal: !!editActivity.varietal,
          showProcess: !!editActivity.process,
          showEY: !!(editActivity.tds || editActivity.eyPercentage),
          showMilk: false,
          milkType: 'none' as 'none' | 'steamed' | 'cold',
          steamedDrink: 'latte' as 'macchiato' | 'cortado' | 'flatwhite' | 'cappuccino' | 'latte',
          drinkSize: 12,
          coldMilkOz: 2,
          podSize: 'medium' as 'small' | 'medium' | 'large',
          podName: '',
          location: editActivity.locationName || defaultLocation
        });
        if (editActivity.imageUrl) {
          setMediaPreview(editActivity.imageUrl);
        }
      } else {
        // Load draft from localStorage
        const savedDraft = localStorage.getItem('elixr_brew_log_draft');
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            // Validate and cap rating to 0-10 range
            if (parsed.rating > 10) parsed.rating = 10;
            if (parsed.rating < 0) parsed.rating = 0;
            setFormData({ ...parsed, location: parsed.location || defaultLocation });
            if (parsed.mediaPreview) {
              setMediaPreview(parsed.mediaPreview);
            }
            if (parsed.deviceCategory) {
              setDeviceCategory(parsed.deviceCategory);
            }
          } catch (err) {
            console.error('Error loading draft:', err);
            setFormData(prev => ({ ...prev, location: defaultLocation }));
          }
        } else {
          setFormData(prev => ({ ...prev, location: defaultLocation }));
        }
      }
    }
  }, [isOpen, defaultLocation, profile, editActivity]);

  // Save draft to localStorage when form data changes (but not when editing)
  useEffect(() => {
    if (isOpen && !editActivity) {
      const draftData = { ...formData, mediaPreview, deviceCategory };
      localStorage.setItem('elixr_brew_log_draft', JSON.stringify(draftData));
    }
  }, [formData, mediaPreview, deviceCategory, isOpen, editActivity]);

  // Handle Temp Conversion when unit changes
  const handleTempUnitToggle = (newUnit: 'C' | 'F') => {
    if (newUnit === tempUnit) return;

    const currentTemp = parseFloat(formData.temp);
    if (!isNaN(currentTemp)) {
      let converted: number;
      if (newUnit === 'F') {
        // C to F
        converted = (currentTemp * 9/5) + 32;
      } else {
        // F to C
        converted = (currentTemp - 32) * 5/9;
      }
      setFormData(prev => ({ ...prev, temp: Math.round(converted).toString() }));
    }
    setTempUnit(newUnit);
  };

  // Recalculate Ratio and EY%
  useEffect(() => {
    const dose = parseFloat(formData.gramsIn);
    const water = parseFloat(formData.gramsOut);
    const tdsVal = parseFloat(formData.tds);

    // Auto-calculate brew weight from gramsOut (water used)
    // Brew weight ≈ water - absorption (coffee absorbs ~2x its weight)
    const calculatedBrewWeight = water - (dose * 2);
    const weight = calculatedBrewWeight > 0 ? calculatedBrewWeight : water;

    if (dose > 0 && water > 0) {
      const r = (water / dose).toFixed(1);
      const ey = (tdsVal > 0 && weight > 0)
        ? (tdsVal * weight) / dose
        : 0;

      setFormData(prev => ({
        ...prev,
        ratio: `1:${r}`,
        brewWeight: weight.toString(),
        eyPercentage: parseFloat(ey.toFixed(2))
      }));
    }
  }, [formData.gramsIn, formData.gramsOut, formData.tds]);

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value.toUpperCase() }));

  const handleDeviceSelect = (deviceName: string, category: string) => {
    setDeviceCategory(category);

    // Auto-detect brew type based on category
    const brewType = category === 'espresso' ? 'espresso' : 'filter';
    const isPod = category === 'pod';

    // Set default values based on brew type
    if (isPod) {
      // Pod machines don't show parameters
      setFormData(prev => ({
        ...prev,
        brewer: deviceName,
        brewType: 'espresso',
        showParameters: false
      }));
    } else if (brewType === 'espresso') {
      setFormData(prev => ({
        ...prev,
        brewer: deviceName,
        brewType,
        showParameters: true,
        gramsIn: '18.0',
        gramsOut: '36.0',
        ratio: '1:2.0',
        temp: '93',
        brewTime: '00:28'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        brewer: deviceName,
        brewType,
        showParameters: true,
        gramsIn: '15.0',
        gramsOut: '225.0',
        ratio: '1:15',
        temp: '94',
        brewTime: '02:30'
      }));
    }
  };

  const handleClearForm = () => {
    if (confirm('Clear all entries? This will reset the entire form.')) {
      setFormData({ ...INITIAL_FORM_DATA, location: defaultLocation });
      setMediaFile(null);
      setMediaPreview(null);
      setDeviceCategory('');
      localStorage.removeItem('elixr_brew_log_draft');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setUploading(true);
    try {
      // Upload image if new file exists
      let imageUrl: string | undefined = editActivity?.imageUrl;
      if (mediaFile) {
        imageUrl = await uploadBrewImage(user.id, mediaFile) || undefined;
      }

      const activityData = {
        title: formData.title || 'BREW SESSION',
        description: formData.description || undefined,
        image_url: imageUrl,
        location_name: formData.location || defaultLocation,
        roaster: isPodMachine ? 'POD MACHINE' : (formData.roaster || 'UNKNOWN'),
        bean_origin: isPodMachine ? 'N/A' : (formData.origin || 'UNKNOWN'),
        estate: !isPodMachine && formData.showEstate ? formData.estate : undefined,
        varietal: !isPodMachine && formData.showVarietal ? formData.varietal : undefined,
        process: !isPodMachine && formData.showProcess ? formData.process : undefined,
        brew_type: formData.brewType,
        brewer: formData.brewer,
        grinder: undefined,
        grind_setting: formData.grindSetting || undefined,
        ratio: formData.ratio,
        grams_in: parseFloat(formData.gramsIn) || 0,
        grams_out: parseFloat(formData.gramsOut) || 0,
        brew_weight: parseFloat(formData.brewWeight) || undefined,
        temperature: parseFloat(formData.temp) || 0,
        temp_unit: tempUnit,
        brew_time: formData.brewTime,
        rating: formData.rating,
        tds: parseFloat(formData.tds) || undefined,
        ey_percentage: formData.eyPercentage || undefined,
        show_parameters: formData.showParameters,
        is_private: formData.isPrivate,
        is_cafe_log: false,
        milk_type: formData.showMilk ? formData.milkType : undefined,
        steamed_drink: formData.showMilk && formData.milkType === 'steamed' ? formData.steamedDrink : undefined,
        drink_size: formData.showMilk && formData.milkType === 'steamed' ? formData.drinkSize : undefined,
        cold_milk_oz: formData.showMilk && formData.milkType === 'cold' ? formData.coldMilkOz : undefined,
        pod_size: isPodMachine ? formData.podSize : undefined,
        pod_name: isPodMachine ? formData.podName : undefined
      };

      let activity;
      if (editActivity) {
        // Update existing activity
        console.log('Updating activity:', editActivity.id);
        console.log('Update data:', activityData);
        activity = await updateActivity(editActivity.id, activityData);
        console.log('Update result:', activity);
      } else {
        // Create new activity
        activity = await createActivity(profile.id, activityData);
      }

      if (activity) {
        // Reset form and clear draft
        setFormData({ ...INITIAL_FORM_DATA, location: defaultLocation });
        setMediaFile(null);
        setMediaPreview(null);
        localStorage.removeItem('elixr_brew_log_draft');
        onClose();
      } else {
        console.error(`Failed to ${editActivity ? 'update' : 'create'} brew log - no activity returned`);
        alert(`Failed to ${editActivity ? 'update' : 'create'} brew log. Please check console for details.`);
      }
    } catch (err) {
      console.error(`Error ${editActivity ? 'updating' : 'creating'} brew log:`, err);
      alert(`Failed to ${editActivity ? 'update' : 'create'} brew log. Please check console for details.`);
    } finally {
      setUploading(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const ToggleBtn = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border-2 text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white border-white text-black' : 'bg-transparent border-zinc-800 text-zinc-200 hover:border-zinc-700'}`}
    >
      {label}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="relative bg-zinc-900 w-full max-w-2xl h-full sm:h-auto sm:rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col sm:max-h-[90vh] animate-in zoom-in-95 pointer-events-auto">

        <div className="px-8 py-6 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-20">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-black text-white tracking-tighter uppercase">{editActivity ? 'Edit Brew' : 'Log Brew'}</h2>
            <button onClick={onClose} className="text-zinc-100 hover:text-white transition-all" disabled={uploading}><X className="w-6 h-6" /></button>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearForm}
              disabled={uploading}
              className="text-[8px] font-black text-zinc-400 hover:text-white uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setFormData(p => ({...p, isPrivate: !p.isPrivate}))}
              disabled={uploading}
              className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.isPrivate ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white text-black border-white'}`}
            >
              {formData.isPrivate ? <><EyeOff className="inline w-2.5 h-2.5 mr-1" /> Private</> : <><Eye className="inline w-2.5 h-2.5 mr-1" /> Global</>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-10 py-8 space-y-10 custom-scrollbar">

          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.3em] px-1">Session Title</p>
            <input
              type="text" required value={formData.title} onChange={e => handleInputChange('title', e.target.value)}
              disabled={uploading}
              className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-white rounded-2xl outline-none text-2xl font-black text-white uppercase tracking-tighter px-6 py-5 placeholder:text-zinc-800 transition-all disabled:opacity-50"
              placeholder="NAME THIS SESSION"
            />
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Brewing Device</p>
              <div className={`px-3 py-1.5 rounded-lg border-2 text-[8px] font-black uppercase tracking-widest ${formData.brewType === 'espresso' ? 'bg-white text-black border-white' : 'bg-zinc-800 text-zinc-200 border-zinc-700'}`}>
                {formData.brewType === 'espresso' ? 'ESPRESSO' : 'FILTER'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDeviceSelector(true)}
              disabled={uploading}
              className="w-full bg-black border-2 border-zinc-800 hover:border-zinc-600 rounded-2xl px-5 py-4 text-left flex items-center justify-between transition-all disabled:opacity-50"
            >
              <div>
                {formData.brewer ? (
                  <p className="text-white font-black text-sm uppercase">{formData.brewer}</p>
                ) : (
                  <p className="text-zinc-700 font-black text-sm uppercase">Select Device</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500" />
            </button>
          </section>

          {/* Bean Information - Hidden for Pod Machines */}
          {!isPodMachine && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Roaster</label>
                  <input type="text" value={formData.roaster} onChange={e => handleInputChange('roaster', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="SEY / ONYX / ETC" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Origin</label>
                  <input type="text" value={formData.origin} onChange={e => handleInputChange('origin', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="ETHIOPIA / KENYA" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <ToggleBtn label="Farm / Estate" active={formData.showEstate} onClick={() => setFormData(p => ({...p, showEstate: !p.showEstate}))} />
                  <ToggleBtn label="Varietal" active={formData.showVarietal} onClick={() => setFormData(p => ({...p, showVarietal: !p.showVarietal}))} />
                  <ToggleBtn label="Processing" active={formData.showProcess} onClick={() => setFormData(p => ({...p, showProcess: !p.showProcess}))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {formData.showEstate && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <label className="text-[8px] font-black text-zinc-100 uppercase tracking-widest px-1">Estate</label>
                      <input type="text" value={formData.estate} onChange={e => handleInputChange('estate', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase disabled:opacity-50" />
                    </div>
                  )}
                  {formData.showVarietal && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <label className="text-[8px] font-black text-zinc-100 uppercase tracking-widest px-1">Varietal</label>
                      <input type="text" value={formData.varietal} onChange={e => handleInputChange('varietal', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase disabled:opacity-50" />
                    </div>
                  )}
                  {formData.showProcess && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <label className="text-[8px] font-black text-zinc-100 uppercase tracking-widest px-1">Processing</label>
                      <input type="text" value={formData.process} onChange={e => handleInputChange('process', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase disabled:opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-zinc-800 pb-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2"><Settings2 className="w-4 h-4" /> Brew Parameters</h3>
              <div onClick={() => setFormData(p => ({...p, showParameters: !p.showParameters}))} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.showParameters ? 'bg-white' : 'bg-zinc-800'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.showParameters ? 'left-6 bg-black' : 'left-1 bg-white'}`} />
              </div>
            </div>

            {formData.showParameters && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-black border-2 border-zinc-800 p-8 rounded-[2.5rem]">
                  <div className="flex flex-col items-center">
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest mb-3">DOSE (G)</p>
                    <input type="number" step="0.1" value={formData.gramsIn} onChange={e => setFormData({...formData, gramsIn: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-lg outline-none focus:border-white disabled:opacity-50" />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest mb-3">WATER (G)</p>
                    <input type="number" step="1" value={formData.gramsOut} onChange={e => setFormData({...formData, gramsOut: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-lg outline-none focus:border-white disabled:opacity-50" />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest">TEMP</p>
                      <div className="flex bg-zinc-900 rounded p-0.5 border border-zinc-800">
                        <button type="button" onClick={() => handleTempUnitToggle('C')} disabled={uploading} className={`px-1.5 py-0.5 rounded text-[6px] font-black transition-all disabled:opacity-50 ${tempUnit === 'C' ? 'bg-white text-black' : 'text-zinc-200'}`}>°C</button>
                        <button type="button" onClick={() => handleTempUnitToggle('F')} disabled={uploading} className={`px-1.5 py-0.5 rounded text-[6px] font-black transition-all disabled:opacity-50 ${tempUnit === 'F' ? 'bg-white text-black' : 'text-zinc-200'}`}>°F</button>
                      </div>
                    </div>
                    <input type="number" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-lg outline-none focus:border-white disabled:opacity-50" />
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest mb-3">RATIO</p>
                    <div className="w-full py-2 text-white font-black text-center text-lg border-b-2 border-transparent">{formData.ratio}</div>
                  </div>
                  <div className="flex flex-col items-center col-span-2 sm:col-span-4">
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest mb-3">TBT (MM:SS)</p>
                    <input
                      type="text"
                      value={formData.brewTime}
                      onChange={e => setFormData({...formData, brewTime: e.target.value})}
                      disabled={uploading}
                      placeholder="02:30"
                      className="w-full sm:w-32 bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-lg outline-none focus:border-white disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <ToggleBtn label="EY% Analytics" active={formData.showEY} onClick={() => setFormData(p => ({...p, showEY: !p.showEY}))} />
                </div>

                {formData.showEY && (
                  <div className="space-y-4 animate-in slide-in-from-top-1">
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 rounded-2xl space-y-2">
                      <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-3 h-3" /> TDS</p>
                      <input type="number" step="0.01" value={formData.tds} onChange={e => setFormData({...formData, tds: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-zinc-800 py-1 text-white font-black text-xl outline-none focus:border-white disabled:opacity-50" placeholder="1.40" />
                    </div>
                    <div className="bg-white text-black p-4 rounded-xl flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Calculated EY%</p>
                      <p className="text-2xl font-black">{formData.eyPercentage}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pod Machine Section */}
            {isPodMachine && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Pod Name</label>
                    <input type="text" value={formData.podName} onChange={e => handleInputChange('podName', e.target.value)} disabled={uploading} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="STARBUCKS PIKE PLACE" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Cup Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['small', 'medium', 'large'] as const).map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, podSize: size }))}
                          disabled={uploading}
                          className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${formData.podSize === size ? 'bg-white text-black border-white' : 'bg-black text-zinc-200 border-zinc-800 hover:border-zinc-600'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Milk Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-zinc-800 pb-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2"><Coffee className="w-4 h-4" /> Milk</h3>
              <div onClick={() => setFormData(p => ({...p, showMilk: !p.showMilk}))} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.showMilk ? 'bg-white' : 'bg-zinc-800'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.showMilk ? 'left-6 bg-black' : 'left-1 bg-white'}`} />
              </div>
            </div>

            {formData.showMilk && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Milk Type Selection */}
                <div className="space-y-3">
                  <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest px-1">Milk Type</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'none' }))}
                      disabled={uploading}
                      className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${formData.milkType === 'none' ? 'bg-white text-black border-white' : 'bg-black text-zinc-200 border-zinc-800 hover:border-zinc-600'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'steamed' }))}
                      disabled={uploading}
                      className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${formData.milkType === 'steamed' ? 'bg-white text-black border-white' : 'bg-black text-zinc-200 border-zinc-800 hover:border-zinc-600'}`}
                    >
                      Steamed
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'cold' }))}
                      disabled={uploading}
                      className={`px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${formData.milkType === 'cold' ? 'bg-white text-black border-white' : 'bg-black text-zinc-200 border-zinc-800 hover:border-zinc-600'}`}
                    >
                      Cold
                    </button>
                  </div>
                </div>

                {/* Steamed Milk Options */}
                {formData.milkType === 'steamed' && (
                  <div className="space-y-6 animate-in slide-in-from-top-1">
                    <div className="space-y-3">
                      <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest px-1">Drink Style</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(['macchiato', 'cortado', 'flatwhite', 'cappuccino', 'latte'] as const).map(drink => (
                          <button
                            key={drink}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, steamedDrink: drink }))}
                            disabled={uploading}
                            className={`px-4 py-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${formData.steamedDrink === drink ? 'bg-white text-black border-white' : 'bg-black text-zinc-200 border-zinc-800 hover:border-zinc-600'}`}
                          >
                            {drink === 'flatwhite' ? 'Flat White' : drink}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest">Drink Size</p>
                        <p className="text-lg font-black text-white">{formData.drinkSize} OZ</p>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="20"
                        step="1"
                        value={formData.drinkSize}
                        onChange={e => setFormData({...formData, drinkSize: parseInt(e.target.value)})}
                        disabled={uploading}
                        className="w-full slider h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">
                        <span>4 oz</span>
                        <span>20 oz</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cold Milk Options */}
                {formData.milkType === 'cold' && (
                  <div className="space-y-3 animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[8px] font-black text-zinc-200 uppercase tracking-widest">Cold Milk Amount</p>
                      <p className="text-lg font-black text-white">{formData.coldMilkOz} OZ</p>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={formData.coldMilkOz}
                      onChange={e => setFormData({...formData, coldMilkOz: parseFloat(e.target.value)})}
                      disabled={uploading}
                      className="w-full slider h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">
                      <span>0.5 oz</span>
                      <span>8 oz</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-1"><p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Overall Score</p><p className="text-2xl font-black">{formData.rating.toFixed(1)}</p></div>
            <input type="range" min="0" max="10" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} disabled={uploading} className="w-full cursor-pointer disabled:opacity-50" />
          </section>

          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Description & Tasting Notes</p>
            <textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} disabled={uploading} placeholder="CUPS NOTES, TEXTURE, PHILOSOPHY..." className="w-full bg-black border-2 border-zinc-800 rounded-[2rem] p-6 text-sm text-white font-black focus:border-white outline-none min-h-[140px] resize-none uppercase disabled:opacity-50" />
          </section>

          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">Visual Documentation</p>
            <div
              onClick={() => !uploading && mediaInputRef.current?.click()}
              className={`w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-zinc-800 bg-black flex flex-col items-center justify-center ${uploading ? 'cursor-wait' : 'cursor-pointer hover:border-white'} transition-all overflow-hidden relative group`}
            >
              {mediaPreview ? (
                <>
                  <img src={mediaPreview} className="w-full h-full object-cover transition-all" alt="Preview" />
                  {!uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Plus className="w-10 h-10 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-zinc-800 mb-2" />
                  <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">TAP TO ATTACH MEDIA</p>
                </>
              )}
            </div>
            <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*" disabled={uploading} />
          </section>

          <section className="pt-6 pb-8">
            <button type="submit" disabled={uploading} className="w-full bg-white text-black font-black text-sm uppercase tracking-[0.4em] py-7 rounded-[2.5rem] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-zinc-800 disabled:text-zinc-700">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {editActivity ? 'UPDATING...' : 'UPLOADING...'}
                </>
              ) : (
                <>
                  {editActivity ? 'UPDATE' : 'SHARE'} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </section>
        </form>
      </div>

      <DeviceSelectorModal
        isOpen={showDeviceSelector}
        onClose={() => setShowDeviceSelector(false)}
        onSelect={handleDeviceSelect}
        currentDevice={formData.brewer}
      />
    </div>
  );
};

export default BrewLogModal;
