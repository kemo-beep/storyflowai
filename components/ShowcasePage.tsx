
import React, { useState } from 'react';
import { ArrowLeft, Play, Heart, Share2, MonitorPlay } from 'lucide-react';

interface ShowcasePageProps {
  onBack: () => void;
}

const ShowcasePage: React.FC<ShowcasePageProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Cinematic', 'Anime', 'Documentary', 'Viral'];

  const examples = [
    {
      id: 1,
      title: "The Neon Samurai",
      author: "CyberWanderer",
      style: "Cyberpunk Neon",
      views: "1.2M",
      image: "https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=1000&auto=format&fit=crop",
      tags: ["Cinematic", "Sci-Fi"]
    },
    {
      id: 2,
      title: "Whispers of the Forest",
      author: "NatureLover99",
      style: "Watercolor",
      views: "850K",
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop",
      tags: ["Cinematic", "Fantasy"]
    },
    {
      id: 3,
      title: "Tokyo Drift: 2077",
      author: "SpeedRacer",
      style: "Anime/Manga",
      views: "2.4M",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop",
      tags: ["Anime", "Action"]
    },
    {
      id: 4,
      title: "The Lost Astronaut",
      author: "SpaceXplorer",
      style: "3D Render",
      views: "500K",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
      tags: ["Cinematic", "Sci-Fi"]
    },
    {
      id: 5,
      title: "Cozy Coffee Shop Vibes",
      author: "ChillBeats",
      style: "Pixel Art",
      views: "3.1M",
      image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop",
      tags: ["Viral", "Relaxing"]
    },
    {
      id: 6,
      title: "History of Rome",
      author: "EduTube",
      style: "Oil Painting",
      views: "900K",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1000&auto=format&fit=crop",
      tags: ["Documentary", "Educational"]
    }
  ];

  const filtered = activeFilter === 'All' 
    ? examples 
    : examples.filter(e => e.tags.includes(activeFilter) || e.style.includes(activeFilter));

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-indigo-900/10 to-transparent pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
           <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MonitorPlay size={18} className="text-white" />
           </div>
           <span className="text-xl font-bold tracking-tight">StoryFlow AI</span>
        </div>
        <button onClick={onBack} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
           <ArrowLeft size={16} /> Back to Home
        </button>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-10">
         <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Community Showcase</h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
               Discover what creators are building with StoryFlow. From viral shorts to cinematic masterpieces.
            </p>
         </div>

         {/* Filters */}
         <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {filters.map(filter => (
               <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                     activeFilter === filter 
                       ? 'bg-white text-black border-white' 
                       : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
               >
                  {filter}
               </button>
            ))}
         </div>

         {/* Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item) => (
               <div key={item.id} className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl">
                  {/* Image/Thumbnail */}
                  <div className="aspect-[16/9] relative overflow-hidden">
                     <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                     
                     {/* Play Button Overlay */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
                           <Play size={24} fill="currentColor" className="ml-1" />
                        </div>
                     </div>

                     <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold tracking-wide border border-white/10">
                        {item.style}
                     </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                     <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                           <Play size={10} /> {item.views}
                        </div>
                     </div>
                     <p className="text-sm text-zinc-400 mb-4">by <span className="text-zinc-300">@{item.author}</span></p>
                     
                     <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                        <div className="flex gap-2">
                           {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] text-zinc-500 px-2 py-1 bg-white/5 rounded-full">{tag}</span>
                           ))}
                        </div>
                        <div className="flex gap-3 text-zinc-500">
                           <button className="hover:text-pink-500 transition-colors"><Heart size={16} /></button>
                           <button className="hover:text-blue-400 transition-colors"><Share2 size={16} /></button>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </main>
    </div>
  );
};

export default ShowcasePage;
