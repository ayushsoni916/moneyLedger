import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Edit3, Plus, Trash2, Loader2, AlertCircle, X, Calendar, TrendingUp, Info, Shield } from 'lucide-react';
import { getClientProfile } from '../services/api';

const ClientProfile = ({ client, onBack }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // 1. Fetch live profile and aggregated loan data
  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        const { data } = await getClientProfile(client._id);
        setProfileData(data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, [client._id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Syncing Profile...</p>
      </div>
    );
  }

  const { client: info, loans } = profileData;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="min-h-screen pb-32"
    >
      {/* Pop-up Overlay */}
      <AnimatePresence>
        {selectedLoan && (
          <LoanDetailsModal
            loan={selectedLoan}
            onClose={() => setSelectedLoan(null)}
          />
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="p-6 pt-12 flex justify-between items-center bg-linear-to-b from-white/5 to-transparent">
        <button onClick={onBack} className="p-3 bg-white/10 rounded-2xl border border-white/10 text-white">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-black italic text-white tracking-tighter uppercase">Client File</h2>
        <button className="p-3 bg-white/10 rounded-2xl border border-white/10 text-white">
          <Edit3 size={20} />
        </button>
      </div>

      {/* Bio Section */}
      <div className="p-8 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 bg-white/10 rounded-[32px] border-2 border-emerald-500/50 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
            {info.name[0]}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-brand-dark">
            <Plus size={16} className="text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{info.name}</h3>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1 italic">{info.phone}</p>
        <p className="mt-4 text-xs text-white/60 leading-relaxed max-w-[250px] mx-auto italic">
          High-trust client active since 2026. Prefers daily collections.
        </p>
      </div>

      {/* Loan List */}
      <div className="px-6 space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Active Landings</h4>
          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">
            {loans.length} Active
          </span>
        </div>

        {loans.length > 0 ? (
          loans.map((loan) => (
            <button key={loan._id} className="w-full text-left" onClick={() => setSelectedLoan(loan)}>
              <LoanCard loan={loan} />
            </button>
          ))
        ) : (
          <div className="p-10 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">No active landings found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* --- Detailed Pop-up Component --- */
const LoanDetailsModal = ({ loan, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        className="bg-[#1A1A2E] w-full max-w-md rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest italic mb-1">Detailed Breakdown</p>
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">₹{loan.principal.toLocaleString()}</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40"><X size={20} /></button>
          </div>

          <div className="space-y-4">
            {/* Info Rows */}
            <DetailRow icon={<Calendar size={16} />} label="Start Date" value={new Date(loan.startDate).toLocaleDateString()} />
            <DetailRow icon={<TrendingUp size={16} />} label="Total Repayable" value={`₹${loan.totalRepayable.toLocaleString()}`} />

            {loan.type === 'EMI' && (
              <>
                <DetailRow icon={<Info size={16} />} label="Daily Kist" value={`₹${loan.dailyKist}`} />
                <DetailRow icon={<Calendar size={16} />} label="Total Tenure" value={`${loan.totalDays} Days`} />
              </>
            )}

            {/* Security Note Section */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-3xl mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Security / Collateral</p>
              </div>
              <p className="text-sm font-bold text-white italic">
                {loan.security || "No security provided for this landing."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-white text-[#1A1A2E] font-black rounded-3xl mt-8 uppercase text-[10px] tracking-widest italic active:scale-95 transition-all"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
    <div className="flex items-center gap-3">
      <div className="text-emerald-500">{icon}</div>
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-black text-white italic">{value}</span>
  </div>
);

/* --- Original LoanCard modified to look clickable --- */
const LoanCard = ({ loan }) => {
  const { type, principal, totalRepayable, paidAmount, missedEmis, actualEmisPaid, isDefaulted, totalDays, dueDate } = loan;
  const progress = Math.round((paidAmount / totalRepayable) * 100);

  return (
    <div className={`bg-white/5 backdrop-blur-3xl border ${isDefaulted ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-white/10'} p-6 rounded-[40px] relative transition-all active:scale-[0.98]`}>
      {isDefaulted && (
        <div className="absolute top-4 right-6 bg-rose-500 text-[8px] font-black uppercase px-2 py-1 rounded-md text-white flex items-center gap-1">
          <AlertCircle size={10} /> Overdue
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${isDefaulted ? 'text-rose-400' : 'text-white/30'}`}>
            {loan._id.slice(-6).toUpperCase()}
          </span>
          <h5 className="text-white font-black text-xl italic mt-1 tracking-tighter">
            ₹{principal.toLocaleString()}
            <span className="text-xs font-medium text-white/40 not-italic ml-2 uppercase tracking-widest">({type})</span>
          </h5>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatBox label="Paid" value={type === 'EMI' ? `${actualEmisPaid}/${totalDays}` : `₹${paidAmount}`} color="text-emerald-400" />
        <StatBox label="Missed" value={missedEmis || 0} color={isDefaulted ? "text-rose-400" : "text-white/20"} />
        <StatBox label="Balance" value={`₹${totalRepayable - paidAmount}`} color="text-white" />
      </div>

      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${isDefaulted ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
    <p className="text-[7px] font-black text-white/30 uppercase mb-1 tracking-tighter">{label}</p>
    <p className={`text-[10px] font-black italic tracking-tight truncate ${color}`}>{value}</p>
  </div>
);

export default ClientProfile;