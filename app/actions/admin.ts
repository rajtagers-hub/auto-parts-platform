'use server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ========== FETCH ==========
export async function getUsers() {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('getUsers error:', err);
    return [];
  }
}

export async function getParts() {
  try {
    const { data, error } = await supabaseAdmin
      .from('parts')
      .select('*, users!seller_id(name)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  } catch (err) {
    console.error('getParts error:', err);
    return [];
  }
}

export async function getSecuritySettings() {
  try {
    let { data, error } = await supabaseAdmin
      .from('security_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    if (!data) {
      const defaultSettings = {
        id: 1,
        mfa_required: false,
        session_timeout: 30,
        ip_whitelist: [],
        blocked_ips: [],
        auto_suspend_debt_days: 30,
        auto_hide_listings_on_debt: true,
      };
      // Insert default row
      await supabaseAdmin.from('security_settings').insert(defaultSettings);
      data = defaultSettings;
    }

    // Convert snake_case to camelCase
    return {
      id: data.id,
      mfaRequired: data.mfa_required,
      sessionTimeout: data.session_timeout,
      ipWhitelist: data.ip_whitelist || [],
      blockedIPs: data.blocked_ips || [],
      autoSuspendDebtDays: data.auto_suspend_debt_days,
      autoHideListingsOnDebt: data.auto_hide_listings_on_debt,
    };
  } catch (err) {
    console.error('getSecuritySettings error:', err);
    // Fallback defaults (camelCase)
    return {
      id: 1,
      mfaRequired: false,
      sessionTimeout: 30,
      ipWhitelist: [],
      blockedIPs: [],
      autoSuspendDebtDays: 30,
      autoHideListingsOnDebt: true,
    };
  }
}

// ========== MUTATIONS ==========
export async function updateUserStatus(userId: string, newStatus: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No user returned after update');
    revalidatePath('/admin');
    return { success: true, updatedUser: data[0] };
  } catch (err: any) {
    console.error('[updateUserStatus]', err);
    throw new Error(err.message || 'Failed to update status');
  }
}

export async function verifyUserLicense(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ license_verified: true })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { success: true };
}

export async function markDebtPaid(userId: string, amount: number) {
  try {
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      amount,
      method: 'Manual',
      description: 'Admin marked debt as paid',
      recorded_by: 'admin'
    });
  } catch (err) {
    console.warn('Payments insert failed (table may be missing):', err);
  }
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
  revalidatePath('/admin');
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
  const { error } = await supabaseAdmin
    .from('security_settings')
    .upsert(dbSettings);
  if (error) {
    console.error('updateSecuritySettings error:', error);
    return { success: true };
  }
  revalidatePath('/admin');
  return { success: true };
}

export async function updatePartStatus(partId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('parts')
    .update({ status })
    .eq('id', partId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
  return { success: true };
}