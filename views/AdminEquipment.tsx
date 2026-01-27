import React, { useState, useEffect } from 'react';
import { Check, X, Users, TrendingUp, Loader2, Plus, Package } from 'lucide-react';
import { getPendingEquipment, approveEquipment, rejectEquipment, addApprovedEquipmentToDatabase, type PendingEquipment } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const EQUIPMENT_TYPE_LABELS = {
  brewer: 'Brewer',
  grinder: 'Grinder',
  filter: 'Filter',
  water: 'Water Equipment',
  accessory: 'Accessory'
};

const AdminEquipment: React.FC = () => {
  const { profile } = useAuth();
  const [pendingEquipment, setPendingEquipment] = useState<PendingEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<PendingEquipment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Admin check
  if (!profile?.is_admin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-32 border-4 border-dashed border-red-900 rounded-[3.5rem]">
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">ACCESS DENIED</h1>
          <p className="text-zinc-400 text-sm font-black uppercase tracking-wider">
            You must be an admin to access this page
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadPendingEquipment();
  }, []);

  async function loadPendingEquipment() {
    setLoading(true);
    const data = await getPendingEquipment();
    setPendingEquipment(data);
    setLoading(false);
  }

  async function handleApprove(equipment: PendingEquipment) {
    setSelectedEquipment(equipment);
    setShowAddModal(true);
  }

  async function handleReject(equipmentId: string) {
    if (confirm('Reject this equipment submission?')) {
      const success = await rejectEquipment(equipmentId);
      if (success) {
        setPendingEquipment(prev => prev.filter(e => e.id !== equipmentId));
      }
    }
  }

  async function handleAddEquipment(formData: {
    description?: string;
    imageUrl?: string;
    price?: number;
    websiteUrl?: string;
  }) {
    if (!selectedEquipment || !profile) return;

    // First approve the pending equipment
    const approveSuccess = await approveEquipment(selectedEquipment.id, profile.id);
    if (!approveSuccess) {
      alert('Failed to approve equipment');
      return;
    }

    // Then add to equipment database
    const addSuccess = await addApprovedEquipmentToDatabase(
      selectedEquipment.equipment_name,
      selectedEquipment.brand || 'Unknown',
      selectedEquipment.equipment_type,
      formData.description,
      formData.imageUrl,
      formData.price,
      formData.websiteUrl
    );

    if (addSuccess) {
      setPendingEquipment(prev => prev.filter(e => e.id !== selectedEquipment.id));
      setShowAddModal(false);
      setSelectedEquipment(null);
      alert('Equipment added successfully!');
    } else {
      alert('Failed to add equipment to database');
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
          <h1 className="text-5xl font-black tracking-tighter uppercase">EQUIPMENT SUBMISSIONS</h1>
          <p className="text-xs text-zinc-100 mt-2 tracking-wider uppercase">
            {pendingEquipment.length} PENDING APPROVAL
          </p>
        </div>
      </div>

      {pendingEquipment.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-zinc-900 rounded-[3.5rem]">
          <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-6">
            <Check className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-3">
            ALL CAUGHT UP
          </h3>
          <p className="text-zinc-100 text-sm font-black uppercase tracking-widest">
            NO PENDING EQUIPMENT SUBMISSIONS
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingEquipment.map(equipment => (
            <div
              key={equipment.id}
              className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-6 space-y-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {equipment.equipment_name}
                </h3>
                {equipment.brand && (
                  <p className="text-sm text-zinc-300 font-black uppercase tracking-wider mt-1">
                    {equipment.brand}
                  </p>
                )}
                {equipment.description && (
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                    {equipment.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-black uppercase">{equipment.submission_count} SUBMISSIONS</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <Users className="w-4 h-4" />
                    <span className="font-black uppercase">{equipment.submitted_by_users.length} USERS</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={() => handleApprove(equipment)}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  APPROVE
                </button>
                <button
                  onClick={() => handleReject(equipment.id)}
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

      {showAddModal && selectedEquipment && (
        <AddEquipmentModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowAddModal(false);
            setSelectedEquipment(null);
          }}
          onSubmit={handleAddEquipment}
        />
      )}
    </div>
  );
};

const AddEquipmentModal: React.FC<{
  equipment: PendingEquipment;
  onClose: () => void;
  onSubmit: (data: {
    description?: string;
    imageUrl?: string;
    price?: number;
    websiteUrl?: string;
  }) => void;
}> = ({ equipment, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    description: equipment.description || '',
    imageUrl: '',
    price: '',
    websiteUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      websiteUrl: formData.websiteUrl || undefined
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
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase">ADD EQUIPMENT</h2>
            <p className="text-sm text-zinc-200 mt-1 font-black uppercase tracking-wider">
              {equipment.brand ? `${equipment.brand} ` : ''}{equipment.equipment_name}
            </p>
            <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">
              {EQUIPMENT_TYPE_LABELS[equipment.equipment_type]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-100 hover:text-white transition-colors border-2 border-zinc-800 hover:border-white rounded-xl p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-100 uppercase tracking-widest px-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-white resize-none h-20"
              placeholder="Brief description of the equipment..."
            />
          </div>

          <input
            type="url"
            placeholder="IMAGE URL"
            value={formData.imageUrl}
            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              step="0.01"
              placeholder="PRICE"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white uppercase"
            />
            <input
              type="url"
              placeholder="WEBSITE"
              value={formData.websiteUrl}
              onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="w-full bg-black border-2 border-zinc-900 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-white"
            />
          </div>

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
              ADD EQUIPMENT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEquipment;
