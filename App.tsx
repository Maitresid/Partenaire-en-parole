import React, { useState } from 'react';
import { AppConfig, InteractionMode } from './types';
import { SetupForm } from './components/SetupForm';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);

  const handleStart = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const handleBack = () => {
    setConfig(null);
  };

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <SetupForm onStart={handleStart} />
      </div>
    );
  }

  if (config.mode === InteractionMode.TEXT) {
    return <ChatInterface config={config} onBack={handleBack} />;
  }

  if (config.mode === InteractionMode.SPEECH) {
    return <LiveInterface config={config} onBack={handleBack} />;
  }

  return null;
};

export default App;
