import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) + '...';
  return NextResponse.json({ hasKey, keyPreview });
}