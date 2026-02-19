'use client';

import React, { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

interface OnboardingGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  {
    id: 1,
    title: 'SELECT / UPLOAD MODEL',
    description: '选择或上传 .vrm',
    icon: Upload,
    content: '选择或上传您的VRM模型，作为直播角色的外观。',
    details: 'Want a customized model? Make it from Vroid Studio: Link',
    actionLabel: '选择/上传模型',
    actionHref: null as string | null,  // 使用主应用 Character Setting，见下方 locale 拼接
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

export default function OnboardingGuide({ onComplete, onSkip }: OnboardingGuideProps) {
  const { t, locale } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep];
  // 步骤 1（选择/上传模型）指向主应用根，在侧栏 Character Setting 中操作
  const actionHref = currentStep.id === 1 ? `/${locale}` : (currentStep.actionHref ?? null);

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
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-xl">E</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white leading-none">VTuber Mocap</h1>
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-[0.2em] mt-1">Platform</span>
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
                  <p className="text-sm text-blue-300">
                    {currentStep.details}
                  </p>
                  {actionHref && (
                    <div className="mt-6">
                      <Link href={actionHref}>
                        <Button className="bg-[#ef0] text-black hover:bg-[#d4e600] font-bold">
                          {currentStep.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 模型预览区域 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-white/10 rounded-lg border border-white/20 flex items-center justify-center">
                  <Users className="h-8 w-8 text-white/50" />
                </div>
              ))}
            </div>

            {/* 上传区域 */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/20 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  UPLOAD CHARACTER (.vrm)
                </h4>
                <p className="text-sm text-blue-300">
                  Want a customized model? Make it from Vroid Studio: Link
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
