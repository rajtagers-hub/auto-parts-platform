'use server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

// ---------- FETCH ----------
export async function getUsers() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw new Error(error.message);
  return data;
}

export async function getParts() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('parts')
    .select('*, users!seller_id(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getSecuritySettings() {
  const supabase = await getSupabase();
  let { data, error } = await supabase.from('security_settings').select('*').single();
  if (error && error.code === 'PGRST116') {
    // No row found, insert default
    const defaultSettings = {
      id: 1,
      mfa_required: false,
      session_timeout: 30,
      ip_whitelist: [],
      blocked_ips: [],
      auto_suspend_debt_days: 30,
      auto_hide_listings_on_debt: true,
    };
    await supabase.from('security_settings').insert(defaultSettings);
    const { data: newData } = await supabase.from('security_settings').select('*').single();
    data = newData;
  } else if (error) {
    throw new Error(error.message);
  }
  return data;
}

// ---------- MUTATIONS ----------
export async function updateUserStatus(userId: string, newStatus: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
  if (error) throw new Error(error.message);
  // Correct path: your admin dashboard is at /dashboard
  revalidatePath('/dashboard');
  return { success: true };
}

export async function verifyUserLicense(userId: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('users').update({ license_verified: true }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markDebtPaid(userId: string, amount: number) {
  const supabase = await getSupabase();
  // Insert payment
  await supabase.from('payments').insert({
    user_id: userId,
    amount,
    method: 'Manual',
    description: 'Admin marked debt as paid',
    recorded_by: 'admin'
  });
  // Get total_paid
  const { data: user } = await supabase.from('users').select('total_paid').eq('id', userId).single();
  const newTotalPaid = (user?.total_paid || 0) + amount;
  // Update user
  const { error } = await supabase.from('users').update({
    current_debt: 0,
    total_paid: newTotalPaid,
    last_payment_date: new Date().toISOString().split('T')[0]
  }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateSecuritySettings(settings: any) {
  const supabase = await getSupabase();
  // Transform camelCase keys to snake_case for DB
  const dbSettings = {
    id: 1,
    mfa_required: settings.mfaRequired,
    session_timeout: settings.sessionTimeout,
    ip_whitelist: settings.ipWhitelist,
    blocked_ips: settings.blockedIPs,
    auto_suspend_debt_days: settings.autoSuspendDebtDays,
    auto_hide_listings_on_debt: settings.autoHideListingsOnDebt,
  };
  const { error } = await supabase.from('security_settings').upsert(dbSettings);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updatePartStatus(partId: string, status: string) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('parts').update({ status }).eq('id', partId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}