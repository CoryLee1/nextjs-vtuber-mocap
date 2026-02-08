import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? '').toLowerCase().trim();
    const password = String(body?.password ?? '');
    const name = String(body?.name ?? '').trim() || null;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少 6 位' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}

