import React, { useState, useEffect } from 'react';
import { Check, X, Coffee, TrendingUp, Loader2, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPendingCafes, approveCafe, rejectCafe, addApprovedCafeToDatabase, type PendingCafe } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const AdminCafes: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pendingCafes, setPendingCafes] = useState<PendingCafe[]>([]);
  const [loading, setLoading] = useState(true);

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
    loadPendingCafes();
  }, []);

  async function loadPendingCafes() {
    setLoading(true);
    const data = await getPendingCafes();
    setPendingCafes(data);
    setLoading(false);
  }

  async function handleApprove(cafe: PendingCafe) {
    if (!profile) return;

    // Check if required fields are present
    if (!cafe.city || !cafe.country) {
      return;
    }

    // Confirm approval
    if (!confirm(`Approve "${cafe.cafe_name}" in ${cafe.city}, ${cafe.country}?`)) {
      return;
    }

    // First approve the pending cafe
    const approveSuccess = await approveCafe(cafe.id, profile.id);
    if (!approveSuccess) {
      return;
    }

    // Then add to cafes database
    const addSuccess = await addApprovedCafeToDatabase(
      cafe.cafe_name,
      cafe.city,
      cafe.country,
      cafe.address
    );

    if (addSuccess) {
      setPendingCafes(prev => prev.filter(c => c.id !== cafe.id));
    }
  }

  async function handleReject(cafeId: string) {
    if (confirm('Reject this cafe submission?')) {
      const success = await rejectCafe(cafeId);
      if (success) {
        setPendingCafes(prev => prev.filter(c => c.id !== cafeId));
      }
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
      <button
        onClick={() => navigate('/profile/me')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-wider">Back to Profile</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">CAFE APPROVALS</h1>
          <p className="text-zinc-400 text-sm font-black uppercase tracking-wider">
            Review and approve user-submitted cafes
          </p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black text-white">{pendingCafes.length}</p>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pending</p>
        </div>
      </div>

      {pendingCafes.length === 0 ? (
        <div className="py-32 px-10 text-center border-4 border-dashed border-zinc-900 rounded-[4rem]">
          <div className="bg-white p-8 rounded-[2.5rem] w-fit mx-auto mb-8">
            <Coffee className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
            No Pending Cafes
          </h3>
          <p className="text-zinc-400 text-sm font-black uppercase tracking-wider">
            All cafe submissions have been reviewed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCafes.map(cafe => (
            <div
              key={cafe.id}
              className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight leading-tight">
                      {cafe.cafe_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-lg">
                    <Users className="w-3 h-3 text-zinc-400" />
                    <span className="text-xs font-black text-white">{cafe.submission_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-black uppercase tracking-wide">
                    {cafe.city}, {cafe.country}
                  </span>
                </div>

                {cafe.address && (
                  <p className="text-xs font-black text-zinc-500 uppercase tracking-wider">
                    {cafe.address}
                  </p>
                )}

                <div className="pt-2 border-t-2 border-zinc-800">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                    Submitted By
                  </p>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-3 h-3" />
                    <span className="text-xs font-black uppercase">
                      {cafe.submitted_by_users.length} {cafe.submitted_by_users.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(cafe)}
                  className="flex-1 bg-white text-black font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(cafe.id)}
                  className="bg-zinc-800 text-zinc-400 font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-zinc-700 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCafes;
