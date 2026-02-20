'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Upload, 
  Users, 
  Settings,
  Loader2
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';
import type { VRMModel } from '@/types';

interface OnboardingGuideProps {
  onComplete: () => void;
  onSkip: () => void;
  /** 步骤 1「选择模型」：关闭引导并打开模型管理器 */
  onStep1Select?: () => void;
  /** 步骤 1「上传模型」：关闭引导并打开模型管理器且自动打开上传对话框 */
  onStep1Upload?: () => void;
}

const steps = [
  {
    id: 1,
    title: 'SELECT / UPLOAD MODEL',
    description: '选择或上传 .vrm',
    icon: Upload,
    content: '从模型库选择已有模型，或上传新的 VRM 作为直播角色外观。',
    details: 'Want a customized model? Make it from VRoid Studio.',
    actionHref: null as string | null,
  },
  {
    id: 2,
    title: 'CHARACTER PERSONA',
    description: '填写人设背景',
    icon: Users,
    content: '填写角色名字、性格、人设与背景设定。',
    details: 'Define who your VTuber is before going live.',
    actionLabel: '设置角色人设',
    actionHref: '/v1/live/character',
  },
  {
    id: 3,
    title: 'SET STREAM TOPIC',
    description: '设定直播主题',
    icon: Settings,
    content: '输入本场直播的话题与方向。',
    details: 'Once ready, jump into the Stream Room.',
    actionLabel: '进入直播间',
    actionHref: '/v1/live/1',
  }
];

const VROID_STUDIO_URL = 'https://vroid.com/en/studio';

export default function OnboardingGuide({ onComplete, onSkip, onStep1Select, onStep1Upload }: OnboardingGuideProps) {
  const { t, locale } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const [s3Models, setS3Models] = useState<VRMModel[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const [s3Error, setS3Error] = useState(false);
  const currentStep = steps[activeStep];
  const actionHref = currentStep.id === 1 ? `/${locale}` : (currentStep.actionHref ?? null);

  // 步骤 1 时展示 S3 模型列表：优先用 Loading 阶段预拉的缓存
  useEffect(() => {
    if (currentStep.id !== 1) return;
    const store = useS3ResourcesStore.getState();
    if (store.modelsLoaded) {
      setS3Models(store.s3Models);
      setS3Loading(false);
      setS3Error(false);
      return;
    }
    setS3Loading(true);
    setS3Error(false);
    fetch('/api/s3/resources?type=models')
      .then(async (res) => {
        const json = res.ok ? await res.json() : { success: false, data: [] };
        const data = Array.isArray(json?.data) ? json.data : [];
        setS3Models(data);
        if (!res.ok) setS3Error(true);
        useS3ResourcesStore.getState().setS3Models(data);
      })
      .catch(() => {
        setS3Models([]);
        setS3Error(true);
      })
      .finally(() => setS3Loading(false));
  }, [currentStep.id]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* 背景装饰 - 使用加载页的天空图作为暗纹 */}
      <div className="absolute inset-0 opacity-10 blur-xl">
        <img src="/images/loading/sky.png" alt="" className="w-full h-full object-cover animate-[spin_240s_linear_infinite]" />
      </div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 flex items-center justify-between p-8">
        <div className="flex items-center space-x-4">
          <img src="/logo.svg" alt="Echuu" className="w-10 h-10 rounded-xl object-contain" />
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white leading-none">Echuu</h1>
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">AI Vtubing Platform</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-white hover:bg-white/10"
          >
            <X className="h-4 w-4 mr-2" />
            跳过引导
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex h-full pt-20">
        {/* 左侧步骤指南 */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="max-w-md">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                STEP. 0{activeStep + 1}
              </h2>
              <h3 className="text-xl text-blue-200">
                {currentStep.title}
              </h3>
            </div>

            {/* 步骤列表 */}
            <div className="space-y-4 mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === activeStep;
                const isCompleted = index < activeStep;
                
                return (
                  <div key={step.id} className="relative">
                    <div className={`flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#ef0] text-black shadow-[0_0_20px_rgba(238,255,0,0.3)]' 
                        : isCompleted 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-white/5 text-white/40'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive 
                          ? 'bg-black text-[#ef0]' 
                          : isCompleted 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/10 text-white/20'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-[13px] tracking-wide">{step.title}</div>
                        <div className="text-[11px] opacity-60 font-medium">{step.description}</div>
                      </div>
                    </div>
                    
                    {/* 连接线 */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-4 bg-white/5"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-4">
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                variant="outline"
                className="rounded-xl text-white border-white/10 hover:bg-white/5 disabled:opacity-20"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                上一步
              </Button>
              
              <Button
                onClick={handleNext}
                className="rounded-xl bg-[#ef0] text-black hover:bg-[#d4e600] font-bold px-8 shadow-lg shadow-[#ef0]/10"
              >
                {activeStep === steps.length - 1 ? '完成' : '下一步'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-white mb-6">MODEL LIBRARY</h3>
            
            {/* 当前步骤内容 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <currentStep.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">
                    {currentStep.title}
                  </h4>
                  <p className="text-blue-200 mb-4">
                    {currentStep.content}
                  </p>
                  {currentStep.id === 1 && (
                    <p className="text-sm text-white/70 mb-2">
                      选择或上传后，主界面中央将显示角色预览。
                    </p>
                  )}
                  <p className="text-sm text-blue-300">
                    {currentStep.id === 1 ? (
                      <>
                        Want a customized model? Make it from{' '}
                        <a
                          href={VROID_STUDIO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-[#ef0]"
                        >
                          VRoid Studio
                        </a>
                        .
                      </>
                    ) : (
                      currentStep.details
                    )}
                  </p>
                  {actionHref && (
                    <div className="mt-6 flex flex-wrap gap-3 justify-center">
                      {currentStep.id === 1 && (onStep1Select || onStep1Upload) ? (
                        <>
                          {onStep1Select && (
                            <Button
                              onClick={onStep1Select}
                              className="bg-[#ef0] text-black hover:bg-[#d4e600] font-bold"
                            >
                              选择模型
                            </Button>
                          )}
                          {onStep1Upload && (
                            <Button
                              onClick={onStep1Upload}
                              variant="outline"
                              className="border-[#ef0] text-[#ef0] hover:bg-[#ef0]/10 font-bold"
                            >
                              上传模型
                            </Button>
                          )}
                        </>
                      ) : currentStep.id === 1 ? (
                        <Link href={actionHref}>
                          <Button className="bg-[#ef0] text-black hover:bg-[#d4e600] font-bold">
                            选择或上传模型
                          </Button>
                        </Link>
                      ) : (
                        <Link href={actionHref}>
                          <Button className="bg-[#ef0] text-black hover:bg-[#d4e600] font-bold">
                            {currentStep.actionLabel}
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* S3 模型库：步骤 1 时展示，其余步骤保留占位 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentStep.id === 1 ? (
                s3Loading ? (
                  <div className="col-span-2 aspect-square max-h-48 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
                  </div>
                ) : s3Models.length > 0 ? (
                  s3Models.slice(0, 4).map((model) => {
                    const thumbSrc =
                      model.thumbnail ||
                      `/api/vrm-thumbnail?url=${encodeURIComponent(model.url)}`;
                    return (
                      <div
                        key={model.id}
                        className="aspect-square bg-white/10 rounded-lg border border-white/20 flex flex-col items-center justify-center overflow-hidden"
                        title={model.name}
                      >
                        <img
                          src={thumbSrc}
                          alt={model.name}
                          className="w-full h-full object-cover bg-white/5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.svg';
                            (e.target as HTMLImageElement).className =
                              'w-full h-full object-contain p-4 opacity-80';
                          }}
                        />
                        <span className="text-xs text-white/80 truncate w-full px-2 text-center mt-1">
                          {model.name}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 aspect-square max-h-48 bg-white/10 rounded-lg border border-white/20 flex flex-col items-center justify-center gap-2 p-4">
                    {s3Error ? (
                      <p className="text-sm text-amber-400 text-center">加载模型列表失败，请检查 S3 配置或稍后重试</p>
                    ) : (
                      <p className="text-sm text-white/60 text-center">
                        暂无模型。点击上方「选择模型」从库中挑选，或「上传模型」上传 .vrm，主界面中央将显示角色预览。
                      </p>
                    )}
                  </div>
                )
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-white/10 rounded-lg border border-white/20 flex flex-col items-center justify-center overflow-hidden">
                    <img src="/logo.svg" alt="" className="w-full h-full object-contain p-6 opacity-60" aria-hidden />
                    <span className="text-xs text-white/50 truncate w-full px-2 text-center mt-1">—</span>
                  </div>
                ))
              )}
            </div>

            {/* 上传区域：步骤 1 时显示 VRoid 链接 */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/20 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  UPLOAD CHARACTER (.vrm)
                </h4>
                <p className="text-sm text-blue-300">
                  Want a customized model? Make it from{' '}
                  <a
                    href={VROID_STUDIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#ef0]"
                  >
                    VRoid Studio
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
