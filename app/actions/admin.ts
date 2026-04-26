'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ========== FETCH (using admin client to avoid RLS issues) ==========

export async function getUsers() {
  const { data, error } = await supabaseAdmin.from('users').select('*');
  if (error) throw new Error(`getUsers failed: ${error.message}`);
  return data;
}

export async function getParts() {
  const { data, error } = await supabaseAdmin
    .from('parts')
    .select('*, users!seller_id(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`getParts failed: ${error.message}`);
  return data;
}

export async function getSecuritySettings() {
  let { data, error } = await supabaseAdmin
    .from('security_settings')
    .select('*')
    .single();

  // If no settings exist, create default ones
  if (error && error.code === 'PGRST116') {
    const defaultSettings = {
      id: 1,
      mfa_required: false,
      session_timeout: 30,
      ip_whitelist: [],
      blocked_ips: [],
      auto_suspend_debt_days: 30,
      auto_hide_listings_on_debt: true,
    };
    await supabaseAdmin.from('security_settings').insert(defaultSettings);
    const { data: newData } = await supabaseAdmin
      .from('security_settings')
      .select('*')
      .single();
    data = newData;
  } else if (error) {
    throw new Error(`getSecuritySettings failed: ${error.message}`);
  }
  return data;
}

// ========== MUTATIONS ==========

export async function updateUserStatus(userId: string, newStatus: string) {
  try {
    // Update and return the updated row
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select();  // returns the updated record

    if (error) {
      console.error('[updateUserStatus] DB error:', error);
      throw new Error(error.message);
    }
    if (!data || data.length === 0) {
      throw new Error('No user returned after update');
    }

    revalidatePath('/dashboard');
    return { success: true, updatedUser: data[0] };
  } catch (err: any) {
    console.error('[updateUserStatus] caught:', err);
    // Re‑throw so the client sees the exact error
    throw new Error(err.message || 'Unknown error in updateUserStatus');
  }
}

export async function verifyUserLicense(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ license_verified: true })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markDebtPaid(userId: string, amount: number) {
  // Record the payment
  await supabaseAdmin.from('payments').insert({
    user_id: userId,
    amount,
    method: 'Manual',
    description: 'Admin marked debt as paid',
    recorded_by: 'admin'
  });

  // Get current total_paid
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('total_paid')
    .eq('id', userId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const newTotalPaid = (user?.total_paid || 0) + amount;

  // Update user
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      current_debt: 0,
      total_paid: newTotalPaid,
      last_payment_date: new Date().toISOString().split('T')[0]
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateSecuritySettings(settings: any) {
  // Convert camelCase to snake_case for the database
  const dbSettings = {
    id: 1,
    mfa_required: settings.mfaRequired,
    session_timeout: settings.sessionTimeout,
    ip_whitelist: settings.ipWhitelist,
    blocked_ips: settings.blockedIPs,
    auto_suspend_debt_days: settings.autoSuspendDebtDays,
    auto_hide_listings_on_debt: settings.autoHideListingsOnDebt,
  };
  const { error } = await supabaseAdmin
    .from('security_settings')
    .upsert(dbSettings);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updatePartStatus(partId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('parts')
    .update({ status })
    .eq('id', partId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
  return { success: true };
}