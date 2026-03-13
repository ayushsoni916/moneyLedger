import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, ArrowUpRight, X, AlertCircle, Loader2, IndianRupee, Wallet } from 'lucide-react';
import { getDashboardStats } from '../services/api';

const Home = ({ onSeeToday }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Syncing Capital...</p>
      </div>
    );
  }

 // Fallback with new split structure
  const data = stats || {
    emi: { target: 0, received: 0, pending: 0 },
    fixed: { target: 0, received: 0, pending: 0 },
    totalMarketCap: 0,
    totalClients: 0,
    activeLoansCount: 0,
    overdueAlerts: [],
    upcomingKists: []
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pt-16 pb-32 max-w-md mx-auto"
    >
      {/* Header with Functional Strike Button */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Capital Overview</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter leading-tight uppercase">Today's Focus</h1>
        </div>
        <button
          onClick={() => setShowInsights(true)}
          className={`p-4 rounded-2xl border transition-all relative ${data.overdueAlerts.length > 0
            ? 'bg-rose-500/10 border-rose-500/50 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
            : 'bg-white/5 border-white/10 text-emerald-400'
            }`}
        >
          <Zap size={22} fill="currentColor" />
          {data.overdueAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#1A1A2E] animate-ping" />
          )}
        </button>
      </div>

    {/* Split Stats: EMI Card */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] p-6 mb-4 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic flex items-center gap-2">
                <IndianRupee size={12}/> Daily EMI Recovery
            </span>
            <span className="text-[10px] font-black text-white/40 italic">Today</span>
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className="text-white/30 text-[8px] font-bold uppercase tracking-widest mb-1">Target</p>
                <h2 className="text-3xl font-black text-white italic tracking-tighter">₹{data.emi.target.toLocaleString()}</h2>
            </div>
            <div className="text-right">
                <p className="text-emerald-500 text-[8px] font-black uppercase tracking-widest mb-1">Collected</p>
                <h2 className="text-2xl font-black text-emerald-400 italic tracking-tighter">₹{data.emi.received.toLocaleString()}</h2>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Pending</p>
            <p className="text-[10px] font-black text-rose-400 italic">₹{data.emi.pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Split Stats: Fixed Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-[40px] p-6 mb-8 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2">
                <Wallet size={12}/> Fixed Settlements
            </span>
        </div>
        <div className="flex justify-between items-end">
            <div>
                <p className="text-white/30 text-[8px] font-bold uppercase tracking-widest mb-1">Due Amount</p>
                <h2 className="text-3xl font-black text-white italic tracking-tighter">₹{data.fixed.target.toLocaleString()}</h2>
            </div>
            <div className="text-right">
                <p className="text-blue-500 text-[8px] font-black uppercase tracking-widest mb-1">Collected</p>
                <h2 className="text-2xl font-black text-blue-400 italic tracking-tighter">₹{data.fixed.received.toLocaleString()}</h2>
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Remaining</p>
            <p className="text-[10px] font-black text-rose-400 italic">₹{data.fixed.pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Global Market Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <StatSmall label="Market Cap" val={`₹${(data.totalMarketCap / 1000).toFixed(1)}K`} color="text-white" />
        <StatSmall label="Clients" val={data.totalClients} color="text-white" />
        <StatSmall label="Active Loans" val={data.activeLoansCount} color="text-white" />
      </div>

      {/* Upcoming Section */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black text-white/90 italic">Upcoming Kists</h3>
          <button onClick={onSeeToday} className="text-[10px] font-black uppercase px-4 py-2 rounded-xl bg-emerald-500 text-[#1A1A2E] tracking-widest shadow-lg">See All</button>
        </div>

        <div className="space-y-6">
          {data.upcomingKists.length > 0 ? (
            data.upcomingKists.map((kist, idx) => (
              <KistRow key={idx} name={kist.clientName} amount={kist.amount} type={kist.type} />
            ))
          ) : (
            <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-widest italic py-4">No collections pending</p>
          )}
        </div>
      </div>

      {/* Alerts Modal */}
      <AnimatePresence>
        {showInsights && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="w-full max-w-sm bg-[#1A1A2E] border border-white/20 rounded-[40px] p-8 shadow-2xl relative">
              <button onClick={() => setShowInsights(false)} className="absolute top-6 right-6 text-white/20"><X size={24} /></button>
              <div className="flex items-center gap-3 mb-8 text-rose-500">
                <AlertCircle size={24} />
                <h3 className="text-xl font-black italic uppercase">Urgent Alerts</h3>
              </div>
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {data.overdueAlerts.map((alert, idx) => (
                  <div key={idx} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                    <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest mb-1">
                        {alert.type} • {alert.days ? `${alert.days} Days Missed` : 'Due Expired'}
                    </p>
                    <p className="text-white font-bold text-sm tracking-tight">{alert.clientName}</p>
                    <p className="text-rose-500 font-black italic text-xs mt-1">₹{alert.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowInsights(false)} className="w-full mt-8 py-4 bg-white text-[#1A1A2E] font-black rounded-2xl uppercase tracking-widest text-[10px]">Dismiss</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const StatSmall = ({ label, val, color }) => (
  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 text-center">
    <p className="text-[7px] font-black text-white/30 uppercase mb-1 tracking-tighter">{label}</p>
    <p className={`text-sm font-black italic tracking-tighter ${color}`}>{val}</p>
  </div>
);

const KistRow = ({ name, amount, type }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-white/60 italic text-sm">{name[0]}</div>
      <div>
        <p className="font-bold text-white text-sm tracking-tight">{name}</p>
        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">{type} Collection</p>
      </div>
    </div>
    <p className="font-black text-white italic text-base tracking-tighter">₹{amount.toLocaleString()}</p>
  </div>
);

export default Home;