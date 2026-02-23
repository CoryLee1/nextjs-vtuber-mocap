'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Loader2,
  SlidersHorizontal
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';
import {
  OnboardingModelPreview,
  DEFAULT_ONBOARDING_PREVIEW_CONFIG,
  type OnboardingPreviewConfig,
} from '@/components/dressing-room/OnboardingModelPreview';
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
  const searchParams = useSearchParams();
  const showPreviewDebug = searchParams.get('previewDebug') === '1' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
  const [previewConfig, setPreviewConfig] = useState<OnboardingPreviewConfig>(DEFAULT_ONBOARDING_PREVIEW_CONFIG);
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [s3Models, setS3Models] = useState<VRMModel[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const [s3Error, setS3Error] = useState(false);
  const currentStep = steps[activeStep];
  const actionHref = currentStep.id === 1 ? `/${locale}` : (currentStep.actionHref ?? null);

  const updatePreview = (key: keyof OnboardingPreviewConfig, value: number) => {
    setPreviewConfig((c) => ({ ...c, [key]: value }));
  };

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
    fetch('/api/s3/resources?type=models&checkThumbs=1')
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

      <div className="relative z-10 flex h-full pt-20 items-center px-12">
        {/* 1. 左侧：步骤指示器与导航 */}
        <div className="w-[280px] flex flex-col justify-start pt-12 pr-6 border-r border-white/5 h-[700px]">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">
              STEP. 0{activeStep + 1}
            </h2>
            <h3 className="text-xl text-blue-200">
              {currentStep.title}
            </h3>
          </div>

          {/* 步骤列表 */}
          <div className="space-y-4 mb-12">
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
          <div className="flex space-x-4 mt-auto">
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

        {/* 2. 中间：模型展示区 (自适应撑满，高度限制 700px) */}
        <div className="flex-1 h-[700px] relative px-4 flex items-center justify-center overflow-hidden">
          {currentStep.id === 1 && (
            <div className="w-full h-full">
              <OnboardingModelPreview previewConfig={previewConfig} />
            </div>
          )}
        </div>

        {/* 3. 右侧：内容/资源库 */}
        <div className="w-[320px] flex flex-col justify-start pt-0 pl-6 border-l border-white/5 h-[700px]">
          <div className="w-full">
            <h3 className="text-2xl font-bold text-white mb-6">MODEL LIBRARY</h3>
            
            {/* 当前步骤详情 */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <currentStep.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">
                    {currentStep.title}
                  </h4>
                  <p className="text-blue-200 mb-4 text-sm">
                    {currentStep.content}
                  </p>
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
                    ) : (
                      actionHref && (
                        <Link href={actionHref}>
                          <Button className="bg-[#ef0] text-black hover:bg-[#d4e600] font-bold">
                            {currentStep.actionLabel || '进入下一步'}
                          </Button>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* S3 模型列表预览 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentStep.id === 1 ? (
                s3Loading ? (
                  <div className="col-span-2 aspect-square max-h-40 bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
                  </div>
                ) : s3Models.length > 0 ? (
                  s3Models.slice(0, 4).map((model) => {
                    const thumbSrc = model.thumbnail || `/api/vrm-thumbnail?url=${encodeURIComponent(model.url)}`;
                    const placeholderSrc = '/images/placeholder-model.svg';
                    return (
                      <div key={model.id} className="aspect-square bg-white/10 rounded-lg border border-white/20 flex flex-col items-center justify-center overflow-hidden">
                        <img
                          src={thumbSrc}
                          alt={model.name}
                          className="w-full h-full object-cover bg-white/5"
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (el.src !== placeholderSrc) el.src = placeholderSrc;
                          }}
                        />
                        <span className="text-[10px] text-white/80 truncate w-full px-2 text-center mt-1">
                          {model.name}
                        </span>
                      </div>
                    );
                  })
                ) : null
              ) : (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-white/5 rounded-lg border border-white/10 flex items-center justify-center">
                    <span className="text-xs text-white/10">—</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 镜头调试 Panel：URL 加 ?previewDebug=1 显示，调好后把数值抄到 DEFAULT_ONBOARDING_PREVIEW_CONFIG */}
      {showPreviewDebug && (
        <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewPanelOpen((o) => !o)}
            className="bg-black/80 border-white/20 text-white hover:bg-white/10"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {previewPanelOpen ? '收起镜头' : '镜头参数'}
          </Button>
          {previewPanelOpen && (
            <Card className="w-[280px] bg-black/90 border-white/20 backdrop-blur">
              <CardContent className="p-3 text-xs space-y-2 max-h-[70vh] overflow-y-auto">
                <div className="font-bold text-white/90 mb-2">引导页 3D 预览</div>
                {([
                  { key: 'cameraX' as const, label: '相机 X', step: 0.1 },
                  { key: 'cameraY' as const, label: '相机 Y', step: 0.1 },
                  { key: 'cameraZ' as const, label: '相机 Z', step: 0.1 },
                  { key: 'cameraRotationX' as const, label: '俯仰(度)', step: 1 },
                  { key: 'cameraRotationY' as const, label: '偏航(度)', step: 1 },
                  { key: 'cameraRotationZ' as const, label: '滚转(度)', step: 1 },
                  { key: 'fov' as const, label: 'FOV', step: 1 },
                  { key: 'modelScale' as const, label: '模型缩放', step: 0.05 },
                  { key: 'groupPosY' as const, label: '模型 Y', step: 0.1 },
                  { key: 'adjustCamera' as const, label: '拉近(0.5~1.5)', step: 0.05 },
                  { key: 'stageIntensity' as const, label: '主光', step: 0.1 },
                  { key: 'ambientIntensity' as const, label: '环境光', step: 0.1 },
                ] as const).map(({ key, label, step }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <label className="text-white/70 shrink-0">{label}</label>
                    <input
                      type="number"
                      step={step}
                      value={previewConfig[key]}
                      onChange={(e) => updatePreview(key, Number(e.target.value))}
                      className="w-20 rounded bg-white/10 border border-white/20 px-2 py-1 text-white text-right"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-white/70"
                  onClick={() => setPreviewConfig(DEFAULT_ONBOARDING_PREVIEW_CONFIG)}
                >
                  重置默认
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
