import { useState, useEffect } from 'react';
import { getAnimations } from '@/utils/resourceManager';

export const useAnimationLibrary = () => {
    const [animations, setAnimations] = useState([]);
    const [selectedAnimation, setSelectedAnimation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 从云端加载动画
    useEffect(() => {
        const loadAnimations = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const cloudAnimations = await getAnimations();
                
                // 添加默认动画作为备用
                const defaultAnimations = [
                    {
                        id: 'local-idle',
                        name: '待机动画',
                        description: '默认的待机动画',
                        url: '/models/animations/Idle.fbx',
                        type: 'fbx',
                        isDefault: true,
                        category: 'idle',
                        size: '28MB'
                    }
                ];
                
                const allAnimations = [...defaultAnimations, ...cloudAnimations];
                setAnimations(allAnimations);
                
                // 设置默认选中的动画
                if (!selectedAnimation) {
                    setSelectedAnimation(allAnimations[0]);
                }
                
                console.log('AnimationLibrary: 从云端加载完成', {
                    cloudAnimations: cloudAnimations.length,
                    totalAnimations: allAnimations.length,
                    selectedAnimation: allAnimations[0]
                });
                
            } catch (error) {
                console.error('AnimationLibrary: 加载失败', error);
                setError('无法从云端加载动画，请检查网络连接');
                
                // 使用本地默认动画作为备用
                const fallbackAnimations = [
                    {
                        id: 'local-idle',
                        name: '待机动画',
                        description: '默认的待机动画',
                        url: '/models/animations/Idle.fbx',
                        type: 'fbx',
                        isDefault: true,
                        category: 'idle',
                        size: '28MB'
                    }
                ];
                setAnimations(fallbackAnimations);
                setSelectedAnimation(fallbackAnimations[0]);
            } finally {
                setLoading(false);
            }
        };

        loadAnimations();
    }, []);

    // 选择动画
    const selectAnimation = (animation) => {
        setSelectedAnimation(animation);
        console.log('动画选择成功:', animation.name);
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
    const getAnimationsByCategory = (category) => {
        return animations.filter(anim => anim.category === category);
    };

    // 获取所有分类
    const getCategories = () => {
        const categories = [...new Set(animations.map(anim => anim.category))];
        return categories.sort();
    };

    return {
        // 状态
        animations,
        selectedAnimation,
        loading,
        error,

        // 方法
        selectAnimation,
        clearError,
        getAllAnimations,
        getSelectedAnimation,
        getAnimationsByCategory,
        getCategories
    };
}; 