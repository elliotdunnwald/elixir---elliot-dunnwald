import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Coffee, Loader2 } from 'lucide-react';
import { getCafeById, getActivitiesByCafe, type Cafe, type BrewActivity } from '../lib/database';
import PostCard from '../components/PostCard';
import BrewLogDetailModal from '../components/BrewLogDetailModal';

const CafeProfile: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [visits, setVisits] = useState<BrewActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (cafeId) {
      loadCafeData();
    }
  }, [cafeId]);

  async function loadCafeData() {
    if (!cafeId) return;

    setLoading(true);
    try {
      const [cafeData, visitsData] = await Promise.all([
        getCafeById(cafeId),
        getActivitiesByCafe(cafeId)
      ]);

      setCafe(cafeData);
      setVisits(visitsData || []);
    } catch (err) {
      console.error('Error loading cafe data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="py-32 text-center border-4 border-dashed border-red-900 rounded-[3.5rem]">
          <h1 className="text-5xl font-black text-black uppercase tracking-tighter mb-4">CAFE NOT FOUND</h1>
          <button
            onClick={() => navigate('/explore')}
            className="mt-8 bg-white text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <button
        onClick={() => navigate('/explore')}
        className="flex items-center gap-2 text-zinc-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-wider">Back to Explore</span>
      </button>

      {/* Cafe Header */}
      <div className="bg-white border-2 border-black rounded-[3rem] p-12 space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-5xl font-black text-black uppercase tracking-tighter leading-tight mb-4">
              {cafe.name}
            </h1>
            <div className="flex items-center gap-3 text-zinc-300">
              <MapPin className="w-5 h-5" />
              <span className="text-lg font-black uppercase tracking-wide">
                {cafe.city}, {cafe.country}
              </span>
            </div>
            {cafe.address && (
              <p className="text-sm font-black text-zinc-500 uppercase tracking-wide mt-2">
                {cafe.address}
              </p>
            )}
          </div>

          <div className="bg-white text-black px-8 py-6 rounded-2xl text-center min-w-[120px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-6 h-6 fill-current" />
            </div>
            <p className="text-4xl font-black">
              {cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : 'N/A'}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
              Average
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-6 border-t-2 border-black">
          <div className="bg-zinc-50 p-6 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-600 mb-2">
              <Coffee className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Total Visits</span>
            </div>
            <p className="text-3xl font-black text-black">{cafe.visit_count}</p>
          </div>
          <div className="bg-zinc-50 p-6 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-600 mb-2">
              <Star className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Reviews</span>
            </div>
            <p className="text-3xl font-black text-black">{visits.length}</p>
          </div>
        </div>
      </div>

      {/* Visits/Reviews Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">
          Recent Visits
        </h2>

        {visits.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-black rounded-[3rem]">
            <Coffee className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-600 font-black uppercase text-sm tracking-widest">
              No visits yet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {visits.map(visit => (
              <PostCard
                key={visit.id}
                activity={visit}
                onClick={() => setSelectedActivityId(visit.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedActivityId && (
        <BrewLogDetailModal
          activityId={selectedActivityId}
          onClose={() => setSelectedActivityId(null)}
        />
      )}
    </div>
  );
};

export default CafeProfile;
