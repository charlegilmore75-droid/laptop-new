import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['SET', 'ADD', 'SUBTRACT']),
  amount: z.number().min(0),
  description: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, amount, description } = schema.parse(body);

    const currentWallet = await prisma.wallet.findUnique({ where: { userId: params.id } });

    let newBalance: number;
    let txAmount: number;
    let txType: string;

    if (action === 'SET') {
      newBalance = amount;
      txAmount = amount - (currentWallet?.balance || 0);
      txType = 'admin_adjust';
    } else if (action === 'ADD') {
      newBalance = (currentWallet?.balance || 0) + amount;
      txAmount = amount;
      txType = 'admin_credit';
    } else {
      newBalance = Math.max(0, (currentWallet?.balance || 0) - amount);
      txAmount = -Math.min(amount, currentWallet?.balance || 0);
      txType = 'admin_debit';
    }

    const wallet = await prisma.wallet.upsert({
      where: { userId: params.id },
      update: { balance: newBalance },
      create: { userId: params.id, balance: newBalance },
    });

    if (txAmount !== 0) {
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: txAmount,
          type: txType,
          description: description || (action === 'SET' ? 'تعديل رصيد من الإدارة' : action === 'ADD' ? 'إضافة رصيد من الإدارة' : 'خصم رصيد من الإدارة'),
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: params.id,
        titleAr: 'تم تعديل رصيد محفظتك',
        titleEn: 'Your wallet balance was updated',
        bodyAr: `رصيدك الحالي: ${newBalance} ل.س`,
        bodyEn: `Current balance: ${newBalance} SYP`,
      },
    });

    return NextResponse.json({ wallet, newBalance });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
