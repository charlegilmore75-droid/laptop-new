import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
  lang: z.enum(['ar', 'en']).default('ar'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, confirmPassword, lang } = schema.parse(body);

    const otpSetting = await prisma.siteSettings.findUnique({ where: { key: 'otpEnabled' } });
    const otpEnabled = otpSetting ? otpSetting.value !== 'false' : true;
    if (otpEnabled) {
      return NextResponse.json({ error: 'OTP verification is required' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerified && existing?.passwordHash) {
      return NextResponse.json(
        { error: lang === 'ar' ? 'البريد الإلكتروني مسجل مسبقاً' : 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, emailVerified: new Date() },
      create: { email, passwordHash, emailVerified: new Date() },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, balance: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
