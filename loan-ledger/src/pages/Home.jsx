import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, ArrowUpRight, X, AlertCircle, Loader2 } from 'lucide-react';
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

  // Fallback for empty state if API fails or returns null
  const data = stats || {
    targetToday: 0,
    receivedToday: 0,
    totalMarketCap: 0,
    overdueAlerts: [],
    upcomingKists: []
  };

  const amountLeft = data.targetToday - data.receivedToday;

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
          className={`p-4 rounded-2xl border transition-all relative ${
            data.overdueAlerts.length > 0 
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

      {/* Main Stats Card */}
      <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[40px] p-10 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2 italic">Target to receive today</p>
        <h2 className="text-center text-6xl font-black tracking-tighter text-white mb-10 italic">
          ₹{data.targetToday.toLocaleString()}
        </h2>
        
        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8">
          <StatMini label="Received" val={`₹${data.receivedToday.toLocaleString()}`} color="text-emerald-400" />
          <StatMini label="Left" val={`₹${amountLeft.toLocaleString()}`} color="text-rose-400" border="border-x border-white/10" />
          <StatMini label="Market" val={`₹${(data.totalMarketCap / 1000).toFixed(1)}K`} color="text-blue-400" />
        </div>
      </div>

      {/* Quick Insights Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <InsightCard title="Total Clients" val={data.totalClients} icon={<TrendingUp size={18}/>} />
        <InsightCard title="Active Loans" val={data.activeLoansCount} icon={<ArrowUpRight size={18}/>} />
      </div>

      {/* Upcoming Section with Functional Button */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-lg font-black text-white/90 italic">Upcoming Kists</h3>
          <button 
            onClick={onSeeToday}
            className="text-[10px] font-black uppercase px-5 py-2.5 rounded-xl bg-emerald-500 text-[#1A1A2E] tracking-widest border border-emerald-500 active:scale-95 transition-all shadow-lg"
          >
            See Today
          </button>
        </div>

        <div className="space-y-6">
          {data.upcomingKists.length > 0 ? (
            data.upcomingKists.map((kist, idx) => (
              <KistRow key={idx} name={kist.name} amount={kist.amount} />
            ))
          ) : (
            <p className="text-center text-white/20 text-[10px] font-black uppercase tracking-widest italic py-4">No collections pending</p>
          )}
        </div>
      </div>

      {/* FLASH INSIGHTS MODAL (Strike Action) */}
      <AnimatePresence>
        {showInsights && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A2E]/90 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white/10 border border-white/20 rounded-[40px] p-8 shadow-2xl relative"
            >
              <button onClick={() => setShowInsights(false)} className="absolute top-6 right-6 text-white/20 hover:text-white">
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <AlertCircle className="text-rose-500" size={24} />
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Urgent Alerts</h3>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {data.overdueAlerts.length > 0 ? (
                  data.overdueAlerts.map((alert, idx) => (
                    <div key={idx} className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-rose-500 text-[8px] font-black uppercase tracking-widest">
                          {alert.isFixed ? 'Due Expired' : `Missed ${alert.days} Days`}
                        </p>
                        <p className="text-rose-500 font-black italic text-xs">₹{alert.amount.toLocaleString()}</p>
                      </div>
                      <p className="text-white font-bold text-sm tracking-tight">{alert.client}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">System Healthy</p>
                    <p className="text-white/40 text-[10px] italic mt-1">No overdue payments found</p>
                  </div>
                )}
              </div>
              
              <button onClick={() => setShowInsights(false)} className="w-full mt-8 py-5 bg-white text-[#1A1A2E] font-black rounded-[20px] uppercase tracking-widest text-[10px]">Dismiss Alerts</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Sub-components
const StatMini = ({ label, val, color, border }) => (
  <div className={`text-center px-1 ${border}`}>
    <p className="text-[8px] font-black uppercase text-white/20 mb-1 tracking-tighter">{label}</p>
    <p className={`text-base font-black tracking-tighter italic ${color}`}>{val}</p>
  </div>
);

const InsightCard = ({ title, val, icon }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-[32px] h-36 flex flex-col justify-between group hover:bg-white/10 transition-all">
    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40 group-hover:text-emerald-400 transition-colors">{icon}</div>
    <div>
      <p className="text-[9px] font-bold text-white/20 uppercase mb-1 tracking-wider">{title}</p>
      <p className="text-xl font-black text-white italic tracking-tighter">{val}</p>
    </div>
  </div>
);

const KistRow = ({ name, amount }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-[20px] flex items-center justify-center font-black text-white/60 italic">{name[0]}</div>
      <div>
        <p className="font-bold text-white tracking-tight">{name}</p>
        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Daily Collection • Pending</p>
      </div>
    </div>
    <p className="font-black text-white italic text-lg tracking-tighter">₹{amount.toLocaleString()}</p>
  </div>
);

export default Home;