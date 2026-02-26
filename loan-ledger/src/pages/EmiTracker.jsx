import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, Filter, X, Loader2, Calendar, ArrowDownAz, IndianRupee, AlertCircle } from 'lucide-react';
import { getCollections, recordPayment } from '../services/api';

const EmiTracker = () => {
    const [activeTab, setActiveTab] = useState('EMI');
    const [showFilter, setShowFilter] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [sortType, setSortType] = useState('Due Date');
    const [actionModal, setActionModal] = useState({ type: null, loan: null, amount: '' });

    const fetchLiveCollections = async () => {
        setLoading(true);
        try {
            const { data } = await getCollections(activeTab, sortType);
            setCollections(data);
        } catch (error) {
            console.error("Collection Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveCollections();
    }, [activeTab, sortType]);

    const closeModal = () => setActionModal({ type: null, loan: null, amount: '' });

    const handleConfirmAction = async () => {
        try {
            const payload = {
                amount: Number(actionModal.amount),
                note: actionModal.type === 'received' ? 'Full Day Collection' : 'Custom Payment'
            };

            await recordPayment(actionModal.loan._id, payload);
            closeModal();
            fetchLiveCollections();
        } catch (error) {
            alert("Payment failed: " + (error.response?.data?.message || "Server Error"));
        }
    };

    return (
        <div className="p-6 pt-12 pb-32 max-w-md mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-50">
                <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase leading-none">Collections</h2>
                <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`p-3 rounded-2xl border transition-all duration-300 ${showFilter ? 'bg-emerald-500 border-emerald-500 text-[#1A1A2E]' : 'bg-white/10 border-white/10 text-white/60'}`}
                >
                    {showFilter ? <X size={18} /> : <Filter size={18} />}
                </button>
            </div>

            {/* Filter Drawer */}
            <AnimatePresence>
                {showFilter && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-24 left-6 right-6 z-40 bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[32px] shadow-2xl">
                        <div className="grid grid-cols-2 gap-3">
                            <FilterOption icon={<Calendar size={14} />} label="Due Date" active={sortType === 'Due Date'} onClick={() => { setSortType('Due Date'); setShowFilter(false); }} />
                            <FilterOption icon={<ArrowDownAz size={14} />} label="Name" active={sortType === 'Name'} onClick={() => { setSortType('Name'); setShowFilter(false); }} />
                            <FilterOption icon={<IndianRupee size={14} />} label="Highest" active={sortType === 'Highest'} onClick={() => { setSortType('Highest'); setShowFilter(false); }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tab Switcher */}
            <div className="bg-white/5 p-1.5 rounded-[24px] border border-white/10 flex mb-10 relative z-10">
                <button onClick={() => setActiveTab('EMI')} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'EMI' ? 'bg-white text-[#1A1A2E] shadow-xl' : 'text-white/40'}`}>Daily EMIs</button>
                <button onClick={() => setActiveTab('FIXED')} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'FIXED' ? 'bg-white text-[#1A1A2E] shadow-xl' : 'text-white/40'}`}>Fixed Loans</button>
            </div>

            <div className="space-y-6 relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-3">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Syncing...</p>
                    </div>
                ) : collections.length > 0 ? (
                    collections.map(loan => (
                        <CollectionItem
                            key={loan._id}
                            name={loan.clientId?.name}
                            currentDue={loan.currentDue}
                            baseAmount={loan.baseAmount}
                            isFixed={activeTab === 'FIXED'}
                            isOverdue={loan.isOverdue}
                            onAction={(type) => setActionModal({
                                type,
                                loan,
                                amount: loan.currentDue
                            })}
                        />
                    ))
                ) : (
                    <div className="text-center pt-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Check className="text-emerald-500/20" size={24} />
                        </div>
                        <p className="text-white/20 italic uppercase font-black text-[10px] tracking-widest">
                            All {activeTab} collections are up to date
                        </p>
                    </div>
                )}
            </div>

            {/* CUSTOM ACTION MODAL */}
            <AnimatePresence>
                {actionModal.type && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1A2E]/95 backdrop-blur-xl">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-sm bg-white/10 border border-white/20 rounded-[40px] p-8 shadow-2xl relative">
                            <button onClick={closeModal} className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"><X size={24} /></button>

                            <h3 className="text-2xl font-black text-white italic mb-1 tracking-tighter uppercase leading-none">
                                {actionModal.type === 'received' ? 'Receive Full' : 'Custom Pay'}
                            </h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8 italic">Payment for {actionModal.loan?.clientId?.name}</p>

                            <div className="space-y-6 mb-10">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Enter Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={actionModal.amount}
                                        onChange={(e) => setActionModal({ ...actionModal, amount: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white font-black outline-none focus:border-emerald-500 transition-all text-3xl italic"
                                    />
                                </div>

                                {activeTab === 'EMI' && Number(actionModal.amount) > 0 && (
                                    <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-between">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">Coverage</span>
                                        <span className="text-xl font-black text-emerald-400 italic">
                                            {Math.floor(actionModal.amount / actionModal.loan.dailyKist)} Days
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 text-[10px] uppercase tracking-widest">Cancel</button>
                                <button onClick={handleConfirmAction} className="flex-[2] py-4 bg-emerald-500 text-[#1A1A2E] font-black rounded-2xl shadow-lg shadow-emerald-500/40 uppercase text-[10px] tracking-[0.2em] italic">Confirm Pay</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CollectionItem = ({ name, currentDue, baseAmount, isFixed, isOverdue, onAction }) => (
    <div className={`bg-white/5 border ${isOverdue ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-white/10'} p-8 rounded-[40px] relative transition-all duration-500`}>
        <div className="flex justify-between items-start mb-10">
            <div className="max-w-[60%]">
                <h4 className="text-2xl font-black text-white italic mb-1 tracking-tighter leading-none uppercase truncate">{name}</h4>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isOverdue ? 'text-rose-500' : 'text-white/20'}`}>
                    {isOverdue ? '⚠️ Overdue' : isFixed ? 'Outstanding' : 'Today\'s Due'}
                </p>
            </div>
            <div className="text-right">
                <p className={`text-3xl font-black italic tracking-tighter leading-none mb-1 ${currentDue === 0 ? 'text-emerald-500' : 'text-white'}`}>
                    ₹{Number(currentDue).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 opacity-60 justify-end">
                    <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.15em]">Base: ₹{baseAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-3">
            <button
                onClick={() => onAction('received')}
                className="flex-[1.5] flex items-center justify-center gap-2 bg-emerald-500 text-[#1A1A2E] py-4 rounded-[24px] text-[10px] font-black uppercase italic tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
            >
                <Check size={18} strokeWidth={3} />
                <span>Receive</span>
            </button>
            <button
                onClick={() => onAction('custom')}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white/60 border border-white/10 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
                <Edit3 size={18} />
                <span>Custom</span>
            </button>
        </div>
    </div>
);

const FilterOption = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${active ? 'bg-white text-[#1A1A2E] border-white shadow-lg' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}>
        {icon} {label}
    </button>
);

export default EmiTracker;