
import React from 'react';
import { MonitorPlay, Sparkles, Zap, Globe, ArrowRight, Play, Mic, FileText, Layers } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onShowcase: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGetStarted, onShowcase }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Background Ambience - Enhanced */}
      <div className="fixed inset-0 bg-noise opacity-[0.03] pointer-events-none z-0"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-[100%] blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
           <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
              <MonitorPlay size={20} className="text-white fill-white/20" />
           </div>
           <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">StoryFlow</span>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={onLogin} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">Sign In</button>
           <button 
             onClick={onGetStarted} 
             className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:scale-105"
           >
              Get Started
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto pt-16 pb-32 px-6 lg:px-12">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Left: Text Content */}
            <div className="text-left relative z-20">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-indigo-300 mb-8 animate-fade-in backdrop-blur-md shadow-lg shadow-indigo-900/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span>Powered by Gemini 2.5 Flash</span>
               </div>
               
               <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                  <span className="block text-white">Direct your</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">imagination.</span>
               </h1>
               
               <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mb-10 leading-relaxed font-light">
                  Transform raw text into cinematic video stories in seconds. 
                  AI-generated visuals, consistent characters, and professional voiceovers—all in one studio.
               </p>
               
               <div className="flex flex-col sm:flex-row items-start gap-4">
                  <button onClick={onGetStarted} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-1 flex items-center gap-2 group border border-indigo-400/20">
                     Create for Free 
                     <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={onShowcase} className="px-8 py-4 bg-zinc-900/50 hover:bg-zinc-800/50 text-white border border-white/10 hover:border-white/20 rounded-2xl font-semibold text-lg transition-all backdrop-blur-sm flex items-center gap-2">
                     <Play size={18} className="text-zinc-400" /> View Gallery
                  </button>
               </div>
               
               <div className="mt-12 flex items-center gap-4 text-sm text-zinc-500 font-medium">
                  <div className="flex -space-x-2">
                     {[...Array(4)].map((_,i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                           {String.fromCharCode(65+i)}
                        </div>
                     ))}
                  </div>
                  <p>Trusted by 10,000+ creators</p>
               </div>
            </div>

            {/* Right: 3D Illustration */}
            <div className="relative perspective-1000 group hidden lg:block">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 blur-[80px] opacity-20 rounded-full animate-pulse-slow"></div>

                {/* Tilted Interface Container */}
                <div className="relative w-full aspect-[4/3] transition-transform duration-700 ease-out transform rotate-y-[-12deg] rotate-x-[5deg] group-hover:rotate-y-[-8deg] group-hover:rotate-x-[2deg] preserve-3d">
                   
                   {/* Main Glass Panel (The Player) */}
                   <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                      {/* Fake Header */}
                      <div className="h-10 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                         <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                         </div>
                         <div className="ml-4 h-2 w-32 bg-white/10 rounded-full"></div>
                      </div>
                      
                      {/* Fake Content Area */}
                      <div className="flex-1 p-4 flex gap-4">
                         {/* Sidebar */}
                         <div className="w-16 flex flex-col gap-3">
                            {[1,2,3,4].map(i => (
                               <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i * 200}ms` }}></div>
                            ))}
                         </div>
                         {/* Main Viewport */}
                         <div className="flex-1 bg-black/40 rounded-lg border border-white/5 relative overflow-hidden">
                             <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1000&auto=format&fit=crop" alt="Abstract" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                             <div className="absolute bottom-6 left-6 right-6">
                                <div className="h-2 w-3/4 bg-white/20 rounded-full mb-2"></div>
                                <div className="h-2 w-1/2 bg-white/20 rounded-full"></div>
                             </div>
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                             
                             {/* Play Icon Center */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl">
                                <Play size={24} className="text-white ml-1" fill="currentColor" />
                             </div>
                         </div>
                      </div>

                      {/* Fake Timeline */}
                      <div className="h-16 border-t border-white/5 bg-black/20 p-4 flex items-center gap-2">
                         <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/40">
                            <Play size={12} fill="currentColor" className="text-white" />
                         </div>
                         <div className="flex-1 h-8 bg-white/5 rounded-md relative overflow-hidden">
                            <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-indigo-500/30 border-r border-indigo-500"></div>
                         </div>
                      </div>
                   </div>

                   {/* Floating Elements (3D Pop-out) */}
                   <div className="absolute -right-8 top-12 bg-zinc-800/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl transform translate-z-12 animate-float">
                      <div className="flex items-center gap-3 mb-2">
                         <div className="p-1.5 bg-pink-500/20 rounded-lg text-pink-400"><Mic size={16} /></div>
                         <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                      </div>
                      <div className="flex gap-0.5 items-end h-8">
                         {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-1 bg-pink-500 rounded-t-sm" style={{ height: `${Math.random() * 100}%`, opacity: 0.6 + Math.random() * 0.4 }}></div>
                         ))}
                      </div>
                   </div>

                   <div className="absolute -left-8 bottom-20 bg-zinc-800/80 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-2xl transform translate-z-8 animate-float-delayed">
                      <div className="flex items-center gap-3 mb-3">
                         <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400"><FileText size={16} /></div>
                         <div className="text-[10px] font-bold text-zinc-400 uppercase">Script Gen</div>
                      </div>
                      <div className="space-y-2">
                         <div className="h-1.5 w-32 bg-white/20 rounded-full"></div>
                         <div className="h-1.5 w-24 bg-white/10 rounded-full"></div>
                         <div className="h-1.5 w-28 bg-white/10 rounded-full"></div>
                      </div>
                   </div>

                   <div className="absolute -bottom-6 right-12 bg-zinc-800/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl transform translate-z-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-mono text-zinc-300">Rendering Scene 4...</span>
                   </div>

                </div>
            </div>

         </div>

         {/* Feature Grid - Enhanced */}
         <div className="mt-32 lg:mt-48">
             <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold mb-4">Everything needed for viral videos</h2>
                 <p className="text-zinc-500">Powerful tools wrapped in a beautiful interface.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                   icon={<Zap size={24} className="text-amber-400" />}
                   title="Instant Visualization"
                   desc="Input a script, and our AI generates consistent scene visuals in seconds. No prompt engineering required."
                   delay={0}
                />
                <FeatureCard 
                   icon={<Globe size={24} className="text-blue-400" />}
                   title="Multi-Style Rendering"
                   desc="From Anime to Cinematic Realism, choose the perfect look for your narrative with one click."
                   delay={100}
                />
                <FeatureCard 
                   icon={<Layers size={24} className="text-pink-400" />}
                   title="Timeline Editor"
                   desc="Fine-tune every second. Split scenes, regenerate audio, and scrub through the result like a pro."
                   delay={200}
                />
             </div>
         </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm relative z-10 bg-[#050505]">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
             <p>&copy; 2024 StoryFlow AI. All rights reserved.</p>
             <div className="flex gap-6">
                 <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
                 <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
                 <a href="#" className="hover:text-zinc-400 transition-colors">Twitter</a>
             </div>
         </div>
      </footer>

      {/* Styles for 3D Transform */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .translate-z-12 { transform: translateZ(40px); }
        .translate-z-8 { transform: translateZ(30px); }
        .translate-z-4 { transform: translateZ(15px); }
        .rotate-y-12 { transform: rotateY(-12deg); }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateZ(40px); }
          50% { transform: translateY(-10px) translateZ(40px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) translateZ(30px); }
          50% { transform: translateY(-8px) translateZ(30px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite 1s; }
      `}</style>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
  <div 
    className="p-8 rounded-3xl bg-zinc-900/30 border border-white/5 hover:border-white/10 hover:bg-zinc-900/50 transition-all duration-300 hover:-translate-y-1 group"
    style={{ animationDelay: `${delay}ms` }}
  >
     <div className="h-12 w-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/5 group-hover:ring-white/10">
        {icon}
     </div>
     <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
     <p className="text-zinc-400 leading-relaxed text-sm font-light">{desc}</p>
  </div>
);

export default LandingPage;
