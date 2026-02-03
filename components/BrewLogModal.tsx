import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Coffee, Award, Eye, EyeOff, Settings2, Calculator, Plus, Image as ImageIcon, MessageSquare, ArrowRight, RotateCcw, FlaskConical, Beaker, Loader2, ChevronRight } from 'lucide-react';
import { BrewActivity } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../hooks/useAuth';
import { createActivity, uploadBrewImage, updateActivity, getRoasters, getCafes, trackCafeFromVisit, trackRoasterSubmission } from '../lib/database';
import DeviceSelectorModal from './DeviceSelectorModal';

// Predefined drink options organized by category
const DRINK_CATEGORIES = {
  espresso: [
    'Espresso',
    'Americano',
    'Macchiato',
    'Cortado',
    'Flat White',
    'Cappuccino',
    'Latte',
    'Mocha',
    'Affogato'
  ],
  filter: [
    'Pourover',
    'Drip Coffee',
    'French Press',
    'Aeropress',
    'Chemex',
    'Siphon'
  ],
  iced: [
    'Iced Coffee',
    'Iced Latte',
    'Iced Americano',
    'Iced Cappuccino',
    'Iced Mocha',
    'Cold Brew',
    'Nitro Cold Brew'
  ],
  other: [
    'Turkish Coffee',
    'Matcha Latte',
    'Chai Latte',
    'Hot Chocolate'
  ]
};

// Drinks that typically contain milk
const MILK_BASED_DRINKS = [
  'Macchiato',
  'Cortado',
  'Flat White',
  'Cappuccino',
  'Latte',
  'Mocha',
  'Iced Latte',
  'Iced Cappuccino',
  'Iced Mocha',
  'Matcha Latte',
  'Chai Latte',
  'Hot Chocolate'
];

const MILK_TYPES = [
  'Whole',
  'Oat',
  'Almond',
  'Soy',
  'Coconut',
  'Skim',
  '2%'
];

const INITIAL_FORM_DATA = {
  // Mode selection
  isCafeVisit: false,

  // Cafe-specific fields
  cafeName: '',
  cafeCity: '',
  cafeCountry: '',
  cafeAddress: '',
  showAddress: false,
  drinkCategory: 'espresso' as 'espresso' | 'filter' | 'iced' | 'other' | 'specialty',
  drinkOrdered: '',
  drinksOrdered: [] as string[],
  specialtyDrink: '',
  showCoffeeDetails: false,
  showDescription: false,
  showWhen: false,

  // Existing fields
  title: '',
  description: '',
  roaster: '',
  origin: '',
  estate: '',
  lot: '',
  varietal: '',
  process: '',
  producer: '',
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
  showLot: false,
  showVarietal: false,
  showProcess: false,
  showProducer: false,
  showEY: false,
  showMilk: false,
  milkType: 'none' as 'none' | 'steamed' | 'cold',
  steamedDrink: 'latte' as 'macchiato' | 'cortado' | 'flatwhite' | 'cappuccino' | 'latte',
  drinkSize: 12,
  coldMilkOz: 2,
  podSize: 'medium' as 'small' | 'medium' | 'large',
  podName: '',
  location: '',
  brewedAt: ''
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
  const [roasterSuggestions, setRoasterSuggestions] = useState<string[]>([]);
  const [showRoasterDropdown, setShowRoasterDropdown] = useState(false);
  const [allRoasters, setAllRoasters] = useState<string[]>([]);
  const [cafeSuggestions, setCafeSuggestions] = useState<Array<{name: string, city: string, country: string}>>([]);
  const [showCafeDropdown, setShowCafeDropdown] = useState(false);
  const [allCafes, setAllCafes] = useState<Array<{name: string, city: string, country: string}>>([]);
  const [showDrinkDropdown, setShowDrinkDropdown] = useState(false);
  const [pendingDrink, setPendingDrink] = useState<string | null>(null);
  const [selectedMilk, setSelectedMilk] = useState<string>('');
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // New roaster prompt states
  const [showNewRoasterPrompt, setShowNewRoasterPrompt] = useState(false);
  const [newRoasterDetails, setNewRoasterDetails] = useState({
    name: '',
    city: '',
    country: '',
    state: '',
    website: ''
  });

  const isPodMachine = deviceCategory === 'pod';

  // Load roasters and cafes from database
  useEffect(() => {
    if (isOpen) {
      getRoasters().then(roasters => {
        const roasterNames = roasters.map(r => r.name);
        setAllRoasters(roasterNames);
      }).catch(err => {
        console.error('Error loading roasters:', err);
        setAllRoasters([]);
      });
      getCafes().then(cafes => {
        if (cafes && Array.isArray(cafes)) {
          const cafeList = cafes.map(c => ({ name: c.name, city: c.city, country: c.country }));
          setAllCafes(cafeList);
        } else {
          setAllCafes([]);
        }
      }).catch(err => {
        console.error('Error loading cafes:', err);
        setAllCafes([]);
      });
    }
  }, [isOpen]);

  // Update roaster suggestions when typing
  useEffect(() => {
    if (formData.roaster && formData.roaster.length > 0) {
      const filtered = allRoasters.filter(name =>
        name.toLowerCase().includes(formData.roaster.toLowerCase())
      ).slice(0, 5);
      setRoasterSuggestions(filtered);
      setShowRoasterDropdown(filtered.length > 0 && filtered[0].toLowerCase() !== formData.roaster.toLowerCase());
    } else {
      setRoasterSuggestions([]);
      setShowRoasterDropdown(false);
    }
  }, [formData.roaster, allRoasters]);

  // Update cafe suggestions when typing
  useEffect(() => {
    if (formData.cafeName && formData.cafeName.length > 0 && Array.isArray(allCafes)) {
      const filtered = allCafes.filter(cafe =>
        cafe?.name?.toLowerCase().includes(formData.cafeName.toLowerCase())
      ).slice(0, 5);
      setCafeSuggestions(filtered);
      setShowCafeDropdown(filtered.length > 0 && filtered[0]?.name?.toLowerCase() !== formData.cafeName.toLowerCase());
    } else {
      setCafeSuggestions([]);
      setShowCafeDropdown(false);
    }
  }, [formData.cafeName, allCafes]);

  // Close drink dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showDrinkDropdown && !target.closest('.drink-dropdown-container')) {
        setShowDrinkDropdown(false);
      }
    };

    if (showDrinkDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDrinkDropdown]);

  // Load saved draft or edit activity data on open
  useEffect(() => {
    if (isOpen && profile) {
      if (editActivity) {
        // Load activity data for editing
        const isCafe = editActivity.isCafeLog || false;
        const drinks = isCafe && editActivity.brewer ? editActivity.brewer.split(', ') : [];

        setFormData({
          // Cafe-specific fields
          isCafeVisit: isCafe,
          cafeName: editActivity.cafeName || '',
          cafeCity: editActivity.cafeCity || '',
          cafeCountry: editActivity.cafeCountry || '',
          cafeAddress: editActivity.cafeAddress || '',
          showAddress: !!editActivity.cafeAddress,
          drinkCategory: 'espresso' as 'espresso' | 'filter' | 'iced' | 'other' | 'specialty',
          drinkOrdered: '',
          drinksOrdered: drinks,
          specialtyDrink: '',
          showCoffeeDetails: !!(editActivity.roaster && editActivity.roaster !== 'CAFE'),
          showDescription: !!editActivity.description,
          showWhen: !!editActivity.timestamp,

          // Common fields
          title: editActivity.title || '',
          description: editActivity.description || '',
          roaster: editActivity.roaster || '',
          origin: editActivity.beanOrigin || '',
          estate: editActivity.estate || '',
          producer: (editActivity as any).producer || '',
          lot: editActivity.lot || '',
          varietal: editActivity.varietal || '',
          process: editActivity.process || '',
          brewType: (editActivity.brewType as 'espresso' | 'filter') || 'filter',
          brewer: isCafe ? '' : (editActivity.brewer || ''),
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
          showProducer: !!(editActivity as any).producer,
          showLot: !!editActivity.lot,
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
          location: editActivity.locationName || defaultLocation,
          brewedAt: editActivity.timestamp ? new Date(editActivity.timestamp).toISOString().slice(0, 16) : ''
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
      setPendingDrink(null);
      setSelectedMilk('');
      localStorage.removeItem('elixr_brew_log_draft');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // Validate cafe visit has at least one drink
    if (formData.isCafeVisit && formData.drinksOrdered.length === 0) {
      alert('Please add at least one drink');
      return;
    }

    setUploading(true);
    try {
      // Upload image if new file exists
      let imageUrl: string | undefined = editActivity?.imageUrl;
      if (mediaFile) {
        imageUrl = await uploadBrewImage(user.id, mediaFile) || undefined;
      }

      // Determine drink name for cafe visits
      const drinkName = formData.isCafeVisit
        ? (formData.drinksOrdered.length > 0 ? formData.drinksOrdered.join(', ') : 'DRINK')
        : undefined;

      const activityData = {
        title: formData.title || (formData.isCafeVisit ? formData.cafeName : 'BREW SESSION'),
        description: formData.description || undefined,
        image_url: imageUrl,
        location_name: formData.isCafeVisit
          ? `${formData.cafeCity}, ${formData.cafeCountry}`.toUpperCase()
          : (formData.location || defaultLocation),
        roaster: formData.isCafeVisit
          ? (formData.showCoffeeDetails && formData.roaster ? formData.roaster : 'CAFE')
          : (isPodMachine ? 'POD MACHINE' : (formData.roaster || 'UNKNOWN')),
        bean_origin: formData.isCafeVisit
          ? (formData.showCoffeeDetails && formData.origin ? formData.origin : 'UNKNOWN')
          : (isPodMachine ? 'N/A' : (formData.origin || 'UNKNOWN')),
        estate: !isPodMachine && formData.showEstate ? formData.estate : undefined,
        producer: !isPodMachine && formData.showProducer ? formData.producer : undefined,
        lot: !isPodMachine && formData.showLot ? formData.lot : undefined,
        varietal: !isPodMachine && formData.showVarietal ? formData.varietal : undefined,
        process: !isPodMachine && formData.showProcess ? formData.process : undefined,
        brew_type: formData.brewType,
        brewer: formData.isCafeVisit ? drinkName : formData.brewer,
        grinder: undefined,
        grind_setting: !formData.isCafeVisit ? (formData.grindSetting || undefined) : undefined,
        ratio: !formData.isCafeVisit ? formData.ratio : 'N/A',
        grams_in: !formData.isCafeVisit ? (parseFloat(formData.gramsIn) || 0) : 0,
        grams_out: !formData.isCafeVisit ? (parseFloat(formData.gramsOut) || 0) : 0,
        brew_weight: !formData.isCafeVisit ? (parseFloat(formData.brewWeight) || undefined) : undefined,
        temperature: !formData.isCafeVisit ? (parseFloat(formData.temp) || 0) : 0,
        temp_unit: tempUnit,
        brew_time: !formData.isCafeVisit ? formData.brewTime : 'N/A',
        rating: formData.rating,
        tds: !formData.isCafeVisit ? (parseFloat(formData.tds) || undefined) : undefined,
        ey_percentage: !formData.isCafeVisit ? (formData.eyPercentage || undefined) : undefined,
        show_parameters: !formData.isCafeVisit ? formData.showParameters : false,
        is_private: formData.isPrivate,
        is_cafe_log: formData.isCafeVisit,
        cafe_name: formData.isCafeVisit ? formData.cafeName : undefined,
        cafe_city: formData.isCafeVisit ? formData.cafeCity : undefined,
        cafe_country: formData.isCafeVisit ? formData.cafeCountry : undefined,
        cafe_address: formData.isCafeVisit && formData.cafeAddress ? formData.cafeAddress : undefined,
        drink_ordered: formData.isCafeVisit ? drinkName : undefined,
        milk_type: formData.showMilk ? formData.milkType : undefined,
        steamed_drink: formData.showMilk && formData.milkType === 'steamed' ? formData.steamedDrink : undefined,
        drink_size: formData.showMilk && formData.milkType === 'steamed' ? formData.drinkSize : undefined,
        cold_milk_oz: formData.showMilk && formData.milkType === 'cold' ? formData.coldMilkOz : undefined,
        pod_size: isPodMachine && !formData.isCafeVisit ? formData.podSize : undefined,
        pod_name: isPodMachine && !formData.isCafeVisit ? formData.podName : undefined,
        created_at: formData.brewedAt ? new Date(formData.brewedAt).toISOString() : undefined
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

        // Track cafe submission if this is a cafe visit
        if (activity && formData.isCafeVisit) {
          await trackCafeFromVisit(
            formData.cafeName,
            formData.cafeCity,
            formData.cafeCountry,
            profile.id,
            formData.cafeAddress || undefined
          );
        }
      }

      if (activity) {
        // Show success message with info about auto-submissions
        const hasRoaster = formData.roaster && formData.roaster !== 'CAFE' && formData.roaster !== 'POD MACHINE' && formData.roaster !== 'UNKNOWN';
        const hasCoffeeDetails = formData.origin && formData.origin !== 'UNKNOWN' && formData.origin !== 'N/A';

        if (hasRoaster || hasCoffeeDetails) {
          let message = 'Brew log posted! ';
          if (hasRoaster) {
            message += '\n✓ Roaster tracked';
          }
          if (hasCoffeeDetails) {
            message += '\n✓ Coffee automatically submitted for database review';
          }
          alert(message);
        }

        // Reset form and clear draft
        setFormData({ ...INITIAL_FORM_DATA, location: defaultLocation });
        setMediaFile(null);
        setMediaPreview(null);
        setDeviceCategory('');
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
      className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-black border-black' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
    >
      {label}
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 pointer-events-none">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      <div className="relative bg-zinc-50 w-full max-w-2xl h-full sm:h-auto sm:rounded-xl shadow-2xl border-4 border-black overflow-hidden flex flex-col sm:max-h-[90vh] animate-in zoom-in-95 pointer-events-auto">

        <div className="px-8 py-6 border-b-2 border-black bg-white sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-black uppercase tracking-wider">{editActivity ? 'Edit Brew' : 'Log Brew'}</h2>
            <button onClick={onClose} className="text-black hover:text-black transition-all" disabled={uploading}><X className="w-6 h-6" /></button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={handleClearForm}
              disabled={uploading}
              className="text-[10px] font-black text-black hover:text-black uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setFormData(p => ({...p, isPrivate: !p.isPrivate}))}
              disabled={uploading}
              className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.isPrivate ? 'bg-white border-black text-black' : 'bg-white text-black border-black'}`}
            >
              {formData.isPrivate ? <><EyeOff className="inline w-3 h-3 mr-1" /> Private</> : <><Eye className="inline w-3 h-3 mr-1" /> Global</>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar bg-zinc-50">

          {/* Home Brew / Cafe Visit Toggle */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Log Type</p>
            {editActivity ? (
              // Show single locked tab when editing
              <div className="px-4 py-4 rounded-xl border-2 border-black bg-white text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-black">
                  {formData.isCafeVisit ? 'Cafe Visit' : 'Home Brew'}
                </span>
              </div>
            ) : (
              // Show toggle buttons when creating new
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(p => ({ ...p, isCafeVisit: false, drinksOrdered: [] }));
                    setPendingDrink(null);
                    setSelectedMilk('');
                  }}
                  disabled={uploading}
                  className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${!formData.isCafeVisit ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                >
                  Home Brew
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(p => ({ ...p, isCafeVisit: true, drinksOrdered: [] }));
                    setPendingDrink(null);
                    setSelectedMilk('');
                  }}
                  disabled={uploading}
                  className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.isCafeVisit ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                >
                  Cafe Visit
                </button>
              </div>
            )}
          </section>

          {/* Title - Only for Home Brews */}
          {!formData.isCafeVisit && (
            <section className="space-y-3">
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Session Title</p>
              <input
                type="text" required value={formData.title} onChange={e => handleInputChange('title', e.target.value)}
                disabled={uploading}
                className="w-full bg-white border-2 border-black focus:border-white rounded-xl outline-none text-sm font-black text-black uppercase px-6 py-4 placeholder:text-black transition-all disabled:opacity-50"
                placeholder="NAME THIS SESSION"
              />
            </section>
          )}

          {/* Cafe Visit Fields */}
          {formData.isCafeVisit && (
            <>
              <section className="space-y-3 relative">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Cafe Name</p>
                <input
                  type="text"
                  required
                  value={formData.cafeName}
                  onChange={e => setFormData(p => ({ ...p, cafeName: e.target.value.toUpperCase() }))}
                  onFocus={() => {
                    if (formData.cafeName && cafeSuggestions.length > 0) {
                      setShowCafeDropdown(true);
                    }
                  }}
                  disabled={uploading}
                  className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                  placeholder="BLUE BOTTLE / VERVE / ETC"
                />
                {showCafeDropdown && Array.isArray(cafeSuggestions) && cafeSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-xl overflow-hidden shadow-xl">
                    {cafeSuggestions.map((cafe, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData(p => ({ ...p, cafeName: cafe?.name || '', cafeCity: cafe?.city || '', cafeCountry: cafe?.country || '' }));
                          setShowCafeDropdown(false);
                        }}
                        className="w-full text-left px-6 py-4 text-black font-black text-sm uppercase hover:bg-zinc-50 transition-colors border-b border-black last:border-b-0"
                      >
                        <div>{cafe?.name || 'UNKNOWN'}</div>
                        <div className="text-xs text-black">{cafe?.city || 'UNKNOWN'}, {cafe?.country || 'UNKNOWN'}</div>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Location</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={formData.cafeCity}
                    onChange={e => setFormData(p => ({ ...p, cafeCity: e.target.value.toUpperCase() }))}
                    disabled={uploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                    placeholder="CITY"
                  />
                  <input
                    type="text"
                    required
                    value={formData.cafeCountry}
                    onChange={e => setFormData(p => ({ ...p, cafeCountry: e.target.value.toUpperCase() }))}
                    disabled={uploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                    placeholder="COUNTRY"
                  />
                </div>

                {/* Address Toggle */}
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, showAddress: !p.showAddress }))}
                  disabled={uploading}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.showAddress ? 'bg-white text-black border-black' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
                >
                  {formData.showAddress ? '✓ ' : ''}Add Address (Optional)
                </button>

                {formData.showAddress && (
                  <input
                    type="text"
                    value={formData.cafeAddress}
                    onChange={e => setFormData(p => ({ ...p, cafeAddress: e.target.value.toUpperCase() }))}
                    disabled={uploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50 animate-in slide-in-from-top-1"
                    placeholder="STREET ADDRESS"
                  />
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Drinks Ordered</p>
                  {formData.drinksOrdered.length > 0 && (
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">
                      {formData.drinksOrdered.length} {formData.drinksOrdered.length === 1 ? 'drink' : 'drinks'}
                    </span>
                  )}
                </div>

                {/* Selected Drinks */}
                {formData.drinksOrdered.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.drinksOrdered.map((drink, idx) => (
                      <div
                        key={idx}
                        className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-2"
                      >
                        {drink}
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({
                            ...p,
                            drinksOrdered: p.drinksOrdered.filter((_, i) => i !== idx)
                          }))}
                          disabled={uploading}
                          className="hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['espresso', 'filter', 'iced', 'other'] as const).map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setFormData(p => ({ ...p, drinkCategory: category, drinkOrdered: '' }));
                        setShowDrinkDropdown(false);
                        setPendingDrink(null);
                        setSelectedMilk('');
                      }}
                      disabled={uploading}
                      className={`px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.drinkCategory === category ? 'bg-white text-black border-black' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {formData.drinkCategory !== 'specialty' && DRINK_CATEGORIES[formData.drinkCategory] ? (
                  <div className="relative drink-dropdown-container">
                    <button
                      type="button"
                      onClick={() => setShowDrinkDropdown(!showDrinkDropdown)}
                      disabled={uploading}
                      className="w-full bg-white border-2 border-black hover:border-black rounded-xl px-6 py-4 text-left flex items-center justify-between transition-all disabled:opacity-50"
                    >
                      <span className="text-black font-black text-sm uppercase">ADD DRINK</span>
                      <ChevronRight className={`w-5 h-5 text-black transition-transform ${showDrinkDropdown ? 'rotate-90' : ''}`} />
                    </button>

                    {showDrinkDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white border-2 border-black rounded-xl overflow-hidden shadow-xl max-h-64 overflow-y-auto animate-in slide-in-from-top-1 custom-scrollbar">
                        {DRINK_CATEGORIES[formData.drinkCategory]?.map(drink => (
                          <button
                            key={drink}
                            type="button"
                            onClick={() => {
                              // Check if drink is milk-based
                              if (MILK_BASED_DRINKS.includes(drink)) {
                                setPendingDrink(drink);
                                setSelectedMilk('');
                                setShowDrinkDropdown(false);
                              } else {
                                // Add drink directly if not milk-based
                                if (!formData.drinksOrdered.includes(drink)) {
                                  setFormData(p => ({
                                    ...p,
                                    drinksOrdered: [...p.drinksOrdered, drink],
                                    drinkOrdered: ''
                                  }));
                                }
                                setShowDrinkDropdown(false);
                              }
                            }}
                            disabled={formData.drinksOrdered.some(d => d.startsWith(drink))}
                            className="w-full text-left px-6 py-4 text-black font-black text-sm uppercase hover:bg-zinc-50 transition-colors border-b border-black last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {drink} {formData.drinksOrdered.some(d => d.startsWith(drink)) && '✓'}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(p => ({ ...p, drinkOrdered: 'SPECIALTY' }));
                            setShowDrinkDropdown(false);
                          }}
                          className="w-full text-left px-6 py-4 text-black font-black text-sm uppercase hover:bg-zinc-50 hover:text-black transition-colors"
                        >
                          SPECIALTY / OTHER
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Milk Selector - Shows when a milk-based drink is selected */}
                {pendingDrink && MILK_BASED_DRINKS.includes(pendingDrink) && (
                  <div className="space-y-3 p-4 bg-white border-2 border-black rounded-xl animate-in slide-in-from-top-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">
                        {pendingDrink} - Milk Type
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDrink(null);
                          setSelectedMilk('');
                        }}
                        className="text-black hover:text-black transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {MILK_TYPES.map(milk => (
                        <button
                          key={milk}
                          type="button"
                          onClick={() => setSelectedMilk(milk)}
                          disabled={uploading}
                          className={`px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${selectedMilk === milk ? 'bg-white text-black border-black' : 'bg-zinc-50 border-black text-black hover:border-black'}`}
                        >
                          {milk}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          // Add without milk specification
                          if (!formData.drinksOrdered.some(d => d.startsWith(pendingDrink))) {
                            setFormData(p => ({
                              ...p,
                              drinksOrdered: [...p.drinksOrdered, pendingDrink]
                            }));
                          }
                          setPendingDrink(null);
                          setSelectedMilk('');
                        }}
                        disabled={uploading}
                        className="flex-1 px-4 py-3 bg-zinc-50 border-2 border-black text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-black hover:text-black transition-all disabled:opacity-50"
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Add with milk specification
                          const drinkWithMilk = selectedMilk
                            ? `${pendingDrink} (${selectedMilk} Milk)`
                            : pendingDrink;

                          if (!formData.drinksOrdered.includes(drinkWithMilk)) {
                            setFormData(p => ({
                              ...p,
                              drinksOrdered: [...p.drinksOrdered, drinkWithMilk]
                            }));
                          }
                          setPendingDrink(null);
                          setSelectedMilk('');
                        }}
                        disabled={uploading || !selectedMilk}
                        className="flex-1 px-4 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {(formData.drinkCategory === 'specialty' || formData.drinkOrdered === 'SPECIALTY') && (
                  <div className="flex gap-2 animate-in slide-in-from-top-1">
                    <input
                      type="text"
                      value={formData.specialtyDrink}
                      onChange={e => setFormData(p => ({ ...p, specialtyDrink: e.target.value.toUpperCase() }))}
                      disabled={uploading}
                      className="flex-1 bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                      placeholder="ENTER SPECIALTY DRINK"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.specialtyDrink.trim() && !formData.drinksOrdered.includes(formData.specialtyDrink.trim())) {
                          setFormData(p => ({
                            ...p,
                            drinksOrdered: [...p.drinksOrdered, p.specialtyDrink.trim()],
                            specialtyDrink: '',
                            drinkOrdered: ''
                          }));
                        }
                      }}
                      disabled={uploading || !formData.specialtyDrink.trim()}
                      className="px-6 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, showCoffeeDetails: !p.showCoffeeDetails }))}
                  disabled={uploading}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.showCoffeeDetails ? 'bg-white text-black border-black' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
                >
                  {formData.showCoffeeDetails ? '✓ ' : ''}Include Coffee Details (Optional)
                </button>
              </section>
            </>
          )}

          {/* Brewing Device - Hidden for Cafe Visits */}
          {!formData.isCafeVisit && (
            <section className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Brewing Device</p>
                <div className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest ${formData.brewType === 'espresso' ? 'bg-white text-black border-black' : 'bg-zinc-50 text-black border-black'}`}>
                  {formData.brewType === 'espresso' ? 'ESPRESSO' : 'FILTER'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeviceSelector(true)}
                disabled={uploading}
                className="w-full bg-white border-2 border-black hover:border-black rounded-xl px-6 py-4 text-left flex items-center justify-between transition-all disabled:opacity-50"
              >
                <div>
                  {formData.brewer ? (
                    <p className="text-black font-black text-sm uppercase">{formData.brewer}</p>
                  ) : (
                    <p className="text-black font-black text-sm uppercase">Select Device</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-black" />
              </button>
            </section>
          )}

          {/* Bean Information - Hidden for Pod Machines and shown conditionally for Cafe Visits */}
          {!isPodMachine && !formData.isCafeVisit && (
            <section className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 relative">
                  <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Roaster</label>
                  <input
                    type="text"
                    value={formData.roaster}
                    onChange={e => handleInputChange('roaster', e.target.value)}
                    onFocus={() => {
                      if (formData.roaster && roasterSuggestions.length > 0) {
                        setShowRoasterDropdown(true);
                      }
                    }}
                    disabled={uploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                    placeholder="SEY / ONYX / ETC"
                  />
                  {showRoasterDropdown && roasterSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-xl overflow-hidden shadow-xl">
                      {roasterSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(p => ({ ...p, roaster: suggestion }));
                            setShowRoasterDropdown(false);
                          }}
                          className="w-full text-left px-6 py-4 text-black font-black text-sm uppercase hover:bg-zinc-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Show "New Roaster" prompt if typed roaster doesn't exist */}
                  {formData.roaster && formData.roaster.length > 2 && !allRoasters.some(r => r.toLowerCase() === formData.roaster.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewRoasterDetails({ name: formData.roaster, city: '', country: '', state: '', website: '' });
                        setShowNewRoasterPrompt(true);
                      }}
                      className="mt-2 w-full bg-zinc-50 border-2 border-black rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:border-black hover:text-black transition-all flex items-center justify-between"
                    >
                      <span>⭐ Add "{formData.roaster}" to database</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Origin</label>
                  <input type="text" value={formData.origin} onChange={e => handleInputChange('origin', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="ETHIOPIA / KENYA" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <ToggleBtn label="Farm / Estate" active={formData.showEstate} onClick={() => setFormData(p => ({...p, showEstate: !p.showEstate}))} />
                  <ToggleBtn label="Producer" active={formData.showProducer} onClick={() => setFormData(p => ({...p, showProducer: !p.showProducer}))} />
                  <ToggleBtn label="Lot / Name" active={formData.showLot} onClick={() => setFormData(p => ({...p, showLot: !p.showLot}))} />
                  <ToggleBtn label="Varietal" active={formData.showVarietal} onClick={() => setFormData(p => ({...p, showVarietal: !p.showVarietal}))} />
                  <ToggleBtn label="Processing" active={formData.showProcess} onClick={() => setFormData(p => ({...p, showProcess: !p.showProcess}))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {formData.showEstate && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Estate</label>
                      <input type="text" value={formData.estate} onChange={e => handleInputChange('estate', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="FARM NAME" />
                    </div>
                  )}
                  {formData.showProducer && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Producer</label>
                      <input type="text" value={formData.producer} onChange={e => handleInputChange('producer', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="PRODUCER NAME" />
                    </div>
                  )}
                  {formData.showLot && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Lot / Name</label>
                      <input type="text" value={formData.lot} onChange={e => handleInputChange('lot', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="LOT NUMBER" />
                    </div>
                  )}
                  {formData.showVarietal && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Varietal</label>
                      <input type="text" value={formData.varietal} onChange={e => handleInputChange('varietal', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="SL28, GESHA, ETC" />
                    </div>
                  )}
                  {formData.showProcess && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Processing</label>
                      <input type="text" value={formData.process} onChange={e => handleInputChange('process', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="WASHED, NATURAL, ETC" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Coffee Details for Cafe Visits (when toggled on) */}
          {formData.isCafeVisit && formData.showCoffeeDetails && (
            <section className="space-y-6 animate-in slide-in-from-top-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 relative">
                  <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Roaster</label>
                  <input
                    type="text"
                    value={formData.roaster}
                    onChange={e => handleInputChange('roaster', e.target.value)}
                    onFocus={() => {
                      if (formData.roaster && roasterSuggestions.length > 0) {
                        setShowRoasterDropdown(true);
                      }
                    }}
                    disabled={uploading}
                    className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50"
                    placeholder="SEY / ONYX / ETC"
                  />
                  {showRoasterDropdown && roasterSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border-2 border-black rounded-xl overflow-hidden shadow-xl">
                      {roasterSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setFormData(p => ({ ...p, roaster: suggestion }));
                            setShowRoasterDropdown(false);
                          }}
                          className="w-full text-left px-6 py-4 text-black font-black text-sm uppercase hover:bg-zinc-50 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Show "New Roaster" prompt if typed roaster doesn't exist */}
                  {formData.roaster && formData.roaster.length > 2 && !allRoasters.some(r => r.toLowerCase() === formData.roaster.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewRoasterDetails({ name: formData.roaster, city: '', country: '', state: '', website: '' });
                        setShowNewRoasterPrompt(true);
                      }}
                      className="mt-2 w-full bg-zinc-50 border-2 border-black rounded-lg px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-black hover:border-black hover:text-black transition-all flex items-center justify-between"
                    >
                      <span>⭐ Add "{formData.roaster}" to database</span>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Origin</label>
                  <input type="text" value={formData.origin} onChange={e => handleInputChange('origin', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="ETHIOPIA / KENYA" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <ToggleBtn label="Farm / Estate" active={formData.showEstate} onClick={() => setFormData(p => ({...p, showEstate: !p.showEstate}))} />
                  <ToggleBtn label="Producer" active={formData.showProducer} onClick={() => setFormData(p => ({...p, showProducer: !p.showProducer}))} />
                  <ToggleBtn label="Lot / Name" active={formData.showLot} onClick={() => setFormData(p => ({...p, showLot: !p.showLot}))} />
                  <ToggleBtn label="Varietal" active={formData.showVarietal} onClick={() => setFormData(p => ({...p, showVarietal: !p.showVarietal}))} />
                  <ToggleBtn label="Processing" active={formData.showProcess} onClick={() => setFormData(p => ({...p, showProcess: !p.showProcess}))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {formData.showEstate && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Estate</label>
                      <input type="text" value={formData.estate} onChange={e => handleInputChange('estate', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="FARM NAME" />
                    </div>
                  )}
                  {formData.showProducer && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Producer</label>
                      <input type="text" value={formData.producer} onChange={e => handleInputChange('producer', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="PRODUCER NAME" />
                    </div>
                  )}
                  {formData.showLot && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Lot / Name</label>
                      <input type="text" value={formData.lot} onChange={e => handleInputChange('lot', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="LOT NUMBER" />
                    </div>
                  )}
                  {formData.showVarietal && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Varietal</label>
                      <input type="text" value={formData.varietal} onChange={e => handleInputChange('varietal', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="SL28, GESHA, ETC" />
                    </div>
                  )}
                  {formData.showProcess && (
                    <div className="space-y-3 animate-in slide-in-from-top-1">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Processing</label>
                      <input type="text" value={formData.process} onChange={e => handleInputChange('process', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="WASHED, NATURAL, ETC" />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Brew Parameters - Hidden for Cafe Visits */}
          {!formData.isCafeVisit && (
            <section className="space-y-6">
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Settings2 className="w-4 h-4" /> Brew Parameters</h3>
                <div onClick={() => setFormData(p => ({...p, showParameters: !p.showParameters}))} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.showParameters ? 'bg-white' : 'bg-zinc-50'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.showParameters ? 'left-6 bg-white' : 'left-1 bg-white'}`} />
                </div>
              </div>

              {formData.showParameters && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-white border-2 border-black p-6 rounded-xl">
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3">DOSE (G)</p>
                      <input type="number" step="0.1" value={formData.gramsIn} onChange={e => setFormData({...formData, gramsIn: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-black py-2 text-black font-black text-center text-sm outline-none focus:border-white disabled:opacity-50" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3">WATER (G)</p>
                      <input type="number" step="1" value={formData.gramsOut} onChange={e => setFormData({...formData, gramsOut: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-black py-2 text-black font-black text-center text-sm outline-none focus:border-white disabled:opacity-50" />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">TEMP</p>
                        <div className="flex bg-zinc-50 rounded p-0.5 border-2 border-black">
                          <button type="button" onClick={() => handleTempUnitToggle('C')} disabled={uploading} className={`px-2 py-1 rounded text-[10px] font-black transition-all disabled:opacity-50 ${tempUnit === 'C' ? 'bg-white text-black' : 'text-black'}`}>°C</button>
                          <button type="button" onClick={() => handleTempUnitToggle('F')} disabled={uploading} className={`px-2 py-1 rounded text-[10px] font-black transition-all disabled:opacity-50 ${tempUnit === 'F' ? 'bg-white text-black' : 'text-black'}`}>°F</button>
                        </div>
                      </div>
                      <input type="number" value={formData.temp} onChange={e => setFormData({...formData, temp: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-black py-2 text-black font-black text-center text-sm outline-none focus:border-white disabled:opacity-50" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3">RATIO</p>
                      <div className="w-full py-2 text-black font-black text-center text-sm border-b-2 border-transparent">{formData.ratio}</div>
                    </div>
                    <div className="flex flex-col items-center col-span-2 sm:col-span-4">
                      <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3">TBT (MM:SS)</p>
                      <input
                        type="text"
                        value={formData.brewTime}
                        onChange={e => setFormData({...formData, brewTime: e.target.value})}
                        disabled={uploading}
                        placeholder="02:30"
                        className="w-full sm:w-32 bg-transparent border-b-2 border-black py-2 text-black font-black text-center text-sm outline-none focus:border-white disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <ToggleBtn label="EY% Analytics" active={formData.showEY} onClick={() => setFormData(p => ({...p, showEY: !p.showEY}))} />
                  </div>

                  {formData.showEY && (
                    <div className="space-y-4 animate-in slide-in-from-top-1">
                      <div className="bg-white border-2 border-black p-6 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><FlaskConical className="w-3 h-3" /> TDS</p>
                        <input type="number" step="0.01" value={formData.tds} onChange={e => setFormData({...formData, tds: e.target.value})} disabled={uploading} className="w-full bg-transparent border-b-2 border-black py-2 text-black font-black text-sm outline-none focus:border-white disabled:opacity-50" placeholder="1.40" />
                      </div>
                      <div className="bg-white text-black p-6 rounded-xl flex justify-between items-center border-2 border-white">
                        <p className="text-[10px] font-black uppercase tracking-widest">Calculated EY%</p>
                        <p className="text-xl font-black">{formData.eyPercentage}%</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pod Machine Section */}
              {isPodMachine && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Pod Name</label>
                      <input type="text" value={formData.podName} onChange={e => handleInputChange('podName', e.target.value)} disabled={uploading} className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-black font-black text-sm outline-none focus:border-white uppercase disabled:opacity-50" placeholder="STARBUCKS PIKE PLACE" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Cup Size</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['small', 'medium', 'large'] as const).map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, podSize: size }))}
                            disabled={uploading}
                            className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.podSize === size ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
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
          )}

          {/* Milk Section */}
          <section className="space-y-6">
            <div className="flex justify-between items-center border-b-2 border-black pb-2">
              <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2"><Coffee className="w-4 h-4" /> Milk</h3>
              <div onClick={() => setFormData(p => ({...p, showMilk: !p.showMilk}))} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${formData.showMilk ? 'bg-white' : 'bg-zinc-50'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${formData.showMilk ? 'left-6 bg-white' : 'left-1 bg-white'}`} />
              </div>
            </div>

            {formData.showMilk && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Milk Type Selection */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest">Milk Type</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'none' }))}
                      disabled={uploading}
                      className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.milkType === 'none' ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'steamed' }))}
                      disabled={uploading}
                      className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.milkType === 'steamed' ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                    >
                      Steamed
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, milkType: 'cold' }))}
                      disabled={uploading}
                      className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.milkType === 'cold' ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                    >
                      Cold
                    </button>
                  </div>
                </div>

                {/* Steamed Milk Options */}
                {formData.milkType === 'steamed' && (
                  <div className="space-y-6 animate-in slide-in-from-top-1">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Drink Style</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(['macchiato', 'cortado', 'flatwhite', 'cappuccino', 'latte'] as const).map(drink => (
                          <button
                            key={drink}
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, steamedDrink: drink }))}
                            disabled={uploading}
                            className={`px-4 py-4 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.steamedDrink === drink ? 'bg-white text-black border-black' : 'bg-white text-black border-black hover:border-black'}`}
                          >
                            {drink === 'flatwhite' ? 'Flat White' : drink}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-black uppercase tracking-widest">Drink Size</p>
                        <p className="text-sm font-black text-black">{formData.drinkSize} OZ</p>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="20"
                        step="1"
                        value={formData.drinkSize}
                        onChange={e => setFormData({...formData, drinkSize: parseInt(e.target.value)})}
                        disabled={uploading}
                        className="w-full slider h-2 bg-zinc-50 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                      />
                      <div className="flex justify-between text-[10px] font-black text-black uppercase tracking-widest">
                        <span>4 oz</span>
                        <span>20 oz</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cold Milk Options */}
                {formData.milkType === 'cold' && (
                  <div className="space-y-3 animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Cold Milk Amount</p>
                      <p className="text-sm font-black text-black">{formData.coldMilkOz} OZ</p>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={formData.coldMilkOz}
                      onChange={e => setFormData({...formData, coldMilkOz: parseFloat(e.target.value)})}
                      disabled={uploading}
                      className="w-full slider h-2 bg-zinc-50 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[10px] font-black text-black uppercase tracking-widest">
                      <span>0.5 oz</span>
                      <span>8 oz</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Overall Score (0-10)</p>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 10) {
                  setFormData({...formData, rating: val});
                }
              }}
              disabled={uploading}
              placeholder="8.0"
              className="w-full bg-white border-2 border-black rounded-xl px-6 py-4 text-center text-3xl font-black text-black outline-none focus:border-black transition-all disabled:opacity-50"
            />
          </section>

          {/* Optional Sections - Toggles */}
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, showDescription: !p.showDescription }))}
              disabled={uploading}
              className={`flex-1 sm:flex-none px-6 py-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.showDescription ? 'bg-white text-black border-black shadow-lg' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
            >
              <MessageSquare className="inline w-4 h-4 mr-2" />
              {formData.showDescription ? '✓ ' : ''}Notes
            </button>
            <button
              type="button"
              onClick={() => !uploading && mediaInputRef.current?.click()}
              disabled={uploading}
              className={`flex-1 sm:flex-none px-6 py-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mediaPreview ? 'bg-white text-black border-black shadow-lg' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
            >
              <ImageIcon className="inline w-4 h-4 mr-2" />
              {mediaPreview ? '✓ ' : ''}Photo
            </button>
            <button
              type="button"
              onClick={() => setFormData(p => ({ ...p, showWhen: !p.showWhen }))}
              disabled={uploading}
              className={`flex-1 sm:flex-none px-6 py-4 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 ${formData.showWhen ? 'bg-white text-black border-black shadow-lg' : 'bg-zinc-100 border-black text-black hover:border-black hover:bg-zinc-200'}`}
            >
              <ArrowRight className="inline w-4 h-4 mr-2" />
              {formData.showWhen ? '✓ ' : ''}When
            </button>
          </div>

          {/* Description */}
          {formData.showDescription && (
            <section className="space-y-3 animate-in slide-in-from-top-1">
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Notes & Thoughts</p>
              <textarea value={formData.description} onChange={e => handleInputChange('description', e.target.value)} disabled={uploading} placeholder="CUPS NOTES, TEXTURE, PHILOSOPHY..." className="w-full bg-white border-2 border-black rounded-xl p-6 text-sm text-black font-black focus:border-white outline-none min-h-[140px] resize-none uppercase disabled:opacity-50" />
            </section>
          )}

          {/* Photo Preview */}
          {mediaPreview && (
            <section className="space-y-3 animate-in slide-in-from-top-1">
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Photo</p>
              <div
                onClick={() => !uploading && mediaInputRef.current?.click()}
                className="w-full aspect-video rounded-xl border-2 border-black bg-white overflow-hidden relative group cursor-pointer hover:border-black transition-all"
              >
                <img src={mediaPreview} className="w-full h-full object-cover transition-all" alt="Preview" />
                {!uploading && (
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Plus className="w-10 h-10 text-black" />
                  </div>
                )}
              </div>
            </section>
          )}
          <input type="file" ref={mediaInputRef} onChange={handleMediaUpload} className="hidden" accept="image/*" disabled={uploading} />

          {/* When/Datetime */}
          {formData.showWhen && (
            <section className="space-y-3 animate-in slide-in-from-top-1">
              <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">When</p>
              <input
                type="datetime-local"
                value={formData.brewedAt}
                max={new Date().toISOString().slice(0, 16)}
                onChange={e => setFormData(p => ({ ...p, brewedAt: e.target.value }))}
                disabled={uploading}
                className="w-full bg-white border-2 border-black focus:border-white rounded-xl outline-none text-sm font-black text-black px-6 py-4 transition-all disabled:opacity-50"
              />
            </section>
          )}

          <section className="pt-4 pb-4">
            <button type="submit" disabled={uploading} className="w-full bg-white text-black font-black text-sm uppercase tracking-widest py-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:bg-zinc-400 disabled:text-black">
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

      {/* New Roaster Details Modal */}
      {showNewRoasterPrompt && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-3xl p-8 max-w-md w-full">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-black">Add Roaster Details</h3>
                <p className="text-sm font-bold text-black mt-2 uppercase tracking-wide">
                  Help build our database by adding details for "{newRoasterDetails.name}"
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Roaster Name</label>
                  <input
                    type="text"
                    value={newRoasterDetails.name}
                    disabled
                    className="mt-2 w-full bg-zinc-50 border-2 border-black rounded-xl px-4 py-3 text-black font-black text-sm uppercase opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">City *</label>
                    <input
                      type="text"
                      value={newRoasterDetails.city}
                      onChange={e => setNewRoasterDetails(p => ({ ...p, city: e.target.value }))}
                      className="mt-2 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black font-black text-sm uppercase focus:border-white outline-none"
                      placeholder="NEW YORK"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-black uppercase tracking-widest">Country *</label>
                    <input
                      type="text"
                      value={newRoasterDetails.country}
                      onChange={e => setNewRoasterDetails(p => ({ ...p, country: e.target.value }))}
                      className="mt-2 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black font-black text-sm uppercase focus:border-white outline-none"
                      placeholder="USA"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">State / Province (Optional)</label>
                  <input
                    type="text"
                    value={newRoasterDetails.state}
                    onChange={e => setNewRoasterDetails(p => ({ ...p, state: e.target.value }))}
                    className="mt-2 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black font-black text-sm uppercase focus:border-white outline-none"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-black uppercase tracking-widest">Website (Optional)</label>
                  <input
                    type="url"
                    value={newRoasterDetails.website}
                    onChange={e => setNewRoasterDetails(p => ({ ...p, website: e.target.value }))}
                    className="mt-2 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-black font-black text-sm lowercase focus:border-white outline-none"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewRoasterPrompt(false)}
                  className="flex-1 bg-zinc-50 border-2 border-black rounded-xl px-6 py-4 text-sm font-black uppercase tracking-wider text-black hover:border-black transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newRoasterDetails.city || !newRoasterDetails.country) {
                      alert('Please fill in city and country');
                      return;
                    }
                    if (!profile) return;

                    await trackRoasterSubmission(
                      newRoasterDetails.name,
                      profile.id,
                      newRoasterDetails.city,
                      newRoasterDetails.country,
                      newRoasterDetails.state || undefined,
                      newRoasterDetails.website || undefined
                    );

                    alert('Roaster submitted for approval! Admins will review it soon.');
                    setShowNewRoasterPrompt(false);
                  }}
                  disabled={!newRoasterDetails.city || !newRoasterDetails.country}
                  className="flex-1 bg-white text-black border-2 border-white rounded-xl px-6 py-4 text-sm font-black uppercase tracking-wider hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrewLogModal;
