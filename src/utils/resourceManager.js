// 简单资源管理器 - Mock 版本
// 后续可以轻松替换为真实的 API 调用

// 资源配置
const RESOURCE_CONFIG = {
  // 使用 GitHub Releases 或 CDN 链接
  baseUrl: 'https://github.com/CoryLee1/nextjs-vtuber-mocap/releases/download/v1.0.0',
  
  // 本地资源（小文件）
  localBaseUrl: '/models',
  
  // 资源列表
  resources: {
    models: [
      {
        id: 'avatar-sample-a',
        name: 'Avatar Sample A',
        url: '/models/AvatarSample_A.vrm', // 暂时保持本地
        thumbnail: '/images/thumbnails/avatar-sample-a.jpg',
        category: 'anime',
        tags: ['female', 'long-hair'],
        size: '15MB'
      },
      {
        id: 'avatar-sample-b', 
        name: 'Avatar Sample B',
        url: '/models/AvatarSample_B.vrm',
        thumbnail: '/images/thumbnails/avatar-sample-b.jpg',
        category: 'anime',
        tags: ['male', 'short-hair'],
        size: '14MB'
      }
    ],
    animations: [
      {
        id: 'idle',
        name: 'Idle Animation',
        url: '/models/animations/Idle.fbx',
        thumbnail: '/images/thumbnails/idle.gif',
        category: 'idle',
        tags: ['basic', 'loop'],
        size: '28MB'
      },
      {
        id: 'dance',
        name: 'Breakdance 1990',
        url: '/models/animations/Breakdance 1990.fbx',
        thumbnail: '/images/thumbnails/dance.gif',
        category: 'dance',
        tags: ['energetic', 'hip-hop'],
        size: '2.0MB'
      },
      {
        id: 'combat',
        name: 'Mma Kick',
        url: '/models/animations/Mma Kick.fbx',
        thumbnail: '/images/thumbnails/combat.gif',
        category: 'combat',
        tags: ['action', 'fighting'],
        size: '1.8MB'
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