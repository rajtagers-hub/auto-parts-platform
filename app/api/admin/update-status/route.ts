import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, newStatus } = await request.json();
    if (!userId || !newStatus) {
      return NextResponse.json({ error: 'Missing userId or newStatus' }, { status: 400 });
    }

    console.log('[API] Updating user:', userId, 'to status:', newStatus);

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

    console.log('[API] Update successful:', data[0]);
    return NextResponse.json({ success: true, updatedUser: data[0] });
  } catch (err: any) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}