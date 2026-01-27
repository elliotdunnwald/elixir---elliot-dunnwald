import React, { useState, useEffect } from 'react';
import { Check, X, Users, TrendingUp, Loader2, Plus } from 'lucide-react';
import { getPendingRoasters, approveRoaster, rejectRoaster, addApprovedRoasterToDatabase, type PendingRoaster } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const AdminRoasters: React.FC = () => {
  const { profile } = useAuth();
  const [pendingRoasters, setPendingRoasters] = useState<PendingRoaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoaster, setSelectedRoaster] = useState<PendingRoaster | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadPendingRoasters();
  }, []);

  async function loadPendingRoasters() {
    setLoading(true);
    const data = await getPendingRoasters();
    setPendingRoasters(data);
    setLoading(false);
  }

  async function handleApprove(roaster: PendingRoaster) {
    setSelectedRoaster(roaster);
    setShowAddModal(true);
  }

  async function handleReject(roasterId: string) {
    if (confirm('Reject this roaster submission?')) {
      const success = await rejectRoaster(roasterId);
      if (success) {
        setPendingRoasters(prev => prev.filter(r => r.id !== roasterId));
      }
    }
  }

  async function handleAddRoaster(formData: {
    city: string;
    country: string;
    state?: string;
    website?: string;
    foundedYear?: number;
  }) {
    if (!selectedRoaster || !profile) return;

    // First approve the pending roaster
    const approveSuccess = await approveRoaster(selectedRoaster.id, profile.id);
    if (!approveSuccess) {
      alert('Failed to approve roaster');
      return;
    }

    // Then add to roasters database
    const addSuccess = await addApprovedRoasterToDatabase(
      selectedRoaster.roaster_name,
      formData.city,
      formData.country,
      formData.state,
      formData.website,
      formData.foundedYear
    );

    if (addSuccess) {
      setPendingRoasters(prev => prev.filter(r => r.id !== selectedRoaster.id));
      setShowAddModal(false);
      setSelectedRoaster(null);
      alert('Roaster added successfully!');
    } else {
      alert('Failed to add roaster to database');
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase">ROASTER SUBMISSIONS</h1>
          <p className="text-xs text-zinc-100 mt-2 tracking-wider uppercase">
            {pendingRoasters.length} PENDING APPROVAL
          </p>
        </div>
      </div>

      {pendingRoasters.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-zinc-900 rounded-[3.5rem]">
          <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-6">
            <Check className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-3">
            ALL CAUGHT UP
          </h3>
          <p className="text-zinc-100 text-sm font-black uppercase tracking-widest">
            NO PENDING ROASTER SUBMISSIONS
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingRoasters.map(roaster => (
            <div
              key={roaster.id}
              className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {roaster.roaster_name}
                </h3>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-black uppercase">{roaster.submission_count} BREWS</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <Users className="w-4 h-4" />
                    <span className="font-black uppercase">{roaster.submitted_by_users.length} USERS</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={() => handleApprove(roaster)}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  APPROVE
                </button>
                <button
                  onClick={() => handleReject(roaster.id)}
                  className="flex-1 bg-zinc-900 border-2 border-zinc-800 text-zinc-100 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:border-red-900 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && selectedRoaster && (
        <AddRoasterModal
          roasterName={selectedRoaster.roaster_name}
          onClose={() => {
            setShowAddModal(false);
            setSelectedRoaster(null);
          }}
          onSubmit={handleAddRoaster}
        />
      )}
    </div>
  );
};

const AddRoasterModal: React.FC<{
  roasterName: string;
  onClose: () => void;
  onSubmit: (data: {
    city: string;
    country: string;
    state?: string;
    website?: string;
    foundedYear?: number;
  }) => void;
}> = ({ roasterName, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    city: '',
    country: '',
    state: '',
    website: '',
    foundedYear: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city || !formData.country) {
      alert('City and country are required');
      return;
    }

    onSubmit({
      city: formData.city.toUpperCase(),
      country: formData.country.toUpperCase(),
      state: formData.state ? formData.state.toUpperCase() : undefined,
      website: formData.website || undefined,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="max-w-md w-full bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase">ADD ROASTER</h2>
            <p className="text-sm text-zinc-200 mt-1 font-black uppercase tracking-wider">{roasterName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-100 hover:text-white transition-colors border-2 border-zinc-800 hover:border-white rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="CITY *"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
              required
            />
            <input
              type="text"
              placeholder="STATE"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
          </div>
          <input
            type="text"
            placeholder="COUNTRY *"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            required
          />
          <input
            type="url"
            placeholder="WEBSITE"
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white"
          />
          <input
            type="number"
            placeholder="FOUNDED YEAR"
            value={formData.foundedYear}
            onChange={e => setFormData({ ...formData, foundedYear: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
          />

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-zinc-800 text-zinc-100 hover:text-white hover:border-zinc-600 font-black text-sm uppercase tracking-wider transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-white text-black px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ADD ROASTER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRoasters;
