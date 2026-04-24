import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's license file path from the users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('business_license')
      .eq('id', user.id)
      .single();
    if (profileError || !profile?.business_license) {
      return NextResponse.json({ error: 'No license found' }, { status: 404 });
    }

    // Extract the file path from the URL (e.g., "licenses/filename.jpg")
    const url = new URL(profile.business_license);
    const filePath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));

    // Use service role to generate signed URL
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: signedUrlData, error: signedError } = await supabaseAdmin.storage
      .from('licenses')
      .createSignedUrl(filePath, 60); // valid for 60 seconds

    if (signedError || !signedUrlData) {
      return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });
  } catch (err: any) {
    console.error('License URL error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}