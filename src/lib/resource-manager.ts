// 简单资源管理器 - Mock 版本
// 后续可以轻松替换为真实的 API 调用

// 资源配置
const RESOURCE_CONFIG = {
  // 使用 AWS S3 链接
  baseUrl: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com',
  
  // 本地资源（小文件）
  localBaseUrl: '/models',
  
  // 资源列表
  resources: {
    models: [
      {
        id: 'avatar-sample-a',
        name: 'Avatar Sample A',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-a.jpg',
        category: 'anime',
        tags: ['female', 'long-hair'],
        size: '15MB'
      },
      {
        id: 'avatar-sample-c', 
        name: 'Avatar Sample C',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_C.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-c.jpg',
        category: 'anime',
        tags: ['female', 'short-hair'],
        size: '14MB'
      },
      {
        id: 'avatar-sample-h', 
        name: 'Avatar Sample H',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_H.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-h.jpg',
        category: 'anime',
        tags: ['female', 'long-hair'],
        size: '19MB'
      },
      {
        id: 'avatar-sample-m', 
        name: 'Avatar Sample M',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_M.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-m.jpg',
        category: 'anime',
        tags: ['male', 'short-hair'],
        size: '20MB'
      },
      {
        id: 'avatar-sample-z', 
        name: 'Avatar Sample Z',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_Z.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-z.jpg',
        category: 'anime',
        tags: ['male', 'long-hair'],
        size: '17MB'
      }
    ],
    animations: [
      {
        id: 'idle',
        name: 'Idle Animation',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx',
        thumbnail: '/images/thumbnails/idle.gif',
        category: 'idle',
        tags: ['basic', 'loop'],
        size: '28MB'
      },
      {
        id: 'dance',
        name: 'Breakdance 1990',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Breakdance%201990.fbx',
        thumbnail: '/images/thumbnails/dance.gif',
        category: 'dance',
        tags: ['energetic', 'hip-hop'],
        size: '2.0MB'
      },
      {
        id: 'combat',
        name: 'Mma Kick',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Mma%20Kick.fbx',
        thumbnail: '/images/thumbnails/combat.gif',
        category: 'combat',
        tags: ['action', 'fighting'],
        size: '1.8MB'
      },
      {
        id: 'breakdance-uprock',
        name: 'Breakdance Uprock Var 2',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Breakdance%20Uprock%20Var%202.fbx',
        thumbnail: '/images/thumbnails/breakdance-uprock.gif',
        category: 'dance',
        tags: ['energetic', 'hip-hop'],
        size: '2.1MB'
      },
      {
        id: 'twist-dance',
        name: 'Twist Dance',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Twist%20Dance.fbx',
        thumbnail: '/images/thumbnails/twist-dance.gif',
        category: 'dance',
        tags: ['energetic', 'fun'],
        size: '2.4MB'
      },
      {
        id: 'sitting-laughing',
        name: 'Sitting Laughing',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Sitting%20Laughing.fbx',
        thumbnail: '/images/thumbnails/sitting-laughing.gif',
        category: 'idle',
        tags: ['casual', 'fun'],
        size: '2.3MB'
      },
      {
        id: 'taunt',
        name: 'Taunt',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Taunt.fbx',
        thumbnail: '/images/thumbnails/taunt.gif',
        category: 'gesture',
        tags: ['casual', 'fun'],
        size: '2.0MB'
      },
      {
        id: 'capoeira',
        name: 'Capoeira',
        url: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Capoeira.fbx',
        thumbnail: '/images/thumbnails/capoeira.gif',
        category: 'combat',
        tags: ['action', 'martial-arts'],
        size: '2.0MB'
      }
    ]
  }
};

// 资源管理器类
export class ResourceManager {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  // 获取所有模型
  async getModels(filters = {}) {
    let models = RESOURCE_CONFIG.resources.models;
    
    // 应用过滤器
    if (filters.category) {
      models = models.filter(model => model.category === filters.category);
    }
    
    if (filters.tags) {
      models = models.filter(model => 
        filters.tags.some(tag => model.tags.includes(tag))
      );
    }
    
    return models;
  }

  // 获取所有动画
  async getAnimations(filters = {}) {
    let animations = RESOURCE_CONFIG.resources.animations;
    
    // 应用过滤器
    if (filters.category) {
      animations = animations.filter(anim => anim.category === filters.category);
    }
    
    if (filters.tags) {
      animations = animations.filter(anim => 
        filters.tags.some(tag => anim.tags.includes(tag))
      );
    }
    
    return animations;
  }

  // 根据 ID 获取模型
  async getModelById(id) {
    return RESOURCE_CONFIG.resources.models.find(model => model.id === id);
  }

  // 根据 ID 获取动画
  async getAnimationById(id) {
    return RESOURCE_CONFIG.resources.animations.find(anim => anim.id === id);
  }

  // 预加载资源
  async preloadResource(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    const promise = fetch(url).then(response => response.arrayBuffer());
    this.loading.set(url, promise);
    
    const buffer = await promise;
    this.cache.set(url, buffer);
    this.loading.delete(url);
    
    return buffer;
  }

  // 获取资源 URL（支持外部链接）
  getResourceUrl(resource) {
    if (resource.url.startsWith('http')) {
      return resource.url;
    }
    return resource.url; // 暂时保持本地路径
  }

  // 获取缩略图 URL
  getThumbnailUrl(resource) {
    return resource.thumbnail;
  }

  // 搜索资源
  async searchResources(query, type = 'all') {
    const results = [];
    
    if (type === 'all' || type === 'models') {
      const models = await this.getModels();
      const modelResults = models.filter(model => 
        model.name.toLowerCase().includes(query.toLowerCase()) ||
        model.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      results.push(...modelResults.map(model => ({ ...model, type: 'model' })));
    }
    
    if (type === 'all' || type === 'animations') {
      const animations = await this.getAnimations();
      const animResults = animations.filter(anim => 
        anim.name.toLowerCase().includes(query.toLowerCase()) ||
        anim.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      results.push(...animResults.map(anim => ({ ...anim, type: 'animation' })));
    }
    
    return results;
  }

  // 获取资源统计信息
  getResourceStats() {
    const models = RESOURCE_CONFIG.resources.models;
    const animations = RESOURCE_CONFIG.resources.animations;
    
    return {
      totalModels: models.length,
      totalAnimations: animations.length,
      totalSize: models.reduce((sum, m) => sum + parseFloat(m.size), 0) + 
                 animations.reduce((sum, a) => sum + parseFloat(a.size), 0),
      categories: {
        models: [...new Set(models.map(m => m.category))],
        animations: [...new Set(animations.map(a => a.category))]
      }
    };
  }
}

// 创建全局实例
export const resourceManager = new ResourceManager();

// 便捷函数
export const getModels = (filters) => resourceManager.getModels(filters);
export const getAnimations = (filters) => resourceManager.getAnimations(filters);
export const getModelById = (id) => resourceManager.getModelById(id);
export const getAnimationById = (id) => resourceManager.getAnimationById(id);
export const searchResources = (query, type) => resourceManager.searchResources(query, type); 