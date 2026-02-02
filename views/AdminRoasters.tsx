import React, { useState, useEffect } from 'react';
import { Check, X, Users, TrendingUp, Loader2, MapPin, Globe, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPendingRoasters, approveRoaster, rejectRoaster, addApprovedRoasterToDatabase, type PendingRoaster } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const AdminRoasters: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pendingRoasters, setPendingRoasters] = useState<PendingRoaster[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin check
  if (!profile?.is_admin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-32 border-4 border-dashed border-red-900 rounded-[3.5rem]">
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">ACCESS DENIED</h1>
          <p className="text-zinc-600 text-sm font-black uppercase tracking-wider">
            You must be an admin to access this page
          </p>
        </div>
      </div>
    );
  }

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
    if (!profile) return;

    // Check if required fields are present
    if (!roaster.city || !roaster.country) {
      return;
    }

    // Confirm approval
    if (!confirm(`Approve "${roaster.roaster_name}" from ${roaster.city}, ${roaster.country}?`)) {
      return;
    }

    // First approve the pending roaster
    const approveSuccess = await approveRoaster(roaster.id, profile.id);
    if (!approveSuccess) {
      return;
    }

    // Then add to roasters database
    const addSuccess = await addApprovedRoasterToDatabase(
      roaster.roaster_name,
      roaster.city,
      roaster.country,
      roaster.state,
      roaster.website
    );

    if (addSuccess) {
      setPendingRoasters(prev => prev.filter(r => r.id !== roaster.id));
    }
  }

  async function handleReject(roasterId: string) {
    if (confirm('Reject this roaster submission?')) {
      const success = await rejectRoaster(roasterId);
      if (success) {
        setPendingRoasters(prev => prev.filter(r => r.id !== roasterId));
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <button
        onClick={() => navigate('/profile/me')}
        className="flex items-center gap-2 text-zinc-600 hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-wider">Back to Profile</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">ROASTER SUBMISSIONS</h1>
          <p className="text-xs text-zinc-900 mt-2 tracking-wider uppercase">
            {pendingRoasters.length} PENDING APPROVAL
          </p>
        </div>
      </div>

      {pendingRoasters.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-zinc-900 rounded-[3.5rem]">
          <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-6">
            <Check className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-5xl font-black text-black uppercase tracking-tighter mb-3">
            ALL CAUGHT UP
          </h3>
          <p className="text-zinc-900 text-sm font-black uppercase tracking-widest">
            NO PENDING ROASTER SUBMISSIONS
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingRoasters.map(roaster => (
            <div
              key={roaster.id}
              className="bg-zinc-50 border-2 border-zinc-900 rounded-2xl p-6 space-y-4"
            >
              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tighter">
                  {roaster.roaster_name}
                </h3>

                {/* Location Info */}
                {(roaster.city || roaster.country) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300">
                    <MapPin className="w-3 h-3" />
                    <span className="font-black uppercase">
                      {roaster.city && roaster.country ? `${roaster.city}, ${roaster.state ? roaster.state + ', ' : ''}${roaster.country}` : roaster.city || roaster.country || 'Location not provided'}
                    </span>
                  </div>
                )}

                {/* Website */}
                {roaster.website && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300">
                    <Globe className="w-3 h-3" />
                    <a
                      href={roaster.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-black hover:text-black transition-colors truncate"
                    >
                      {roaster.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-black uppercase">{roaster.submission_count} BREWS</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-700">
                    <Users className="w-4 h-4" />
                    <span className="font-black uppercase">{roaster.submitted_by_users.length} USERS</span>
                  </div>
                </div>

                {/* Warning if missing info */}
                {(!roaster.city || !roaster.country) && (
                  <div className="mt-3 text-xs text-yellow-500 font-black uppercase bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                    ⚠ Missing location info
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-300 flex gap-2">
                <button
                  onClick={() => handleApprove(roaster)}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  APPROVE
                </button>
                <button
                  onClick={() => handleReject(roaster.id)}
                  className="flex-1 bg-white border-2 border-zinc-300 text-zinc-900 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:border-red-900 hover:text-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  REJECT
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRoasters;
