import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Phone, ChevronRight, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { getClients } from '../services/api';

const Clients = ({ onSelectClient, onAddClient }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await getClients();
        setClients(data);
        console.log("Fetched Clients:", data);
      } catch (error) {
        console.error("Failed to fetch clients", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter logic: Checks if name or phone includes the search term
  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 pt-12 pb-32">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase leading-none">My Clients</h2>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Active Profiles</p>
        </div>
        {/* Updated Button with Redirect */}
        <button
          onClick={onAddClient}
          className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
        >
          <UserPlus size={18} />
        </button>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-[24px] text-white outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-white/20 italic text-xs uppercase tracking-widest">Loading Ledger...</p>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientCard
              key={client._id}
              name={client.name}
              phone={client.phone}
              loans={client.loans} // This now uses your new schema variable
              status={client.trustStatus}
              onView={() => onSelectClient(client)}
            />
          ))
        ) : (
          <p className="text-center text-white/20 italic text-xs uppercase tracking-widest">No Clients Found</p>
        )}
      </div>
    </motion.div>
  );
};

const ClientCard = ({ name, phone, loans, status, onView }) => (
  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[32px] group">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-[18px] border border-white/10 flex items-center justify-center font-black text-xl text-white/80 italic">
          {name[0]}
        </div>
        <div>
          <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tighter">{name}</h4>
          <div className="flex items-center gap-1 text-white/30 mt-1">
            <Phone size={10} />
            <span className="text-[10px] font-bold">{phone}</span>
          </div>
        </div>
      </div>
      <button className="p-2 text-white/20"><MoreVertical size={20} /></button>
    </div>

    <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center">
      <div className="flex gap-4">
        <div>
          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Active Loans</p>
          <p className="text-sm font-black text-white italic">{loans} Landings</p>
        </div>
      </div>
      <button
        onClick={onView}
        className="bg-white/10 p-3 rounded-2xl border border-white/10 text-white active:scale-90 transition-all cursor-pointer shadow-lg"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  </div>
);

export default Clients;