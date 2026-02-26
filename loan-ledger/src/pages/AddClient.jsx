import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, MapPin, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { addClient } from '../services/api';

const AddClient = ({ onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    trustStatus: 'High Trust' // Default based on UI
  });

  const handleRegister = async () => {
    if (!formData.name || !formData.phone) {
      alert("Please fill in Name and Phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await addClient(formData);
      if (response.status === 201) {
        // Success: Clear and redirect to Add Loan screen
        onSuccess();
      }
    } catch (error) {
      console.error("Registration failed:", error);
      alert(error.response?.data?.message || "Failed to register client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="px-6 pt-16 pb-32 max-w-md mx-auto min-h-screen relative"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase leading-none">New Client</h2>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-3 italic">Expanding your portfolio</p>
        </div>
        <button
          onClick={onCancel}
          className="p-3 bg-white/5 rounded-[24px] border border-white/10 text-white/40 active:scale-90 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form Section */}
      <div className="space-y-8">
        {/* Full Name */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Full Name</label>
          <div className="relative mt-2">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              placeholder="User Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-3 pl-14 rounded-[30px] text-white outline-none focus:ring-2 focus:ring-[#4ade80]/20 transition-all placeholder:text-white/10 italic font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Phone Number</label>
          <div className="relative mt-2">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 00000 00000"
              className="w-full bg-white/5 border border-white/10 p-3 pl-14 rounded-[30px] text-white outline-none focus:ring-2 focus:ring-[#4ade80]/20 transition-all placeholder:text-white/10 italic font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Area/Address */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Client Area</label>
          <div className="relative mt-2">
            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="e.g. Jaipur, Mansarovar"
              className="w-full bg-white/5 border border-white/10 p-3 pl-14 rounded-[30px] text-white outline-none focus:ring-2 focus:ring-[#4ade80]/20 transition-all placeholder:text-white/10 italic font-medium shadow-inner"
            />
          </div>
        </div>

        {/* Trust Status / Rating */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] ml-2 italic">Trust Assessment</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => setFormData({ ...formData, trustStatus: 'High Trust' })}
              className={`flex items-center justify-center gap-2 p-4 rounded-[22px] border transition-all text-[9px] font-black uppercase tracking-widest ${formData.trustStatus === 'High Trust' ? 'bg-white/10 border-[#4ade80] text-[#4ade80]' : 'bg-white/5 border-white/5 text-white/30'}`}
            >
              <ShieldCheck size={14} /> High Trust
            </button>
            <button
              onClick={() => setFormData({ ...formData, trustStatus: 'Regular' })}
              className={`flex items-center justify-center gap-2 p-4 rounded-[22px] border transition-all text-[9px] font-black uppercase tracking-widest ${formData.trustStatus === 'Regular' ? 'bg-white/10 border-[#4ade80] text-[#4ade80]' : 'bg-white/5 border-white/5 text-white/30'}`}
            >
              <ShieldCheck size={14} /> Regular
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-[#4ade80] text-[#1A1A2E] py-4 rounded-[35px] font-black uppercase tracking-[0.3em] italic text-xs flex items-center justify-center gap-3 shadow-[0_15px_35px_rgba(74,222,128,0.3)] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Register Client <ArrowRight size={18} strokeWidth={3} /></>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


export default AddClient;