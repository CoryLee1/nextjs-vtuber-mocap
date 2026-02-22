'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getProviders, signIn, useSession } from 'next-auth/react';
import LoadingPage from '@/components/ui/LoadingPage';
import OnboardingGuide from '@/components/ui/OnboardingGuide';
import { AuthButton, AuthInput, SocialButton } from '@/app/v1/components/auth-ui';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';
import { preloadCriticalAssets } from '@/lib/preload-critical-assets';
import { ModelManager } from '@/components/vtuber/ModelManager';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
})

export default function HomePageClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const canvasReady = useSceneStore((s) => s.canvasReady);
  const { status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { roomId, setRoom, connect } = useEchuuWebSocket();
  const createdRoomRef = useRef(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [showModelManager, setShowModelManager] = useState(false);
  const [openUploadOnMount, setOpenUploadOnMount] = useState(false);

  // 模拟加载完成后的逻辑
  const handleLoadingComplete = () => {
    setIsLoading(false);
    // 加载完成后，若已登录再显示新手引导
    if (status === 'authenticated') {
      setShowOnboarding(true);
    }
  };

  useEffect(() => {
    if (!isLoading && status === 'authenticated') {
      setShowOnboarding(true);
    }
    if (status !== 'authenticated') {
      setShowOnboarding(false);
    }
  }, [isLoading, status]);

  useEffect(() => {
    getProviders()
      .then((providers) => {
        setGoogleEnabled(Boolean(providers?.google));
      })
      .catch(() => {
        setGoogleEnabled(false);
      });
  }, []);

  // Loading 期间预拉 S3 模型与动画；S3 模型列表返回后结束 loading（无固定时长）
  useEffect(() => {
    preloadCriticalAssets();
    useS3ResourcesStore.getState().loadAll().then(() => {
      handleLoadingComplete();
    });
  }, []);

  // 登录后即分配直播间链接（不依赖 Go Live）：URL 无 room_id 且当前无房间时自动 createRoom
  useEffect(() => {
    if (isLoading || status !== 'authenticated') return;
    const urlRoomId = searchParams?.get('room_id')?.trim();
    if (urlRoomId) return; // 通过链接进房当观众，不创建新房间
    if (roomId) return; // 已有房间（含 useRoomIdFromUrl 已设置）
    if (createdRoomRef.current) return;
    createdRoomRef.current = true;
    import('@/lib/echuu-client').then(({ createRoom }) => {
      createRoom()
        .then((r) => {
          setRoom(r.room_id, r.owner_token);
          connect(r.room_id);
        })
        .catch(() => {
          createdRoomRef.current = false;
        });
    });
  }, [isLoading, status, searchParams, roomId, setRoom, connect]);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* 1. 开屏加载页 */}
      {isLoading && (
        <LoadingPage onComplete={handleLoadingComplete} duration={0} />
      )}

      {/* 2. 主应用 */}
      {!isLoading && (
        <VTuberApp
          onOpenModelManager={() => setShowModelManager(true)}
        />
      )}

      {/* 2.4 模型管理器：由 page 统一渲染，引导页/主应用都只打开此弹窗，不 redirect */}
      {showModelManager && (
        <ModelManager
          onClose={() => setShowModelManager(false)}
          onSelect={(model: any) => {
            useSceneStore.getState().setVRMModelUrl(model?.url ?? null);
            setShowModelManager(false);
          }}
          initialOpenUpload={openUploadOnMount}
          onInitialOpenUploadConsumed={() => setOpenUploadOnMount(false)}
        />
      )}

      {/* 2.5 登录遮罩（在新手引导之前） */}
      {!isLoading && status !== 'authenticated' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-black/70 border border-[#EEFF00]/20 rounded-[32px] p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="text-[#EEFF00] text-sm font-black uppercase tracking-[0.3em]">
                ECHUU ACCESS
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={authMode === 'login' ? 'text-[#EEFF00]' : 'text-white/40 hover:text-white'}
                >
                  Login
                </button>
                <span className="text-white/20">/</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={authMode === 'signup' ? 'text-[#EEFF00]' : 'text-white/40 hover:text-white'}
                >
                  Register
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {authMode === 'signup' && (
                <AuthInput
                  label="Nickname"
                  type="text"
                  placeholder="ECHUU_USER"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              )}
              <AuthInput
                label="Email Address"
                type="email"
                placeholder="NEURAL_LINK@ECHUU.AI"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <AuthInput
                label="Secret Key"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {authError && <div className="text-xs text-red-400 font-bold">{authError}</div>}

              <AuthButton
                disabled={authLoading}
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthError(null);
                  try {
                    if (authMode === 'signup') {
                      const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email,
                          password,
                          name: nickname,
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setAuthError(data?.error || '注册失败');
                        return;
                      }
                    }

                    try {
                      const result = await signIn('credentials', {
                        email,
                        password,
                        redirect: false,
                        callbackUrl: '/zh',
                      });
                      if (!result || result.error) {
                        setAuthError('邮箱或密码不正确');
                        return;
                      }
                    } catch {
                      setAuthError('登录请求失败，请稍后重试');
                      return;
                    }
                  } finally {
                    setAuthLoading(false);
                  }
                }}
              >
                {authLoading ? 'Loading…' : authMode === 'signup' ? 'Initialize Account' : 'Decrypt & Login'}
              </AuthButton>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-white/20">
                  <span className="bg-transparent px-4">OR</span>
                </div>
              </div>

              <SocialButton
                icon="/v1-assets/fills/774627be89a12b5733ec566d9e28cb7cbdead78d.png"
                label="Google Authentication"
                disabled={!googleEnabled}
                onClick={() => signIn('google', { callbackUrl: '/zh' })}
              />
              {!googleEnabled && (
                <div className="text-[10px] text-white/40">
                  未检测到 Google OAuth 配置，请设置 `GOOGLE_CLIENT_ID/SECRET` 和 `NEXTAUTH_URL`。
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. 新手引导：等 3D 画布和 UI 就绪后再显示，避免人物/界面未加载完就出现步骤 */}
      {showOnboarding && !isLoading && canvasReady && (
        <OnboardingGuide
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
          onStep1Select={() => {
            setOpenUploadOnMount(false);
            setShowModelManager(true);
          }}
          onStep1Upload={() => {
            setOpenUploadOnMount(true);
            setShowModelManager(true);
          }}
        />
      )}
    </main>
  );
}
