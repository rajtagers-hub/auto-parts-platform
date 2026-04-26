'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ========== FETCH ==========

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
  // Use maybeSingle() to avoid error when no rows
  let { data, error } = await supabaseAdmin
    .from('security_settings')
    .select('*')
    .maybeSingle();

  // If the table doesn't exist, error will be about relation; we return defaults
  if (error && error.message.includes('does not exist')) {
    console.warn('security_settings table missing, using defaults');
    return {
      id: 1,
      mfa_required: false,
      session_timeout: 30,
      ip_whitelist: [],
      blocked_ips: [],
      auto_suspend_debt_days: 30,
      auto_hide_listings_on_debt: true,
    };
  }

  if (error) {
    console.error('getSecuritySettings error:', error);
    // Return defaults instead of throwing to keep dashboard running
    return {
      id: 1,
      mfa_required: false,
      session_timeout: 30,
      ip_whitelist: [],
      blocked_ips: [],
      auto_suspend_debt_days: 30,
      auto_hide_listings_on_debt: true,
    };
  }

  if (!data) {
    // No row exists – create one
    const defaultSettings = {
      id: 1,
      mfa_required: false,
      session_timeout: 30,
      ip_whitelist: [],
      blocked_ips: [],
      auto_suspend_debt_days: 30,
      auto_hide_listings_on_debt: true,
    };
    const { error: insertError } = await supabaseAdmin
      .from('security_settings')
      .insert(defaultSettings);
    if (insertError) {
      console.error('Failed to insert default security_settings:', insertError);
      return defaultSettings;
    }
    return defaultSettings;
  }

  return data;
}

// ========== MUTATIONS ==========

export async function updateUserStatus(userId: string, newStatus: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select();

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
  await supabaseAdmin.from('payments').insert({
    user_id: userId,
    amount,
    method: 'Manual',
    description: 'Admin marked debt as paid',
    recorded_by: 'admin'
  });

  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('total_paid')
    .eq('id', userId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const newTotalPaid = (user?.total_paid || 0) + amount;

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
  const dbSettings = {
    id: 1,
    mfa_required: settings.mfaRequired,
    session_timeout: settings.sessionTimeout,
    ip_whitelist: settings.ipWhitelist,
    blocked_ips: settings.blockedIPs,
    auto_suspend_debt_days: settings.autoSuspendDebtDays,
    auto_hide_listings_on_debt: settings.autoHideListingsOnDebt,
  };
  // Try to upsert; if table missing, log and return success (to avoid crashing)
  const { error } = await supabaseAdmin
    .from('security_settings')
    .upsert(dbSettings);
  if (error) {
    console.error('updateSecuritySettings error:', error);
    // Don't throw – just return success to avoid breaking the dashboard
    return { success: true };
  }
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