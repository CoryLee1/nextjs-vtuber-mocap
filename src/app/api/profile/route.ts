import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 40) : undefined;
  const image = typeof body?.image === 'string' ? body.image.trim().slice(0, 200000) : undefined; // dataURL 可能较长

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name: name || null } : null),
      ...(image !== undefined ? { image: image || null } : null),
    } as any,
  });

  return NextResponse.json({ ok: true });
}

