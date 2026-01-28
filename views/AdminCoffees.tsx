import React, { useState, useEffect } from 'react';
import { Check, X, Users, TrendingUp, Loader2, Coffee, MapPin, RefreshCw } from 'lucide-react';
import { getPendingCoffees, approveCoffee, rejectCoffee, addApprovedCoffeeToDatabase, backfillPendingCoffeesFromBrewLogs, type PendingCoffee } from '../lib/database';
import { useAuth } from '../hooks/useAuth';

const AdminCoffees: React.FC = () => {
  const { profile } = useAuth();
  const [pendingCoffees, setPendingCoffees] = useState<PendingCoffee[]>([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);

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
    loadPendingCoffees();
  }, []);

  async function loadPendingCoffees() {
    setLoading(true);
    const data = await getPendingCoffees();
    setPendingCoffees(data);
    setLoading(false);
  }

  async function handleApprove(coffee: PendingCoffee) {
    if (!profile) return;

    // Confirm approval
    if (!confirm(`Approve "${coffee.coffee_name}" from ${coffee.roaster_name}?`)) {
      return;
    }

    // First approve the pending coffee
    const approveSuccess = await approveCoffee(coffee.id, profile.id);
    if (!approveSuccess) {
      return;
    }

    // Then add to coffee_offerings database
    const addSuccess = await addApprovedCoffeeToDatabase(
      coffee.roaster_name,
      coffee.coffee_name,
      coffee.origin,
      coffee.estate,
      coffee.lot,
      coffee.varietal,
      coffee.process
    );

    if (addSuccess) {
      setPendingCoffees(prev => prev.filter(c => c.id !== coffee.id));
    }
  }

  async function handleReject(coffeeId: string) {
    if (confirm('Reject this coffee submission?')) {
      const success = await rejectCoffee(coffeeId);
      if (success) {
        setPendingCoffees(prev => prev.filter(c => c.id !== coffeeId));
      }
    }
  }

  async function handleBackfill() {
    if (!confirm('This will scan all existing brew logs and add coffees to pending approvals. Continue?')) {
      return;
    }

    setBackfilling(true);
    const result = await backfillPendingCoffeesFromBrewLogs();
    setBackfilling(false);

    if (result.success) {
      alert(`Successfully processed ${result.processed} brew logs!`);
      // Reload pending coffees
      await loadPendingCoffees();
    } else {
      alert(`Error processing brew logs. Processed: ${result.processed}\nErrors: ${result.errors.join('\n')}`);
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
          <h1 className="text-5xl font-black tracking-tighter uppercase">COFFEE SUBMISSIONS</h1>
          <p className="text-xs text-zinc-100 mt-2 tracking-wider uppercase">
            {pendingCoffees.length} PENDING APPROVAL
          </p>
        </div>
        <button
          onClick={handleBackfill}
          disabled={backfilling}
          className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${backfilling ? 'animate-spin' : ''}`} />
          {backfilling ? 'PROCESSING...' : 'BACKFILL FROM LOGS'}
        </button>
      </div>

      {pendingCoffees.length === 0 ? (
        <div className="text-center py-20 border-4 border-dashed border-zinc-900 rounded-[3.5rem]">
          <div className="bg-white p-8 rounded-[2.5rem] inline-block mb-6">
            <Check className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-5xl font-black text-white uppercase tracking-tighter mb-3">
            ALL CAUGHT UP
          </h3>
          <p className="text-zinc-100 text-sm font-black uppercase tracking-widest">
            NO PENDING COFFEE SUBMISSIONS
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingCoffees.map(coffee => (
            <div
              key={coffee.id}
              className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-6 space-y-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Coffee className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {coffee.roaster_name}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                  {coffee.coffee_name}
                </h3>

                {/* Origin */}
                <div className="flex items-center gap-2 mt-2 text-xs text-zinc-300">
                  <MapPin className="w-3 h-3" />
                  <span className="font-black uppercase">{coffee.origin}</span>
                </div>

                {/* Details */}
                <div className="space-y-1 mt-3">
                  {coffee.estate && (
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      ESTATE: {coffee.estate}
                    </p>
                  )}
                  {coffee.lot && (
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      LOT: {coffee.lot}
                    </p>
                  )}
                  {coffee.varietal && (
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      VARIETAL: {coffee.varietal}
                    </p>
                  )}
                  {coffee.process && (
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                      PROCESS: {coffee.process}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-black uppercase">{coffee.submission_count} BREWS</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-200">
                    <Users className="w-4 h-4" />
                    <span className="font-black uppercase">{coffee.submitted_by_users.length} USERS</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={() => handleApprove(coffee)}
                  className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  APPROVE
                </button>
                <button
                  onClick={() => handleReject(coffee.id)}
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
    </div>
  );
};

export default AdminCoffees;
