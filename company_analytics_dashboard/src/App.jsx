import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Sentiment from './components/Sentiment';
import Resolution from './components/Resolution';

function App() {
  const [activePage, setActivePage] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      {activePage === 'overview' && <Dashboard activePage={activePage} setActivePage={setActivePage} />}
      {activePage === 'sentiment' && <Sentiment activePage={activePage} setActivePage={setActivePage} />}
      {activePage === 'resolution' && <Resolution activePage={activePage} setActivePage={setActivePage} />}
    </div>
  );
}

export default App;
