import { useState, useEffect } from 'react';
import { getAnimations } from '@/lib/resource-manager';
import { animationStorage } from '@/lib/animation-storage';
import { Animation } from '@/types';

export const useAnimationLibrary = () => {
    const [animations, setAnimations] = useState<Animation[]>([]);
    const [selectedAnimation, setSelectedAnimation] = useState<Animation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 从云端和本地存储加载动画
    useEffect(() => {
        const loadAnimations = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 获取云端动画
                const cloudAnimations = await getAnimations(undefined);
                
                // 获取用户本地存储的动画
                const userAnimations = animationStorage.getUserAnimations();
                
                // 添加默认动画作为备用
                const defaultAnimations: Animation[] = [
                    {
                        id: 'local-idle',
                        name: '待机动画',
                        description: '默认的待机动画',
                        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Idle.fbx',
                        type: 'fbx',
                        isDefault: true,
                        category: 'idle',
                        size: 28000000, // 28MB
                        mimeType: 'application/octet-stream',
                        tags: ['default', 'idle'],
                        duration: 0,
                        thumbnail: null
                    }
                ];
                
                // 合并所有动画：默认动画 + 用户动画 + 云端动画
                const allAnimations = [
                    ...defaultAnimations,
                    ...userAnimations,
                    ...cloudAnimations
                ];
                
                setAnimations(allAnimations);
                // 不默认选中任何动画，由状态机驱动 idle 轮播（Idle/Disappointed/Bashful/Listening To Music）；用户点击后再同步到 store
                
                console.log('AnimationLibrary: 加载完成', {
                    defaultAnimations: defaultAnimations.length,
                    userAnimations: userAnimations.length,
                    cloudAnimations: cloudAnimations.length,
                    totalAnimations: allAnimations.length,
                });
                
            } catch (error) {
                console.error('AnimationLibrary: 加载失败', error);
                setError('无法从云端加载动画，请检查网络连接');
                
                // 使用本地默认动画和用户动画作为备用
                const userAnimations = animationStorage.getUserAnimations();
                const fallbackAnimations: Animation[] = [
                    {
                        id: 'local-idle',
                        name: '待机动画',
                        description: '默认的待机动画',
                        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Idle.fbx',
                        type: 'fbx',
                        isDefault: true,
                        category: 'idle',
                        size: 28000000,
                        mimeType: 'application/octet-stream',
                        tags: ['default', 'idle'],
                        duration: 0,
                        thumbnail: null
                    },
                    ...userAnimations
                ];
                setAnimations(fallbackAnimations);
                // 错误时也不默认选中，保持由状态机驱动
            } finally {
                setLoading(false);
            }
        };

        loadAnimations();
    }, []);

    // 选择动画
    const selectAnimation = (animation: Animation) => {
        setSelectedAnimation(animation);
        console.log('动画选择成功:', animation.name);
    };

    // 添加用户动画到本地存储
    const addUserAnimation = (animation: Animation) => {
        animationStorage.saveUserAnimation(animation);
        
        // 更新当前动画列表
        setAnimations(prevAnimations => {
            const existingIndex = prevAnimations.findIndex(a => a.id === animation.id);
            if (existingIndex >= 0) {
                // 更新现有动画
                const updatedAnimations = [...prevAnimations];
                updatedAnimations[existingIndex] = animation;
                return updatedAnimations;
            } else {
                // 添加新动画
                return [...prevAnimations, animation];
            }
        });
        
        console.log('用户动画已添加到本地存储:', animation.name);
    };

    // 删除用户动画
    const removeUserAnimation = (animationId: string) => {
        animationStorage.removeUserAnimation(animationId);
        
        // 从当前列表中移除
        setAnimations(prevAnimations => 
            prevAnimations.filter(a => a.id !== animationId)
        );
        
        // 如果删除的是当前选中的动画，选择第一个动画
        if (selectedAnimation?.id === animationId) {
            const remainingAnimations = animations.filter(a => a.id !== animationId);
            if (remainingAnimations.length > 0) {
                setSelectedAnimation(remainingAnimations[0]);
            } else {
                setSelectedAnimation(null);
            }
        }
        
        console.log('用户动画已删除:', animationId);
    };

    // 清除错误
    const clearError = () => {
        setError(null);
    };

    // 获取所有动画
    const getAllAnimations = () => animations;

    // 获取选中的动画
    const getSelectedAnimation = () => selectedAnimation;

    // 按分类获取动画
    const getAnimationsByCategory = (category: string) => {
        return animations.filter(anim => anim.category === category);
    };

    // 获取所有分类
    const getCategories = () => {
        const categories = [...new Set(animations.map(anim => anim.category || 'custom'))];
        return categories.sort();
    };

    // 获取用户动画统计
    const getUserAnimationStats = () => {
        return animationStorage.getAnimationStats();
    };

    return {
        // 状态
        animations,
        selectedAnimation,
        loading,
        error,

        // 方法
        selectAnimation,
        addUserAnimation,
        removeUserAnimation,
        clearError,
        getAllAnimations,
        getSelectedAnimation,
        getAnimationsByCategory,
        getCategories,
        getUserAnimationStats
    };
}; 