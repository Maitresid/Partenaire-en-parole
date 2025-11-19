import React, { useEffect, useRef, useState } from 'react';
import { AppConfig } from '../types';
import { GeminiLiveService } from '../services/gemini';

interface Props {
  config: AppConfig;
  onBack: () => void;
}

export const LiveInterface: React.FC<Props> = ({ config, onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState('');
  const liveServiceRef = useRef<GeminiLiveService | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Visualizer Logic
  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Dynamic radius based on volume
    // Volume is roughly 0-255.
    const baseRadius = 60;
    const dynamicRadius = baseRadius + (volume / 2);

    // Draw "Pulse"
    ctx.beginPath();
    ctx.arc(centerX, centerY, dynamicRadius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(236, 72, 153, ${Math.min(0.8, volume / 100 + 0.2)})`; // Pink-600 based
    ctx.fill();

    // Draw Core
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#DB2777'; // Pink-600
    ctx.fill();

    // Draw Rings (Animation)
    const time = Date.now() / 1000;
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + 20 + Math.sin(time) * 5, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + 40 + Math.cos(time) * 5, 0, 2 * Math.PI);
    ctx.stroke();

    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(drawVisualizer);
    return () => cancelAnimationFrame(animationRef.current);
  }, [volume]);

  const startSession = async () => {
    try {
      setError('');
      liveServiceRef.current = new GeminiLiveService();
      
      // Hook up volume visualizer
      liveServiceRef.current.onVolumeChange = (vol) => {
        setVolume(vol);
      };

      await liveServiceRef.current.connect(config, () => {
        setIsActive(false);
      });
      setIsActive(true);
    } catch (e) {
      console.error(e);
      setError("Could not access microphone or connect to API.");
      setIsActive(false);
    }
  };

  const endSession = () => {
    liveServiceRef.current?.disconnect();
    setIsActive(false);
    setVolume(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center relative overflow-hidden text-white">
        {/* Back Button */}
        <button onClick={onBack} className="absolute top-6 left-6 z-20 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        {/* Topic Badge */}
        <div className="absolute top-8 z-10 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700">
            <span className="text-sm font-medium text-slate-300">{config.topic || 'Conversation'}</span>
        </div>

        {/* Vocabulary Overlay */}
        <div className="absolute top-24 z-10 flex flex-wrap justify-center gap-2 max-w-sm px-4">
            {config.words.map((w, i) => (
                <span key={i} className="text-xs bg-slate-800/40 text-slate-400 px-2 py-1 rounded border border-slate-700/50">{w}</span>
            ))}
        </div>

        {/* Main Visualizer Area */}
        <div className="flex-1 w-full flex items-center justify-center relative">
            <canvas 
                ref={canvasRef} 
                width={window.innerWidth} 
                height={window.innerHeight * 0.6} 
                className="w-full h-full"
            />
            
            {!isActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
                    <h2 className="text-2xl font-bold mb-6">Ready to speak French?</h2>
                    <button 
                        onClick={startSession}
                        className="px-8 py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-bold text-lg shadow-lg shadow-pink-600/30 transform transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Start Conversation
                    </button>
                </div>
            )}
            
            {error && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20">
                     <p className="text-red-400 mb-4">{error}</p>
                     <button onClick={() => window.location.reload()} className="underline">Retry</button>
                 </div>
            )}
        </div>

        {/* Controls */}
        {isActive && (
            <div className="h-32 w-full flex flex-col items-center justify-center z-20 pb-8">
                <p className="text-slate-400 text-sm mb-4 animate-pulse">Listening...</p>
                <button 
                    onClick={endSession}
                    className="p-4 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        )}
    </div>
  );
};
