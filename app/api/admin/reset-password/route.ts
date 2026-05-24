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

    const { userId, newPassword } = await request.json();
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Missing userId or newPassword' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
      password: newPassword 
    });

    if (error) {
      console.error('[API] Supabase Auth Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
