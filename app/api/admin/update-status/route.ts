import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/authGuard';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // SECURITY: Verify caller is authenticated Admin
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, newStatus } = await request.json();
    if (!userId || !newStatus) {
      return NextResponse.json({ error: 'Missing userId or newStatus' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updatedUser: data[0] });
  } catch (err: any) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}