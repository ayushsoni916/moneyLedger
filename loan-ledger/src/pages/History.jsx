import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Search, ArrowDownLeft, X, ChevronRight, Loader2 } from 'lucide-react';
import { getLoanHistory } from '../services/api'; // Ensure this is exported in api.js

const History = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. GENERATE DYNAMIC MONTHS
  const generateMonths = () => {
    const months = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      months.push(label);
    }
    return months;
  };

  const monthOptions = generateMonths();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await getLoanHistory(selectedMonth, searchTerm);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedMonth, searchTerm]);

  // Grouping logic for "Today", "Yesterday", etc.
  const groupHistoryByDate = (items) => {
    const groups = {};
    items.forEach(item => {
      const dateLabel = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groups[dateLabel]) groups[dateLabel] = [];
      groups[dateLabel].push(item);
    });
    return groups;
  };

  const groupedHistory = groupHistoryByDate(history);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pt-16 pb-32 max-w-md mx-auto min-h-screen relative">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">History</h2>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3">{selectedMonth}</p>
        </div>
        <button
          onClick={() => setShowCalendar(true)}
          className={`p-4 rounded-2xl border transition-all duration-300 ${showCalendar ? 'bg-emerald-500 border-emerald-500 text-[#1A1A2E]' : 'bg-white/5 border-white/10 text-white/60'}`}
        >
          <CalendarIcon size={22} />
        </button>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input
          type="text"
          placeholder="Search client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[30px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 italic"
        />
      </div>

      <AnimatePresence>
        {showCalendar && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="absolute top-24 left-6 right-6 z-50 bg-brand-dark/95 backdrop-blur-3xl border border-white/20 p-8 rounded-[40px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Timeline Filter</p>
              <button onClick={() => setShowCalendar(false)} className="text-white/40"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {monthOptions.map((month) => (
                <button
                  key={month}
                  onClick={() => { setSelectedMonth(month); setShowCalendar(false); }}
                  className={`flex justify-between items-center p-4 rounded-2xl text-xs font-bold transition-all ${selectedMonth === month ? 'bg-emerald-500 text-[#1A1A2E]' : 'bg-white/5 text-white border border-white/5'}`}
                >
                  {month} <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-12">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        ) : Object.keys(groupedHistory).map(date => (
          <div key={date} className="relative">
            <div className="absolute left-8 top-16 bottom-0 w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-8 pl-2 italic">{date}</p>
            <div className="space-y-5">
              {groupedHistory[date].map((item) => (
                <HistoryItem
                  key={item._id}
                  name={item.clientName}
                  amount={item.amount}
                  type={item.loanType}
                  status={item.paymentType}
                  dateLabel={new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  time={new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  isSettlement={item.status === 'Settled'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const HistoryItem = ({ name, amount, type, status, time, dateLabel, isSettlement }) => (
  <div className={`bg-white/5 backdrop-blur-xl border ${isSettlement ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-white/10'} p-7 rounded-[40px] flex items-center justify-between group shadow-xl relative overflow-hidden transition-all active:scale-[0.98]`}>
    <div className="flex items-center gap-6 relative z-10">
      <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center border ${isSettlement ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/10 border-white/10 text-white/30'}`}>
        <ArrowDownLeft size={24} />
      </div>
      <div>
        <h4 className="font-black text-white text-xl italic leading-none uppercase tracking-tighter">{name}</h4>
        <div className="flex items-center gap-2 mt-2">
          {/* Displaying both Date and Time for better tracking */}
          <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">{dateLabel}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[9px] font-bold text-white/20">{time}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{type}</span>
        </div>
      </div>
    </div>
    <div className="text-right relative z-10">
      <p className="font-black text-white italic text-2xl tracking-tighter">₹{Number(amount).toLocaleString()}</p>
      <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-2 block ${isSettlement ? 'text-emerald-400' : 'text-white/20'}`}>
        {isSettlement ? 'Settlement' : status}
      </span>
    </div>
  </div>
);

export default History;