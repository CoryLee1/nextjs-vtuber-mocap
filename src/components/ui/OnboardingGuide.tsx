'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Upload, 
  Users, 
  Play,
  Camera,
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
    title: 'UPLOAD YOUR AVATAR',
    description: '支持 .vrm 文件',
    icon: Upload,
    content: '上传您的VRM格式虚拟形象文件，开始您的VTuber之旅。',
    details: 'Want a customized model? Make it from Vroid Studio: Link'
  },
  {
    id: 2,
    title: 'SET UP YOUR CHARACTER',
    description: '配置您的角色',
    icon: Users,
    content: '调整角色设置，包括动作捕捉参数和显示选项。',
    details: 'Configure motion capture settings and visual preferences'
  },
  {
    id: 3,
    title: 'GO LIVE',
    description: '开始直播',
    icon: Play,
    content: '启动摄像头，开始您的实时动作捕捉体验。',
    details: 'Enable camera and start your real-time motion capture session'
  }
];

export default function OnboardingGuide({ onComplete, onSkip }: OnboardingGuideProps) {
  const { t } = useI18n();
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep];

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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 z-50 overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[url('/project-resources/opening1_2000.png')] bg-cover bg-center opacity-10"></div>
      
      {/* 顶部导航栏 */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-blue-900 font-bold text-lg">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VTuber Mocap</h1>
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
                    <div className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-300 ${
                      isActive 
                        ? 'bg-yellow-400 text-blue-900' 
                        : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/10 text-white'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive 
                          ? 'bg-blue-900 text-yellow-400' 
                          : isCompleted 
                          ? 'bg-white text-green-500' 
                          : 'bg-white/20 text-white'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{step.title}</div>
                        <div className="text-sm opacity-80">{step.description}</div>
                      </div>
                    </div>
                    
                    {/* 连接线 */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-8 top-16 w-0.5 h-4 bg-white/20"></div>
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
                className="text-white border-white/30 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                上一步
              </Button>
              
              <Button
                onClick={handleNext}
                className="bg-yellow-400 text-blue-900 hover:bg-yellow-300"
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
