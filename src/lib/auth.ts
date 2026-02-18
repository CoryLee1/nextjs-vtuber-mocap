import type { NextAuthOptions, Adapter } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/**
 * 为 Neon Serverless 冷启动添加重试包装。
 * 第一次连接可能因 compute 挂起而失败，重试 1 次通常就够（唤醒约 1-3 秒）。
 */
function withRetry<T extends Record<string, any>>(adapter: T, maxRetries = 2, delayMs = 2000): T {
  const wrapped = {} as T;
  for (const key of Object.keys(adapter) as (keyof T)[]) {
    const original = adapter[key];
    if (typeof original !== 'function') {
      wrapped[key] = original;
      continue;
    }
    (wrapped as any)[key] = async (...args: any[]) => {
      let lastError: unknown;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await (original as Function).apply(adapter, args);
        } catch (err: any) {
          lastError = err;
          const isConnectionError =
            err?.name === 'PrismaClientInitializationError' ||
            err?.message?.includes("Can't reach database server");
          if (!isConnectionError || attempt === maxRetries) throw err;
          console.warn(`[auth] DB connection failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delayMs}ms…`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      throw lastError;
    };
  }
  return wrapped;
}

const baseAdapter = PrismaAdapter(prisma);
const adapter = withRetry(baseAdapter) as Adapter;

export const authOptions: NextAuthOptions = {
  adapter,
  session: { strategy: 'jwt' },
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password ?? '';
        if (!email) return null;

        let user;
        // authorize 也需要重试（credentials 登录走的不是 adapter）
        for (let i = 0; i < 3; i++) {
          try {
            user = await prisma.user.findUnique({ where: { email } });
            break;
          } catch (err: any) {
            if (i === 2 || !err?.message?.includes("Can't reach database server")) throw err;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
        if (!user) return null;

        // 导入的天使：无密码，仅输入邮箱即可登录
        if (!user.passwordHash) {
          if (password === '') {
            return { id: user.id, email: user.email, name: user.name, image: user.image };
          }
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any)?.id ?? token?.sub ?? null;
        session.user.name = (token as any)?.name ?? session.user.name;
        session.user.email = (token as any)?.email ?? session.user.email;
        // 避免把大图片塞进 JWT/Session，防止响应头过大
        session.user.image = undefined;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        (token as any).id = user.id;
        (token as any).name = user.name ?? null;
        (token as any).email = user.email ?? null;
      }
      if (trigger === 'update' && session) {
        (token as any).name = (session as any).name ?? (token as any).name;
      }
      delete (token as any).picture;
      delete (token as any).image;
      return token;
    },
    async redirect({ url, baseUrl }) {
      // 统一回到 /zh（新手引导页），避免跳到 /v1
      if (url.startsWith(`${baseUrl}/v1`)) {
        return `${baseUrl}/zh`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/zh`;
    },
  },
  pages: {
    signIn: '/v1/auth/login',
  },
};
