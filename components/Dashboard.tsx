import React, { useEffect, useState } from 'react';
import { getUserProjects, signOut, deleteProject } from '../services/supabaseClient';
import { Project, User } from '../types';
import { Plus, LayoutGrid, LogOut, Clock, Trash2, Edit3, MonitorPlay } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
  onCreateNew: () => void;
  onEditProject: (project: Project) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onCreateNew, onEditProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await getUserProjects();
    if (data) setProjects(data);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
       await deleteProject(id);
       loadProjects();
    }
  };

  return (
    <div className="min-h-screen bg-black flex font-sans">
       {/* Sidebar */}
       <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/5">
             <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                   <MonitorPlay size={14} className="text-white" />
                </div>
                <span className="font-bold text-white tracking-tight">StoryFlow</span>
             </div>
             <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Workspace</div>
          </div>

          <div className="p-4 flex-1">
             <button className="flex items-center gap-3 w-full px-4 py-2 bg-white/5 text-indigo-400 rounded-lg text-sm font-medium border border-indigo-500/20">
                <LayoutGrid size={16} /> My Projects
             </button>
          </div>

          <div className="p-4 border-t border-white/5">
             <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                   {user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="text-sm font-medium text-white truncate">{user?.email}</div>
                   <div className="text-[10px] text-zinc-500">Free Plan</div>
                </div>
             </div>
             <button 
                onClick={async () => { await signOut(); onLogout(); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg text-xs font-medium transition-colors"
             >
                <LogOut size={14} /> Sign Out
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
             <h1 className="text-2xl font-bold text-white">My Projects</h1>
             <button 
                onClick={onCreateNew}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5"
             >
                <Plus size={16} /> New Project
             </button>
          </header>

          {loading ? (
             <div className="flex items-center justify-center h-64 text-zinc-500 text-sm animate-pulse">Loading workspace...</div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                {/* Create New Card */}
                <button 
                   onClick={onCreateNew}
                   className="group aspect-video rounded-xl border border-dashed border-zinc-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center transition-all cursor-pointer"
                >
                   <div className="h-12 w-12 rounded-full bg-zinc-900 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-colors">
                      <Plus size={24} className="text-zinc-600 group-hover:text-indigo-400" />
                   </div>
                   <span className="text-sm font-medium text-zinc-500 group-hover:text-indigo-300">Create New Project</span>
                </button>

                {/* Project Cards */}
                {projects.map((project) => (
                   <div 
                      key={project.id} 
                      onClick={() => onEditProject(project)}
                      className="group bg-zinc-900 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all cursor-pointer shadow-sm hover:shadow-xl flex flex-col aspect-video relative"
                   >
                      <div className="flex-1 bg-zinc-950/50 relative overflow-hidden">
                         {/* Thumbnail Preview (Using first scene image if avail) */}
                         {project.content.scenes[0]?.imageData ? (
                            <img src={project.content.scenes[0].imageData} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" alt="" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700">
                               <MonitorPlay size={32} />
                            </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-80" />
                         
                         {/* Hover Actions */}
                         <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                               onClick={(e) => handleDelete(e, project.id)}
                               className="p-1.5 bg-black/60 text-zinc-400 hover:text-red-400 rounded-md backdrop-blur-md border border-white/10"
                               title="Delete"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      </div>

                      <div className="p-4 bg-zinc-900 relative z-10">
                         <h3 className="font-semibold text-zinc-200 truncate pr-4 group-hover:text-white transition-colors">{project.title || 'Untitled Story'}</h3>
                         <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                            <Clock size={10} />
                            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                            <span className="mx-1">•</span>
                            <span>{project.content.scenes.length} Scenes</span>
                         </div>
                      </div>
                   </div>
                ))}

                {projects.length === 0 && (
                   <div className="col-span-full py-12 text-center text-zinc-500">
                      <p>No projects yet. Start creating!</p>
                   </div>
                )}
             </div>
          )}
       </main>
    </div>
  );
};

export default Dashboard;
