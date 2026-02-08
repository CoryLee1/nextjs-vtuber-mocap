import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

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

