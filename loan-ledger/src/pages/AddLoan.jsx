import React, { useEffect, useState } from 'react';
import { Search, ArrowRight, UserPlus, Info, Calendar, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addLoan, getClients } from '../services/api';

const AddLoan = ({ onCancel, onAddClient }) => {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Selection & Form State
  const [selectedClient, setSelectedClient] = useState(null);
  const [loanType, setLoanType] = useState('EMI');
  const [formData, setFormData] = useState({
    principal: '',
    totalRepayable: '',
    days: '',
    dueDate: '',
    startDate: new Date().toISOString().split('T')[0], // Default to Today
    initialPaidAmount: ''
  });

  // Fetch real clients from your MongoDB Atlas cluster
  useEffect(() => {
    const controller = new AbortController(); // Create controller

    const fetchClients = async () => {
      try {
        const { data } = await getClients(controller.signal); // Pass signal
        setClients(data);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error("Error fetching clients:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClients();

    // Cleanup function to abort request if user leaves the screen
    return () => controller.abort();
  }, []);

  // Check if it's an "Import" (Start date is in the past)
  const isImport = new Date(formData.startDate) < new Date().setHours(0, 0, 0, 0);

  // 2. Math for EMI & Profit
  const dailyKist = (formData.totalRepayable && formData.days)
    ? Math.ceil(formData.totalRepayable / formData.days)
    : 0;

  const profit = (formData.totalRepayable && formData.principal)
    ? (formData.totalRepayable - formData.principal)
    : 0;

  const returnPercentage = (formData.principal > 0 && profit > 0)
    ? ((profit / formData.principal) * 100).toFixed(1)
    : 0;

  // Helper inside AddLoan component
  const getFixedDuration = () => {
    if (loanType === 'FIXED' && formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.dueDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  // Calculate how many days have passed since the start date
  const elapsedDays = Math.floor((new Date() - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));
  const expectedEmis = elapsedDays > 0 ? elapsedDays : 0;
  const missedEmis = expectedEmis > (Number(formData.initialPaidAmount) || 0)
    ? expectedEmis - (Number(formData.initialPaidAmount) || 0)
    : 0;

  const remainingBalance = Number(formData.totalRepayable) - (loanType === 'EMI'
    ? (Number(formData.initialPaidAmount) * dailyKist)
    : Number(formData.initialPaidAmount));

  // 3. Handle Submission to API
  const handleSubmit = async () => {
    if (!formData.principal || !formData.totalRepayable) {
      alert("Please enter Principal and Total Return.");
      return;
    }

    if (loanType === 'FIXED' && !formData.dueDate) {
      alert("Error: Please set a Target Due Date for Fixed Loans.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId: selectedClient._id,
        type: loanType,
        principal: Number(formData.principal),
        totalRepayable: Number(formData.totalRepayable),
        dailyKist: loanType === 'EMI' ? dailyKist : null,
        dueDate: loanType === 'FIXED' ? formData.dueDate : null,
        startDate: formData.startDate,
        initialPaidAmount: Number(formData.initialPaidAmount) || 0,
        // Map 'days' only for EMI to avoid NaN in the 
        ...(loanType === 'EMI' && {
          days: Number(formData.days),
          dailyKist: dailyKist
        }),
        ...(loanType === 'FIXED' && {
          dueDate: formData.dueDate
        })
      };

      await addLoan(payload);
      onCancel();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create loan");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic for the selection list
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl overflow-y-auto">
      <div className="p-6 pb-32 max-w-md mx-auto min-h-screen">

        {/* Step Indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (

            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
              <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic text-center">Select Client for Landing</p>

              {/* Search & Add New Client Row */}
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="text"
                    placeholder="Search..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-[#4ade80]/20 transition-all italic text-sm"
                  />
                </div>
                {/* REDIRECT BUTTON: Moves to AddClient Screen */}
                <button
                  onClick={onAddClient}
                  className="p-3 bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] rounded-[24px] active:scale-90 transition-all shadow-lg"
                >
                  <UserPlus size={18} />
                </button>
              </div>

              {/* Client Selection List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <Loader2 className="animate-spin text-[#4ade80]" size={24} />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Accessing Ledger...</p>
                  </div>
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      key={client._id}
                      onClick={() => {
                        setSelectedClient(client);
                        setStep(2); // Move to amount/EMI config
                      }}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-white/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-[18px] border border-white/10 flex items-center justify-center font-black text-white/60 italic">
                          {client.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="font-black text-white italic text-lg leading-none uppercase tracking-tighter">{client.name}</p>
                          <p className="text-[10px] font-bold text-white/20 mt-1 tracking-widest">{client.phone}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-[#4ade80] transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10 bg-white/5 rounded-[32px] border border-white/5 border-dashed">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">No matching clients found</p>
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            <motion.div key="step2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
              <h2 className="text-3xl font-black italic mb-1 text-white uppercase tracking-tighter leading-none">Loan Details</h2>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 italic">Landing for {selectedClient?.name}</p>

              <div className="space-y-6">
                <div className="bg-white/5 p-1.5 rounded-[24px] border border-white/10 flex">
                  <button onClick={() => setLoanType('EMI')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${loanType === 'EMI' ? 'bg-white text-[#1A1A2E] shadow-xl' : 'text-white/40'}`}>Daily EMI</button>
                  <button onClick={() => setLoanType('FIXED')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${loanType === 'FIXED' ? 'bg-white text-[#1A1A2E] shadow-xl' : 'text-white/40'}`}>Fixed Loan</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-3">Principal</label>
                    <input type="number" placeholder="10000" value={formData.principal} onChange={(e) => setFormData({ ...formData, principal: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 px-4 mt-2 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 italic font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-3">Total Return</label>
                    <input type="number" placeholder="12040" value={formData.totalRepayable} onChange={(e) => setFormData({ ...formData, totalRepayable: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 px-4 mt-2 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 italic font-bold" />
                  </div>
                </div>

                {/* Start Date & Import Logic */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-3">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 px-4 mt-2 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold" />
                  </div>

                  {isImport && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <label className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] ml-3">Already Paid</label>
                      <input
                        type="number"
                        placeholder={loanType === 'EMI' ? "Total EMIs" : "Total ₹ Paid"}
                        value={formData.initialPaidAmount}
                        onChange={(e) => setFormData({ ...formData, initialPaidAmount: e.target.value })}
                        className="w-full bg-white/10 border border-emerald-500/30 p-3 px-4 mt-2 rounded-[28px] text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold italic"
                      />
                    </motion.div>
                  )}
                </div>

                {loanType === 'EMI' ? (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-3">Duration (Days)</label>
                    <input type="number" placeholder="70" value={formData.days} onChange={(e) => setFormData({ ...formData, days: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 px-4 mt-2 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 italic font-bold" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-3">Target Due Date</label>
                    <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-white/5 border border-white/10 p-3 px-4 mt-2 rounded-[28px] text-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold" />
                  </div>
                )}

                <div className="p-6 px-7 bg-emerald-500/10 border border-emerald-500/20 rounded-[40px] shadow-inner space-y-4">
                  {/* Top Row: Primary Calculation */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">
                      {loanType === 'EMI' ? 'Daily Collection' : 'Net Principal'}
                    </span>
                    <span className="text-3xl font-black text-emerald-400 italic tracking-tighter">
                      ₹ {loanType === 'EMI' ? dailyKist : Number(formData.principal).toLocaleString()}
                    </span>
                  </div>

                  {/* NEW: Fixed Loan Summary Info */}
                  {loanType === 'FIXED' && (
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-500/5">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Duration</p>
                      <p className="text-xs font-black text-white italic">{getFixedDuration()} Days</p>
                    </div>
                  )}

                  {/* Middle Row: Import Insights (Only shows if it's an import) */}
                  {isImport && (
                    <div className="pt-3 border-t border-emerald-500/10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Received</p>
                        <p className="text-xs font-black text-emerald-400 italic">
                          ₹ {(loanType === 'EMI' ? (formData.initialPaidAmount * dailyKist) : formData.initialPaidAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">To Get</p>
                        <p className="text-xs font-black text-white italic">₹ {remainingBalance.toLocaleString()}</p>
                      </div>

                      {loanType === 'EMI' && (
                        <>
                          <div>
                            <p className="text-[8px] font-black text-rose-400/50 uppercase tracking-widest mb-1">Missed EMIs</p>
                            <p className="text-xs font-black text-rose-400 italic">{missedEmis} Days</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-emerald-400/50 uppercase tracking-widest mb-1">Pending</p>
                            <p className="text-xs font-black text-white italic">{(Number(formData.days) - (Number(formData.initialPaidAmount) || 0))} Days</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bottom Row: Profit Summary */}
                  <div className="pt-3 border-t border-emerald-500/10 flex justify-between items-center">
                    <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest italic">
                      Projected Profit: ₹ {profit.toLocaleString()} ({returnPercentage}%)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-[30px] border border-white/10 uppercase text-[10px] tracking-widest">Back</button>
                  <button disabled={submitting} onClick={handleSubmit} className="flex-[2] py-4 bg-emerald-500 text-[#1A1A2E] font-black rounded-[30px] shadow-lg shadow-emerald-500/40 uppercase tracking-[0.2em] italic text-[10px] flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Landing'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
};


export default AddLoan;