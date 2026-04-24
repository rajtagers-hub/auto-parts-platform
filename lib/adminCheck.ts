import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function isAdmin(req: NextRequest): Promise<boolean> {
  // First, get the authenticated user via cookies (regular client)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Use service role to fetch user_type (bypass RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();
  if (error) {
    console.error('isAdmin error:', error);
    return false;
  }
  return profile?.user_type === 'Admin';
}