import React from 'react';
import { Home, Repeat, Users, History, Plus } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-6">
      <div className="relative w-full max-w-md">
        
        {/* Floating Action Button - Center Aligned */}
        <button 
          onClick={() => setActiveTab('add')}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-16 h-16 bg-[#4ade80] text-white rounded-full shadow-[0_8px_20px_rgba(74,222,128,0.4)] flex items-center justify-center border-[6px] border-[#1a1a2e] z-50 active:scale-90 transition-transform cursor-pointer"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        {/* Navbar Container */}
        <nav className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] px-2 py-3 shadow-2xl">
          <div className="flex justify-between items-center h-12">
            
            {/* Left Side Items */}
            <div className="flex flex-1 justify-around items-center">
              <NavItem 
                label="Home" 
                icon={<Home size={20} />} 
                active={activeTab === 'home'} 
                onClick={() => setActiveTab('home')} 
              />
              <NavItem 
                label="EMIs" 
                icon={<Repeat size={20} />} 
                active={activeTab === 'emi'} 
                onClick={() => setActiveTab('emi')} 
              />
            </div>

            {/* Crucial Spacer for FAB */}
            <div className="w-20" /> 

            {/* Right Side Items */}
            <div className="flex flex-1 justify-around items-center">
              <NavItem 
                label="Clients" 
                icon={<Users size={20} />} 
                active={activeTab === 'clients'} 
                onClick={() => setActiveTab('clients')} 
              />
              <NavItem 
                label="History" 
                icon={<History size={20} />} 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')} 
              />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavItem = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-300 ${
      active ? 'text-white' : 'text-white/40'
    }`}
  >
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/10 text-[#4ade80]' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold tracking-tight uppercase">
      {label}
    </span>
  </button>
);

export default Navbar;