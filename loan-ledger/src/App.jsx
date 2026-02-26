import React, { useState } from 'react';
import Home from './pages/Home';
import EmiTracker from './pages/EmiTracker';
import Navbar from './components/Navbar';
import Clients from './pages/Clients';
import AddLoan from './pages/AddLoan';
import AddClient from './pages/AddClient'; // New Import
import ClientProfile from './pages/ClientProfile';
import History from './pages/History';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [viewingClient, setViewingClient] = useState(null);

  const renderScreen = () => {
    if (viewingClient) {
      return <ClientProfile client={viewingClient} onBack={() => setViewingClient(null)} />;
    }

    switch (activeTab) {
      case 'home':
        return <Home onSeeToday={() => setActiveTab('emi')} />;
      case 'emi':
        return <EmiTracker />;
      case 'clients':
        return (
          <Clients
            onSelectClient={(client) => setViewingClient(client)}
            onAddClient={() => setActiveTab('add-client')} // Redirect to AddClient
          />
        );
      case 'history':
        return <History />;
      case 'add':
        return (
          <AddLoan
            onCancel={() => setActiveTab('home')}
            onAddClient={() => setActiveTab('add-client')} // Pass the redirect function here
          />
        );
      case 'add-client':
        return (
          <AddClient
            onCancel={() => setActiveTab('clients')}
            onSuccess={() => setActiveTab('add')} // After adding client, go to Add Loan
          />
        );
      default:
        return <Home onSeeToday={() => setActiveTab('emi')} />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-x-hidden bg-[#1A1A2E]">
      <main className="relative z-10">
        {renderScreen()}
      </main>

      {!viewingClient && activeTab !== 'add-client' && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export default App;