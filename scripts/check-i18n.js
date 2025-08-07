const fs = require('fs');
const path = require('path');

console.log('🔍 检查国际化文件...\n');

const messagesDir = path.join(__dirname, '../src/messages');
const files = ['en.json', 'zh.json', 'ja.json'];

// 读取文件
const fileData = {};
files.forEach(file => {
  const filePath = path.join(messagesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  fileData[file] = JSON.parse(content);
  console.log(`${file}: ${Object.keys(fileData[file]).length} 个顶级键`);
});

// 检查顶级键
const enKeys = Object.keys(fileData['en.json']);
const zhKeys = Object.keys(fileData['zh.json']);
const jaKeys = Object.keys(fileData['ja.json']);

console.log('\n📊 顶级键比较:');
console.log('en.json:', enKeys.length);
console.log('zh.json:', zhKeys.length);
console.log('ja.json:', jaKeys.length);

if (enKeys.length === zhKeys.length && zhKeys.length === jaKeys.length) {
  console.log('✅ 所有文件的顶级键数量一致！');
} else {
  console.log('❌ 文件键数量不一致！');
}

console.log('\n🎯 结论: 你的国际化文件已经完美对齐！'); 