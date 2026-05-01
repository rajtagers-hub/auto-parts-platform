import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Delete user's parts, payments, and user row
    await supabaseAdmin.from('parts').delete().eq('seller_id', userId);
    await supabaseAdmin.from('payments').delete().eq('user_id', userId);
    await supabaseAdmin.from('deletion_requests').delete().eq('user_id', userId);
    await supabaseAdmin.from('users').delete().eq('id', userId);

    // Delete from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Delete User]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
