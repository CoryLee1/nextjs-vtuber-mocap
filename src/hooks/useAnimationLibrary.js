import { useState, useEffect } from 'react';

// 默认动画列表
const DEFAULT_ANIMATIONS = [
    {
        id: 'idle',
        name: '待机动画',
        description: '默认的待机动画',
        url: '/models/animations/Idle.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'idle'
    },
    {
        id: 'breakdance-1990',
        name: '霹雳舞 1990',
        description: '经典的霹雳舞动作',
        url: '/models/animations/Breakdance 1990.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'dance'
    },
    {
        id: 'mma-kick',
        name: 'MMA踢腿',
        description: '综合格斗踢腿动作',
        url: '/models/animations/Mma Kick.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'combat'
    },
    {
        id: 'breakdance-uprock-var2',
        name: '霹雳舞 Uprock 变体2',
        description: '霹雳舞上摇滚变体动作',
        url: '/models/animations/Breakdance Uprock Var 2.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'dance'
    },
    {
        id: 'twist-dance',
        name: '扭摆舞',
        description: '扭摆舞蹈动作',
        url: '/models/animations/Twist Dance.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'dance'
    },
    {
        id: 'sitting-laughing',
        name: '坐着笑',
        description: '坐着大笑的动作',
        url: '/models/animations/Sitting Laughing.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'emotion'
    },
    {
        id: 'taunt',
        name: '挑衅',
        description: '挑衅动作',
        url: '/models/animations/Taunt.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'emotion'
    },
    {
        id: 'capoeira',
        name: '卡波耶拉',
        description: '巴西武术卡波耶拉动作',
        url: '/models/animations/Capoeira.fbx',
        type: 'fbx',
        isDefault: true,
        category: 'combat'
    }
];

// 在线动画库
const ONLINE_ANIMATIONS = [
    {
        id: 'dance-1',
        name: '舞蹈动画 1',
        description: '欢快的舞蹈动作',
        url: 'https://example.com/animations/dance1.fbx',
        type: 'fbx',
        category: 'dance',
        size: '2.1MB',
        preview: 'https://example.com/previews/dance1.gif'
    },
    {
        id: 'walk-1',
        name: '行走动画',
        description: '自然的行走动作',
        url: 'https://example.com/animations/walk1.fbx',
        type: 'fbx',
        category: 'movement',
        size: '1.8MB',
        preview: 'https://example.com/previews/walk1.gif'
    },
    {
        id: 'run-1',
        name: '跑步动画',
        description: '快速的跑步动作',
        url: 'https://example.com/animations/run1.fbx',
        type: 'fbx',
        category: 'movement',
        size: '2.3MB',
        preview: 'https://example.com/previews/run1.gif'
    }
];

export const useAnimationLibrary = () => {
    const [animations, setAnimations] = useState([]);
    const [selectedAnimation, setSelectedAnimation] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [downloadingIds, setDownloadingIds] = useState(new Set());
    const [error, setError] = useState(null);
    const [onlineAnimations] = useState(ONLINE_ANIMATIONS);

    // 从localStorage加载动画
    useEffect(() => {
        const savedAnimations = localStorage.getItem('animationLibrary');
        if (savedAnimations) {
            const parsed = JSON.parse(savedAnimations);
            setAnimations([...DEFAULT_ANIMATIONS, ...parsed]);
        } else {
            setAnimations(DEFAULT_ANIMATIONS);
        }

        // 加载选中的动画
        const savedSelected = localStorage.getItem('selectedAnimation');
        if (savedSelected) {
            setSelectedAnimation(JSON.parse(savedSelected));
        } else {
            setSelectedAnimation(DEFAULT_ANIMATIONS[0]);
        }

        console.log('AnimationLibrary: 初始化完成', {
            defaultAnimations: DEFAULT_ANIMATIONS,
            selectedAnimation: savedSelected ? JSON.parse(savedSelected) : DEFAULT_ANIMATIONS[0]
        });
    }, []);

    // 保存动画到localStorage
    const saveAnimations = (newAnimations) => {
        const customAnimations = newAnimations.filter(anim => !anim.isDefault);
        localStorage.setItem('animationLibrary', JSON.stringify(customAnimations));
        setAnimations(newAnimations);
    };

    // 保存选中的动画
    const saveSelectedAnimation = (animation) => {
        localStorage.setItem('selectedAnimation', JSON.stringify(animation));
        setSelectedAnimation(animation);
    };

    // 上传动画文件
    const uploadAnimation = async (file) => {
        setIsUploading(true);
        setError(null);

        try {
            // 验证文件类型
            if (!file.name.toLowerCase().endsWith('.fbx')) {
                throw new Error('只支持上传 .fbx 格式的动画文件');
            }

            // 验证文件大小 (最大50MB)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('动画文件大小不能超过50MB');
            }

            // 创建本地URL
            const fileUrl = URL.createObjectURL(file);

            // 生成唯一ID
            const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const newAnimation = {
                id,
                name: file.name.replace('.fbx', ''),
                description: `上传的动画: ${file.name}`,
                url: fileUrl,
                type: 'fbx',
                category: 'custom',
                size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                isCustom: true,
                file: file // 保存文件对象用于后续处理
            };

            const updatedAnimations = [...animations, newAnimation];
            saveAnimations(updatedAnimations);

            console.log('动画上传成功:', newAnimation);
            return newAnimation;

        } catch (error) {
            console.error('动画上传失败:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // 下载在线动画
    const downloadAnimation = async (onlineAnimation) => {
        setDownloadingIds(prev => new Set([...prev, onlineAnimation.id]));

        try {
            // 模拟下载过程
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 创建本地URL (这里模拟下载，实际应该从服务器下载)
            const localUrl = onlineAnimation.url;
            
            const downloadedAnimation = {
                ...onlineAnimation,
                id: `downloaded-${onlineAnimation.id}`,
                url: localUrl,
                isDownloaded: true
            };

            const updatedAnimations = [...animations, downloadedAnimation];
            saveAnimations(updatedAnimations);

            console.log('动画下载成功:', downloadedAnimation);
            return downloadedAnimation;

        } catch (error) {
            console.error('动画下载失败:', error);
            setError(error.message);
            throw error;
        } finally {
            setDownloadingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(onlineAnimation.id);
                return newSet;
            });
        }
    };

    // 删除动画
    const deleteAnimation = (animationId) => {
        const animationToDelete = animations.find(anim => anim.id === animationId);
        
        if (animationToDelete?.isDefault) {
            setError('不能删除默认动画');
            return;
        }

        const updatedAnimations = animations.filter(anim => anim.id !== animationId);
        saveAnimations(updatedAnimations);

        // 如果删除的是当前选中的动画，切换到默认动画
        if (selectedAnimation?.id === animationId) {
            const defaultAnim = animations.find(anim => anim.isDefault);
            if (defaultAnim) {
                saveSelectedAnimation(defaultAnim);
            }
        }

        console.log('动画删除成功:', animationId);
    };

    // 选择动画
    const selectAnimation = (animation) => {
        saveSelectedAnimation(animation);
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

    // 获取在线动画
    const getOnlineAnimations = () => onlineAnimations;

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
        isUploading,
        downloadingIds,
        error,
        onlineAnimations,

        // 方法
        uploadAnimation,
        downloadAnimation,
        deleteAnimation,
        selectAnimation,
        clearError,
        getAllAnimations,
        getSelectedAnimation,
        getOnlineAnimations,
        getAnimationsByCategory,
        getCategories
    };
}; 