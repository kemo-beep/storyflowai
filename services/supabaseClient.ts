
import { createClient } from '@supabase/supabase-js';
import { Project, StoryData } from '../types';

const SUPABASE_URL = 'https://zwahaobrudnzasifjder.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3YWhhb2JydWRuemFzaWZqZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NjQ4MjMsImV4cCI6MjA4MDE0MDgyM30.t8t0FZ8hhJMcRWXQ_fyPF9eVF5Uw8KdCjMIzcQZkdHY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth ---

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return await supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- Projects ---

// Save Project (Insert or Update)
export const saveProjectToCloud = async (id: string, title: string, content: StoryData): Promise<{ error: any }> => {
  const user = await getCurrentUser();
  if (!user) return { error: "User not logged in" };

  // Save the full content. 
  // Note: audioUrl is now a Base64 Data URI, so it can be saved directly in JSONB.
  // Images (imageData) are also Base64.
  // This assumes the JSON payload fits within Supabase/Postgres limits (approx 100MB+ for JSONB).

  const { error } = await supabase
    .from('projects')
    .upsert({ 
        id, 
        title, 
        content: content, 
        user_id: user.id,
        updated_at: new Date().toISOString() 
    }, { onConflict: 'id' });

  return { error };
};

// Get User's Projects
export const getUserProjects = async (): Promise<{ data: Project[] | null; error: any }> => {
  const user = await getCurrentUser();
  if (!user) return { data: null, error: "User not logged in" };

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return { data: data as Project[], error };
};

// Delete Project
export const deleteProject = async (id: string): Promise<{ error: any }> => {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  return { error };
};
