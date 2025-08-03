import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HandDebugPanelProps {
  handDebugInfo: any;
}

export const HandDebugPanel: React.FC<HandDebugPanelProps> = ({ handDebugInfo }) => {
  if (!handDebugInfo) return null;

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
      <CardHeader>
        <CardTitle className="text-sky-900">手部调试信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-sky-600">左手检测</span>
            <Badge 
              variant="secondary" 
              className={handDebugInfo.leftHandDetected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            >
              {handDebugInfo.leftHandDetected ? '检测到' : '未检测'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-sky-600">右手检测</span>
            <Badge 
              variant="secondary" 
              className={handDebugInfo.rightHandDetected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            >
              {handDebugInfo.rightHandDetected ? '检测到' : '未检测'}
            </Badge>
          </div>
          
          <div className="text-xs text-sky-500">
            {handDebugInfo.mappingInfo}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 