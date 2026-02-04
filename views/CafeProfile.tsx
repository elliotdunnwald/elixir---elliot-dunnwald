import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Coffee, Loader2 } from 'lucide-react';
import { getCafeById, getActivitiesByCafe, getActivitiesByCafeFiltered, getRoasterByName, type Cafe, type BrewActivity, type Roaster } from '../lib/database';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import VisitCard from '../components/VisitCard';
import BrewLogDetailModal from '../components/BrewLogDetailModal';

const CafeProfile: React.FC = () => {
  const { cafeId } = useParams<{ cafeId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [visits, setVisits] = useState<BrewActivity[]>([]);
  const [allVisits, setAllVisits] = useState<BrewActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'reviews' | 'visits'>('visits');
  const [followingOnly, setFollowingOnly] = useState(false);
  const [matchingRoaster, setMatchingRoaster] = useState<Roaster | null>(null);

  useEffect(() => {
    if (cafeId) {
      loadCafeData();
    }
  }, [cafeId, filter, followingOnly]);

  async function loadCafeData() {
    if (!cafeId) return;

    setLoading(true);
    try {
      const [cafeData, allVisitsData, filteredVisitsData] = await Promise.all([
        getCafeById(cafeId),
        getActivitiesByCafe(cafeId), // Get all for counting
        getActivitiesByCafeFiltered(cafeId, {
          filter,
          followingOnly,
          currentUserId: profile?.id
        })
      ]);

      setCafe(cafeData);
      setAllVisits(allVisitsData || []);
      setVisits(filteredVisitsData || []);

      // Check if cafe is also a roaster
      if (cafeData) {
        const roaster = await getRoasterByName(cafeData.name);
        setMatchingRoaster(roaster);
      }
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
            className="mt-8 bg-white text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all border-2 border-black"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-28 sm:pb-0">
      <button
        onClick={() => navigate('/explore')}
        className="flex items-center gap-2 text-black hover:text-black transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-black uppercase tracking-wider">Back to Explore</span>
      </button>

      {/* Cafe Header */}
      <div className="bg-white border-2 border-black rounded-[3rem] p-6 sm:p-12 space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1 w-full">
            <h1 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tighter leading-tight mb-3 sm:mb-4">
              {cafe.name}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 text-black">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-lg font-black uppercase tracking-wide">
                {cafe.city}, {cafe.country}
              </span>
            </div>
            {cafe.address && (
              <p className="text-xs sm:text-sm font-black text-black uppercase tracking-wide mt-2">
                {cafe.address}
              </p>
            )}
            {matchingRoaster && (
              <button
                onClick={() => navigate('/marketplace', { state: { selectedRoaster: matchingRoaster.name } })}
                className="mt-3 bg-black text-white px-3 py-1.5 rounded-lg border-2 border-black hover:bg-zinc-800 transition-all text-[10px] font-black uppercase tracking-wider"
              >
                View Roaster Page
              </button>
            )}
          </div>

          <div className="bg-white text-black px-6 py-4 sm:px-8 sm:py-6 rounded-2xl text-center min-w-[100px] sm:min-w-[120px] border-2 border-black">
            <p className="text-3xl sm:text-4xl font-black">
              {cafe.average_rating > 0 ? cafe.average_rating.toFixed(1) : 'N/A'}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 text-black">
              Average
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-6 border-t-2 border-black">
          <div className="bg-zinc-50 p-4 sm:p-6 rounded-xl border-2 border-black">
            <div className="flex items-center gap-2 text-black mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Visits</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-black">{allVisits.length}</p>
          </div>
          <div className="bg-zinc-50 p-4 sm:p-6 rounded-xl border-2 border-black">
            <div className="flex items-center gap-2 text-black mb-2">
              <Star className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Reviews</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-black">{allVisits.filter(v => v.rating !== undefined && v.rating !== null).length}</p>
          </div>
        </div>
      </div>

      {/* Visits/Reviews Section */}
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">
            {filter === 'reviews' ? 'Reviews' : 'Visits'}
          </h2>

          {/* Filter Controls */}
          <div className="space-y-3">
            {/* View Filter Pills */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('visits')}
                className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === 'visits' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-100'
                }`}
              >
                Visits
              </button>
              <button
                onClick={() => setFilter('reviews')}
                className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === 'reviews' ? 'bg-black text-white border-black' : 'bg-white text-black border-black hover:bg-zinc-100'
                }`}
              >
                Reviews
              </button>
            </div>

            {/* Following Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followingOnly}
                onChange={(e) => setFollowingOnly(e.target.checked)}
                className="w-4 h-4 border-2 border-black rounded bg-white checked:bg-black cursor-pointer"
              />
              <span className="text-[10px] font-black text-black uppercase tracking-widest">Following Only</span>
            </label>
          </div>
        </div>

        {visits.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-black rounded-[3rem]">
            <Coffee className="w-12 h-12 text-black mx-auto mb-4" />
            <p className="text-black font-black uppercase text-sm tracking-widest">
              {filter === 'reviews' ? 'No reviews yet' : 'No visits yet'}
            </p>
            {followingOnly && (
              <p className="text-black font-bold uppercase text-xs tracking-wider mt-2">
                from people you follow
              </p>
            )}
          </div>
        ) : (
          <div className={filter === 'visits' ? 'space-y-3' : 'space-y-6'}>
            {visits.map(visit => (
              filter === 'visits' ? (
                <VisitCard
                  key={visit.id}
                  activity={visit}
                  onClick={() => setSelectedActivityId(visit.id)}
                />
              ) : (
                <PostCard
                  key={visit.id}
                  activity={visit}
                  onClick={() => setSelectedActivityId(visit.id)}
                />
              )
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
