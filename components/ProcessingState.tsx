import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  status: string;
  progress: number;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({ status, progress }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-8">
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
        <div className="relative">
           {/* Minimalist Spinner */}
           <svg className="animate-spin h-12 w-12 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      </div>
      
      <h2 className="text-3xl font-light text-white mb-3 tracking-tight">{status}</h2>
      <p className="text-zinc-500 text-sm mb-10 font-mono tracking-wide uppercase">AI Director Active</p>

      {/* Ultra-thin Progress Bar */}
      <div className="w-64 h-px bg-zinc-800 relative overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-white transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 text-[10px] text-zinc-600 font-mono">{Math.round(progress)}%</div>
    </div>
  );
};

export default ProcessingState;