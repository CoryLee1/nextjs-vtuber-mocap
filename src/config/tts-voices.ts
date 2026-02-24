// 通义千问 TTS 系统音色：value 与后端 voice 参数一致；补充支持语言、性别、特色便于选择
export const TTS_VOICES: {
  value: string;
  labelZh: string;
  labelEn: string;
  gender: 'male' | 'female';
  languages: string;   // 支持语种简述，如 "中/英/日"
  traitZh: string;
  traitEn: string;
}[] = [
  { value: 'Cherry', labelZh: '芊悦', labelEn: 'Cherry', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '阳光积极、亲切自然', traitEn: 'Warm, natural, upbeat' },
  { value: 'Serena', labelZh: '苏瑶', labelEn: 'Serena', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '温柔小姐姐', traitEn: 'Gentle, soft' },
  { value: 'Ethan', labelZh: '晨煦', labelEn: 'Ethan', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '阳光温暖、活力朝气', traitEn: 'Warm, energetic' },
  { value: 'Chelsie', labelZh: '千雪', labelEn: 'Chelsie', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '二次元虚拟女友', traitEn: 'Anime-style, sweet' },
  { value: 'Momo', labelZh: '茉兔', labelEn: 'Momo', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '撒娇搞怪、逗你开心', traitEn: 'Playful, cute' },
  { value: 'Vivian', labelZh: '十三', labelEn: 'Vivian', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '拽拽的、可爱小暴躁', traitEn: 'Sassy, cute' },
  { value: 'Moon', labelZh: '月白', labelEn: 'Moon', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '率性帅气', traitEn: 'Cool, casual' },
  { value: 'Maia', labelZh: '四月', labelEn: 'Maia', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '知性与温柔', traitEn: 'Refined, gentle' },
  { value: 'Kai', labelZh: '凯', labelEn: 'Kai', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '耳朵的一场 SPA', traitEn: 'Relaxing, smooth' },
  { value: 'Jennifer', labelZh: '詹妮弗', labelEn: 'Jennifer', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '品牌级、电影质感美语女声', traitEn: 'Premium US English, cinematic' },
  { value: 'Ryan', labelZh: '甜茶', labelEn: 'Ryan', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '节奏拉满、戏感炸裂', traitEn: 'Dynamic, expressive' },
  { value: 'Bella', labelZh: '萌宝', labelEn: 'Bella', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '小萝莉', traitEn: 'Young, cute' },
  { value: 'Neil', labelZh: '阿闻', labelEn: 'Neil', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '专业新闻主持人', traitEn: 'Professional news anchor' },
  { value: 'Nini', labelZh: '邻家妹妹', labelEn: 'Nini', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '又软又黏、甜', traitEn: 'Sweet, soft' },
  { value: 'Sohee', labelZh: '素熙', labelEn: 'Sohee', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '温柔开朗韩国欧尼', traitEn: 'Warm Korean style' },
  { value: 'Ono Anna', labelZh: '小野杏', labelEn: 'Ono Anna', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '鬼灵精怪青梅竹马', traitEn: 'Playful, anime style' },
];
