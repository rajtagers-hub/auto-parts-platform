"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function DashboardRouter() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    let isMounted = true;
    if (hasRedirected.current) return;

    const checkUser = async () => {
      if (hasRedirected.current) return;
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (isMounted) router.push('/login');
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          if (isMounted) router.push('/login?error=profile_missing');
          return;
        }
        hasRedirected.current = true;
        if (profile.user_type === 'Graveyard') {
          router.push('/dashboard/graveyard');
        } else if (profile.user_type === 'Individual') {
          router.push('/dashboard/individual');
        } else if (profile.user_type === 'Admin') {
          router.push('/admin');
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Dashboard router error:', err);
        if (isMounted) router.push('/login');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Redirecting...</div>;
  }
  return null;
}