import React, { useState } from 'react';
import { AppConfig, ProficiencyLevel, InteractionMode } from '../types';

interface Props {
  onStart: (config: AppConfig) => void;
}

export const SetupForm: React.FC<Props> = ({ onStart }) => {
  const [level, setLevel] = useState<ProficiencyLevel>(ProficiencyLevel.A1);
  const [wordsInput, setWordsInput] = useState('maison, chat, manger, aimer, le livre');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.TEXT);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const words = wordsInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    if (words.length < 1) {
      setError("Please provide at least a few words.");
      return;
    }

    onStart({
      level,
      words,
      topic: topic || 'Daily Life',
      mode
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 mt-10">
      <div className="bg-indigo-600 p-6 text-center">
        <h1 className="text-2xl font-bold text-white">Partenaire en Parole</h1>
        <p className="text-indigo-100 text-sm mt-2">Your AI French Tutor</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        
        {/* Proficiency Level */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Proficiency Level</label>
          <div className="flex gap-4">
            {[ProficiencyLevel.A1, ProficiencyLevel.A2].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  level === l 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Vocabulary List */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Vocabulary List <span className="text-xs text-slate-400 font-normal">(Comma separated)</span>
          </label>
          <textarea
            value={wordsInput}
            onChange={(e) => setWordsInput(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            placeholder="e.g., voiture, rouge, conduire..."
          />
        </div>

        {/* Topic (Optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Topic (Optional)</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            placeholder="e.g., At the bakery, Planning a trip"
          />
        </div>

        {/* Interaction Mode */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Interaction Mode</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode(InteractionMode.TEXT)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                mode === InteractionMode.TEXT
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>Text Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setMode(InteractionMode.SPEECH)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                mode === InteractionMode.SPEECH
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
              </svg>
              <span>Live Speech</span>
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-lg hover:bg-slate-800 transform hover:scale-[1.02] transition-all"
        >
          Start Conversation
        </button>
      </form>
    </div>
  );
};
