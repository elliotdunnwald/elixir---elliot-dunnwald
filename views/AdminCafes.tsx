import React, { useState, useEffect } from 'react';
import { Check, X, Coffee, TrendingUp, Loader2, MapPin, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPendingCafes, approveCafe, rejectCafe, addApprovedCafeToDatabase, recalculateAllCafeStats, type PendingCafe } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const AdminCafes: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [pendingCafes, setPendingCafes] = useState<PendingCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Admin check
  if (!profile?.is_admin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-32 border-4 border-dashed border-red-900 rounded-[3.5rem]">
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">ACCESS DENIED</h1>
          <p className="text-black text-sm font-black uppercase tracking-wider">
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

  async function handleRecalculateStats() {
    if (!confirm('Recalculate ratings and visit counts for all cafes? This will fix cafes showing N/A.')) {
      return;
    }

    setRecalculating(true);
    try {
      await recalculateAllCafeStats();
      alert('✅ Successfully recalculated cafe stats! All cafes should now show correct ratings.');
    } catch (error) {
      console.error('Error recalculating stats:', error);
      alert('❌ Failed to recalculate stats. Check console for details.');
    } finally {
      setRecalculating(false);
    }
  }

  async function geocodeCafe(cafe: PendingCafe): Promise<{ lat: number; lng: number } | null> {
    // Construct address query
    const addressQuery = cafe.address
      ? `${cafe.address}, ${cafe.city}, ${cafe.country}`
      : `${cafe.city}, ${cafe.country}`;

    try {
      // Nominatim requires a User-Agent header
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Elixr Coffee App (contact@elixr.coffee)'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
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

    // Geocode the cafe to get coordinates
    console.log('Geocoding cafe:', cafe.cafe_name);
    const coordinates = await geocodeCafe(cafe);
    if (coordinates) {
      console.log('Geocoded coordinates:', coordinates);
    } else {
      console.log('Could not geocode cafe, will be added without coordinates');
    }

    // First approve the pending cafe
    const approveSuccess = await approveCafe(cafe.id, profile.id);
    if (!approveSuccess) {
      return;
    }

    // Then add to cafes database with coordinates
    const addSuccess = await addApprovedCafeToDatabase(
      cafe.cafe_name,
      cafe.city,
      cafe.country,
      cafe.address,
      coordinates?.lat,
      coordinates?.lng
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
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-28 sm:pb-0">
      <button
        onClick={() => navigate('/profile/me')}
        className="flex items-center gap-2 text-black hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-wider">Back to Profile</span>
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-2">CAFE APPROVALS</h1>
          <p className="text-black text-sm font-black uppercase tracking-wider">
            Review and approve user-submitted cafes
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleRecalculateStats}
            disabled={recalculating}
            className="px-6 py-3 bg-white text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-100 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {recalculating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Recalculating...</>
            ) : (
              <><TrendingUp className="w-4 h-4" /> Recalculate All Stats</>
            )}
          </button>
          <div className="text-right">
            <p className="text-5xl font-black text-black">{pendingCafes.length}</p>
            <p className="text-[10px] font-black text-black uppercase tracking-widest">Pending</p>
          </div>
        </div>
      </div>

      {pendingCafes.length === 0 ? (
        <div className="py-32 px-10 text-center border-4 border-dashed border-zinc-900 rounded-[4rem]">
          <div className="bg-white p-8 rounded-[2.5rem] w-fit mx-auto mb-8">
            <Coffee className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-4xl font-black text-black uppercase tracking-tighter mb-4">
            No Pending Cafes
          </h3>
          <p className="text-black text-sm font-black uppercase tracking-wider">
            All cafe submissions have been reviewed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingCafes.map(cafe => (
            <div
              key={cafe.id}
              className="bg-white border-2 border-black rounded-2xl p-6 space-y-4 hover:border-black transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black uppercase tracking-tight leading-tight">
                      {cafe.cafe_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1 rounded-lg">
                    <Users className="w-3 h-3 text-black" />
                    <span className="text-xs font-black text-black">{cafe.submission_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-black">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-black uppercase tracking-wide">
                    {cafe.city}, {cafe.country}
                  </span>
                </div>

                {cafe.address && (
                  <p className="text-xs font-black text-black uppercase tracking-wider">
                    {cafe.address}
                  </p>
                )}

                <div className="pt-2 border-t-2 border-black">
                  <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">
                    Submitted By
                  </p>
                  <div className="flex items-center gap-2 text-black">
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
                  className="flex-1 bg-white text-black font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 border-2 border-black"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(cafe.id)}
                  className="bg-zinc-50 text-black font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl hover:bg-zinc-700 hover:text-black transition-all"
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
