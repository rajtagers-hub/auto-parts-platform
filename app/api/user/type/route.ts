import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Create Supabase client using request cookies (for auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  // Get the authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Auth error:', userError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role client (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile error:', profileError);
    return NextResponse.json({ error: 'Profile not found', details: profileError.message }, { status: 404 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ user_type: profile.user_type });
}