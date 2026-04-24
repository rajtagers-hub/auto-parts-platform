import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
  }
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ success: false, error: 'Server config error' }, { status: 500 });
  }
  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  const outcome = await response.json();
  if (outcome.success) {
    return NextResponse.json({ success: true });
  } else {
    let userMessage = 'CAPTCHA verification failed. Please try again.';
    if (outcome['error-codes']?.includes('timeout-or-duplicate')) {
      userMessage = 'The CAPTCHA token expired or was already used. Please try again.';
    }
    return NextResponse.json({ success: false, error: userMessage }, { status: 400 });
  }
}