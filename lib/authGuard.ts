import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Verifies the current request is from an authenticated Admin user.
 * Returns the user object if authorized, or null if not.
 */
export async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // Verify user_type is Admin in the database
    const { data: profile } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'Admin') return null;

    return user;
  } catch {
    return null;
  }
}

/**
 * Verifies the current request is from any authenticated user.
 * Returns the user object if authenticated, or null if not.
 */
export async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return user;
  } catch {
    return null;
  }
}
