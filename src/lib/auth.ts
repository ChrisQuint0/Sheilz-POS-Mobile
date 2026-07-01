import { supabase } from './supabase';
import { AuthProfile } from '../store/usePOSStore';

// Fetches the profiles row for a given auth user id and validates it's Active.
// Returns null (and signs the session back out) if the profile is missing,
// unreadable, or inactive — used by both LoginScreen and boot-time session restore.
export async function resolveProfile(userId: string): Promise<AuthProfile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, status')
    .eq('id', userId)
    .single();

  if (error || !profile || profile.status !== 'Active') {
    await supabase.auth.signOut();
    return null;
  }

  return { id: profile.id, display_name: profile.display_name, role: profile.role };
}