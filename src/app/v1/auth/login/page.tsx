'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProviders, signIn } from 'next-auth/react';
import { AuthButton, AuthInput, SocialButton } from '../../components/auth-ui';

export default function V1Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  React.useEffect(() => {
    getProviders()
      .then((providers) => setGoogleEnabled(Boolean(providers?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center p-6 font-sans">
      
      {/* Background Hero Layer */}
      <div className="absolute inset-0 z-0 opacity-20 contrast-150 grayscale">
        <img 
          src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Auth Card */}
      <div className="relative z-20 w-full max-w-lg bg-black/60 backdrop-blur-2xl border border-[#EEFF00]/10 p-12 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <div className="space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-[#EEFF00] tracking-tighter uppercase italic">Welcome Back</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Accessing ECHUU Mainframe</p>
          </div>

          <div className="space-y-6">
            <AuthInput
              label="User Identification"
              type="email"
              placeholder="NEURAL_LINK@ECHUU.AI"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <AuthInput
              label="Access Code"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <div className="text-xs text-red-400 font-bold">{error}</div>
            )}
            <AuthButton
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  const res = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                    callbackUrl: '/zh',
                  });
                  if (!res || res.error) {
                    setError('邮箱或密码不正确');
                    return;
                  }
                  router.push(res.url || '/zh');
                } catch {
                  setError('登录请求失败，请稍后重试');
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? 'Logging In…' : 'Decrypt & Login'}
            </AuthButton>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-white/10"><span className="bg-transparent px-4">Secure Gateway</span></div>
          </div>

          <SocialButton 
            icon="/v1-assets/fills/774627be89a12b5733ec566d9e28cb7cbdead78d.png" 
            label="Google Authentication" 
            disabled={!googleEnabled}
            onClick={() => signIn('google', { callbackUrl: '/zh' })}
          />
          {!googleEnabled && (
            <div className="text-[10px] text-white/40 text-center">
              未检测到 Google OAuth 配置，请设置 `GOOGLE_CLIENT_ID/SECRET` 和 `NEXTAUTH_URL`。
            </div>
          )}

          <p className="text-center text-xs font-bold uppercase tracking-widest text-white/30">
            No profile detected? <Link href="/v1/auth/signup" className="text-[#EEFF00] hover:underline underline-offset-4">Register New Link</Link>
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-[#EEFF00]/5 rounded-full z-0 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] border border-[#EEFF00]/5 rounded-full z-0 pointer-events-none animate-pulse" />
    </div>
  );
}
