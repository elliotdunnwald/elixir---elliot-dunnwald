
import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Coffee, Award, Eye, EyeOff, Settings2, Calculator, Plus, Image as ImageIcon, MessageSquare, ArrowRight, RotateCcw, FlaskConical, Beaker } from 'lucide-react';
import { BrewActivity } from '../types';
import { useSettings } from '../context/SettingsContext';

const INITIAL_FORM_DATA = {
  title: '',
  description: '',
  roaster: '',
  origin: '',
  estate: '',
  varietal: '',
  process: '',
  brewer: 'V60',
  grindSetting: '',
  ratio: '1:15',
  gramsIn: '15.0',
  gramsOut: '225.0',
  brewWeight: '200.0',
  temp: '94',
  brewTime: '02:30',
  rating: 8.5,
  tds: '0',
  eyPercentage: 0,
  isPrivate: false,
  showParameters: true,
  showEstate: false,
  showVarietal: false,
  showProcess: false,
  showEY: false,
  location: ''
};

interface BrewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: (activity: BrewActivity) => void;
  userCity: string;
  userCountry: string;
}

const BrewLogModal: React.FC<BrewLogModalProps> = ({ isOpen, onClose, onShare, userCity, userCountry }) => {
  const { tempUnit, setTempUnit } = useSettings();
  const defaultLocation = `${userCity}, ${userCountry}`.toUpperCase();
  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA, location: defaultLocation });
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    if (isOpen) {
      setFormData(prev => ({ ...prev, location: defaultLocation }));
    } 
  }, [isOpen, defaultLocation]);

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
    const weight = parseFloat(formData.brewWeight);

    if (dose > 0 && water > 0) {
      const r = (water / dose).toFixed(1);
      const ey = (tdsVal > 0 && weight > 0) 
        ? (tdsVal * weight) / dose 
        : 0;
      
      setFormData(prev => ({ 
        ...prev, 
        ratio: `1:${r}`,
        eyPercentage: parseFloat(ey.toFixed(2))
      }));
    }
  }, [formData.gramsIn, formData.gramsOut, formData.tds, formData.brewWeight]);

  const handleInputChange = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value.toUpperCase() }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onShare) return;
    onShare({
      id: Math.random().toString(36).substr(2, 9),
      userId: 'me',
      userName: 'Brewer',
      userAvatar: '', 
      title: formData.title,
      description: formData.description,
      timestamp: new Date().toISOString(),
      locationName: formData.location || defaultLocation,
      roaster: formData.roaster || 'UNKNOWN',
      beanOrigin: formData.origin || 'UNKNOWN',
      estate: formData.showEstate ? formData.estate : undefined,
      varietal: formData.showVarietal ? formData.varietal : undefined,
      process: formData.showProcess ? formData.process : undefined,
      brewer: formData.brewer,
      ratio: formData.ratio,
      gramsIn: parseFloat(formData.gramsIn) || 0,
      gramsOut: parseFloat(formData.gramsOut) || 0,
      brewWeight: parseFloat(formData.brewWeight) || 0,
      temperature: parseFloat(formData.temp) || 0,
      tempUnit: tempUnit,
      brewTime: formData.brewTime,
      rating: formData.rating,
      comments: [],
      isPrivate: formData.isPrivate,
      tds: parseFloat(formData.tds) || 0,
      eyPercentage: formData.eyPercentage,
      showParameters: formData.showParameters,
      imageUrl: mediaPreview || undefined,
      likeCount: 0,
      likedBy: []
    });
    setFormData({ ...INITIAL_FORM_DATA, location: defaultLocation });
    setMediaPreview(null);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const ToggleBtn = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
      type="button" 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border-2 text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white border-white text-black' : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700'}`}
    >
      {label}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 w-full max-w-2xl h-full sm:h-auto sm:rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col sm:max-h-[90vh] animate-in zoom-in-95">
        
        <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/90 backdrop-blur-md sticky top-0 z-20">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase">Log Brew</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 sm:px-10 py-8 space-y-10 pb-32 custom-scrollbar">
          
          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-1">Session Title</p>
            <input 
              type="text" required value={formData.title} onChange={e => handleInputChange('title', e.target.value)}
              className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-white rounded-2xl outline-none text-2xl font-black text-white uppercase tracking-tighter px-6 py-5 placeholder:text-zinc-800 transition-all"
              placeholder="NAME THIS SESSION"
            />
          </section>

          <div className="flex justify-between items-center px-1">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visibility</p>
             <button type="button" onClick={() => setFormData(p => ({...p, isPrivate: !p.isPrivate}))} className={`px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.isPrivate ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-white text-black border-white'}`}>
                {formData.isPrivate ? <><EyeOff className="inline w-3 h-3 mr-2" /> Private</> : <><Eye className="inline w-3 h-3 mr-2" /> Global</>}
             </button>
          </div>

          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Roaster</label>
                <input type="text" value={formData.roaster} onChange={e => handleInputChange('roaster', e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" placeholder="SEY / ONYX / ETC" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Origin</label>
                <input type="text" value={formData.origin} onChange={e => handleInputChange('origin', e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-2xl px-5 py-4 text-white font-black text-sm outline-none focus:border-white uppercase" placeholder="ETHIOPIA / KENYA" />
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
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Estate</label>
                    <input type="text" value={formData.estate} onChange={e => handleInputChange('estate', e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase" />
                  </div>
                )}
                {formData.showVarietal && (
                  <div className="space-y-2 animate-in slide-in-from-top-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Varietal</label>
                    <input type="text" value={formData.varietal} onChange={e => handleInputChange('varietal', e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase" />
                  </div>
                )}
                {formData.showProcess && (
                  <div className="space-y-2 animate-in slide-in-from-top-1">
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Processing</label>
                    <input type="text" value={formData.process} onChange={e => handleInputChange('process', e.target.value)} className="w-full bg-black border-2 border-zinc-800 rounded-xl px-4 py-3 text-white font-black text-xs outline-none focus:border-white uppercase" />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-zinc-800 pb-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-2"><Settings2 className="w-4 h-4" /> Extraction</h3>
              <div onClick={() => setFormData(p => ({...p, showParameters: !p.showParameters}))} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.showParameters ? 'bg-white' : 'bg-zinc-800'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.showParameters ? 'left-6 bg-black' : 'left-1 bg-white'}`} />
              </div>
            </div>

            {formData.showParameters && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-black border-2 border-zinc-800 p-8 rounded-[2.5rem]">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">Dose (g)</p>
                    <input type="number" step="0.1" value={formData.gramsIn} onChange={e => setFormData({...formData, gramsIn: e.target.value})} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-sm outline-none focus:border-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">Water (g)</p>
                    <input type="number" step="1" value={formData.gramsOut} onChange={e => setFormData({...formData, gramsOut: e.target.value})} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-sm outline-none focus:border-white" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center">
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Temp</p>
                      <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 mb-2">
                        <button type="button" onClick={() => handleTempUnitToggle('C')} className={`px-2 py-0.5 rounded-md text-[7px] font-black transition-all ${tempUnit === 'C' ? 'bg-white text-black' : 'text-zinc-600 hover:text-zinc-400'}`}>°C</button>
                        <button type="button" onClick={() => handleTempUnitToggle('F')} className={`px-2 py-0.5 rounded-md text-[7px] font-black transition-all ${tempUnit === 'F' ? 'bg-white text-black' : 'text-zinc-600 hover:text-zinc-400'}`}>°F</button>
                      </div>
                    </div>
                    <input type="number" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} className="w-full bg-transparent border-b-2 border-zinc-800 py-2 text-white font-black text-center text-sm outline-none focus:border-white" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">Ratio</p>
                    <div className="w-full py-2 text-zinc-500 font-black text-center text-xs">{formData.ratio}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <ToggleBtn label="EY% Analytics" active={formData.showEY} onClick={() => setFormData(p => ({...p, showEY: !p.showEY}))} />
                </div>

                {formData.showEY && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 rounded-2xl space-y-2">
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-3 h-3" /> TDS</p>
                      <input type="number" step="0.01" value={formData.tds} onChange={e => setFormData({...formData, tds: e.target.value})} className="w-full bg-transparent border-b-2 border-zinc-800 py-1 text-white font-black text-xl outline-none focus:border-white" placeholder="1.40" />
                    </div>
                    <div className="bg-zinc-950 border-2 border-zinc-800 p-6 rounded-2xl space-y-2">
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Beaker className="w-3 h-3" /> Brew Weight (g)</p>
                      <input type="number" step="0.1" value={formData.brewWeight} onChange={e => setFormData({...formData, brewWeight: e.target.value})} className="w-full bg-transparent border-b-2 border-zinc-800 py-1 text-white font-black text-xl outline-none focus:border-white" />
                    </div>
                    <div className="col-span-full bg-white text-black p-4 rounded-xl flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Calculated EY%</p>
                      <p className="text-2xl font-black">{formData.eyPercentage}%</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
             <div className="flex justify-between items-center px-1"><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Overall Score</p><p className="text-2xl font-black">{formData.rating.toFixed(1)}</p></div>
             <input type="range" min="1" max="10" step="0.1" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} className="w-full accent-white h-2 bg-black rounded-lg appearance-none cursor-pointer" />
          </section>

          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Description & Tasting Notes</p>
            <textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="CUPS NOTES, TEXTURE, PHILOSOPHY..." className="w-full bg-black border-2 border-zinc-800 rounded-[2rem] p-6 text-sm text-white font-black focus:border-white outline-none min-h-[140px] resize-none uppercase" />
          </section>

          <section className="space-y-4">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Visual Documentation</p>
            <div 
              onClick={() => mediaInputRef.current?.click()}
              className="w-full aspect-video rounded-[2.5rem] border-2 border-dashed border-zinc-800 bg-black flex flex-col items-center justify-center cursor-pointer hover:border-white transition-all overflow-hidden relative group"
            >
              {mediaPreview ? (
                <>
                  <img src={mediaPreview} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-zinc-800 mb-2" />
                  <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">TAP TO ATTACH MEDIA</p>
                </>
              )}
            </div>
            <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*" />
          </section>

          <div className="sticky bottom-0 pt-10 pb-12 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent">
            <button type="submit" className="w-full bg-white text-black font-black text-sm uppercase tracking-[0.4em] py-7 rounded-[2.5rem] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">SHARE <ArrowRight className="w-5 h-5" /></button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BrewLogModal;
