import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  Eye, 
  EyeOff,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import { dataFlowMonitor, dataFlowSequencer, DataFlowEvent } from '@/lib/data-flow-monitor';

interface DataFlowDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataFlowDebugPanel: React.FC<DataFlowDebugPanelProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 自动刷新数据
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(() => {
      updateStats();
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const updateStats = () => {
    const monitorStats = dataFlowMonitor.getPerformanceStats();
    const sequenceValidation = dataFlowSequencer.validateSequence();
    const recentErrors = dataFlowMonitor.getRecentErrors();
    const events = dataFlowMonitor.getEvents().slice(-20); // 最近20个事件

    setStats({
      monitor: monitorStats,
      sequence: sequenceValidation,
      recentErrors,
      events,
    });
  };

  const clearData = () => {
    dataFlowMonitor.clear();
    dataFlowSequencer.clear();
    updateStats();
  };

  const getEventIcon = (event: DataFlowEvent) => {
    switch (event) {
      case DataFlowEvent.CAMERA_START:
      case DataFlowEvent.CAMERA_STOP:
        return '📹';
      case DataFlowEvent.MOCAP_DATA_RECEIVED:
        return '🎯';
      case DataFlowEvent.MODEL_LOADED:
        return '🎭';
      case DataFlowEvent.ANIMATION_LOADED:
        return '🎬';
      case DataFlowEvent.ERROR_OCCURRED:
        return '❌';
      case DataFlowEvent.PROCESSING_START:
      case DataFlowEvent.PROCESSING_END:
        return '⚙️';
      default:
        return '📝';
    }
  };

  const getEventColor = (event: DataFlowEvent) => {
    switch (event) {
      case DataFlowEvent.ERROR_OCCURRED:
        return 'text-red-600 bg-red-50';
      case DataFlowEvent.CAMERA_START:
      case DataFlowEvent.MODEL_LOADED:
      case DataFlowEvent.ANIMATION_LOADED:
        return 'text-green-600 bg-green-50';
      case DataFlowEvent.PROCESSING_START:
      case DataFlowEvent.PROCESSING_END:
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl h-[90vh] bg-white/95 backdrop-blur-sm border-sky-200">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Database className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <CardTitle className="text-sky-900">数据流调试面板</CardTitle>
                <p className="text-sm text-sky-600">监控数据流、时序和性能</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {autoRefresh ? '自动刷新' : '手动刷新'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={updateStats}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearData}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                清空
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 h-full flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* 性能统计 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-sky-900">性能统计</h3>
              {stats?.monitor && (
                <Card className="border-sky-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sky-600">总事件数</span>
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                        {stats.monitor.totalEvents}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sky-600">平均处理时间</span>
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                        {Math.round(stats.monitor.averageProcessingTime)}ms
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sky-600">错误数量</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-700">
                        {stats.monitor.errorCount}
                      </Badge>
                    </div>
                    
                    {stats.monitor.lastEvent && (
                      <div className="pt-2 border-t border-sky-200">
                        <div className="text-xs text-sky-500">最后事件</div>
                        <div className="text-sm font-medium text-sky-900">
                          {stats.monitor.lastEvent.event}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 时序验证 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-sky-900">时序验证</h3>
              {stats?.sequence && (
                <Card className="border-sky-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-sky-600">时序状态</span>
                      <Badge 
                        variant="secondary" 
                        className={stats.sequence.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      >
                        {stats.sequence.isValid ? '正常' : '异常'}
                      </Badge>
                    </div>
                    
                    {stats.sequence.issues.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-sky-500">发现的问题:</div>
                        {stats.sequence.issues.map((issue: string, index: number) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 最近错误 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-sky-900">最近错误</h3>
              {stats?.recentErrors && stats.recentErrors.length > 0 ? (
                <Card className="border-sky-200">
                  <CardContent className="p-4 space-y-2">
                    {stats.recentErrors.map((error: any, index: number) => (
                      <div key={index} className="text-sm bg-red-50 p-2 rounded border border-red-200">
                        <div className="font-medium text-red-700">{error.event}</div>
                        <div className="text-red-600">{error.error}</div>
                        <div className="text-xs text-red-500">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-sky-200">
                  <CardContent className="p-4 text-center text-sky-500">
                    暂无错误
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* 事件历史 */}
          <div className="mt-6 flex-1">
            <h3 className="text-lg font-medium text-sky-900 mb-4">事件历史</h3>
            <div className="bg-sky-50 rounded-lg p-4 h-64 overflow-y-auto">
              {stats?.events && stats.events.length > 0 ? (
                <div className="space-y-2">
                  {stats.events.map((event: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <span className="text-lg">{getEventIcon(event.event)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-sky-900">{event.event}</div>
                        <div className="text-xs text-sky-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      {event.duration && (
                        <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                          {event.duration}ms
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sky-500 py-8">
                  暂无事件记录
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 