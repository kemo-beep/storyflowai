import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabaseClient';
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) throw error;
      
      if (data.session || (!isLogin && data.user)) {
         onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
       {/* Background */}
       <div className="absolute inset-0 bg-noise opacity-5 pointer-events-none"></div>
       <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>

       <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
          <button onClick={onBack} className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors">
             <ArrowLeft size={20} />
          </button>

          <div className="text-center mb-8 mt-4">
             <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
             <p className="text-zinc-400 text-sm">
                {isLogin ? 'Sign in to access your projects' : 'Join StoryFlow to start creating'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg text-center">
                 {error}
               </div>
             )}

             <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-3 text-zinc-600" size={16} />
                   <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="you@example.com"
                   />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-3 text-zinc-600" size={16} />
                   <input 
                      type="password" 
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="••••••••"
                   />
                </div>
             </div>

             <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
             </button>
          </form>

          <div className="mt-6 text-center">
             <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
             >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
             </button>
          </div>
       </div>
    </div>
  );
};

export default AuthPage;
