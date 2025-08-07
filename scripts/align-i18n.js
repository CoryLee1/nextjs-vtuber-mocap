const fs = require('fs');
const path = require('path');

// 读取JSON文件
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return {};
  }
}

// 获取所有键的扁平化列表
function getFlattenedKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getFlattenedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// 根据键路径获取值
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// 根据键路径设置值
function setValueByPath(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// 主函数
function alignI18nFiles() {
  const messagesDir = path.join(__dirname, '../src/messages');
  const files = ['en.json', 'zh.json', 'ja.json'];
  
  console.log('🔍 分析国际化文件...\n');
  
  // 读取所有文件
  const fileData = {};
  files.forEach(file => {
    const filePath = path.join(messagesDir, file);
    fileData[file] = readJsonFile(filePath);
  });
  
  // 获取所有键
  const allKeys = new Set();
  Object.values(fileData).forEach(data => {
    getFlattenedKeys(data).forEach(key => allKeys.add(key));
  });
  
  const sortedKeys = Array.from(allKeys).sort();
  
  console.log(`📊 统计信息:`);
  console.log(`- 总键数: ${sortedKeys.length}`);
  
  // 分析每个文件的键
  const keyAnalysis = {};
  files.forEach(file => {
    const keys = getFlattenedKeys(fileData[file]);
    keyAnalysis[file] = {
      total: keys.length,
      keys: new Set(keys)
    };
    console.log(`- ${file}: ${keys.length} 个键`);
  });
  
  // 找出缺失的键
  console.log('\n🔍 缺失的键:');
  files.forEach(file => {
    const missingKeys = sortedKeys.filter(key => !keyAnalysis[file].keys.has(key));
    if (missingKeys.length > 0) {
      console.log(`\n${file} 缺失的键 (${missingKeys.length} 个):`);
      missingKeys.forEach(key => {
        console.log(`  - ${key}`);
      });
    }
  });
  
  // 找出重复的键（在同一文件中）
  console.log('\n🔍 重复的键:');
  files.forEach(file => {
    const keys = getFlattenedKeys(fileData[file]);
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    if (duplicates.length > 0) {
      console.log(`\n${file} 重复的键:`);
      [...new Set(duplicates)].forEach(key => {
        console.log(`  - ${key}`);
      });
    }
  });
  
  // 生成修复脚本
  console.log('\n🔧 生成修复脚本...');
  
  // 为每个文件添加缺失的键
  files.forEach(file => {
    const missingKeys = sortedKeys.filter(key => !keyAnalysis[file].keys.has(key));
    if (missingKeys.length > 0) {
      console.log(`\n为 ${file} 添加缺失的键:`);
      
      // 找到参考文件（优先使用英文）
      const referenceFile = file === 'en.json' ? 'zh.json' : 'en.json';
      const referenceData = fileData[referenceFile];
      
      missingKeys.forEach(key => {
        const referenceValue = getValueByPath(referenceData, key);
        if (referenceValue !== undefined) {
          setValueByPath(fileData[file], key, referenceValue);
          console.log(`  + ${key}: "${referenceValue}"`);
        } else {
          // 如果没有参考值，使用键名作为默认值
          const defaultValue = key.split('.').pop();
          setValueByPath(fileData[file], key, defaultValue);
          console.log(`  + ${key}: "${defaultValue}" (默认值)`);
        }
      });
      
      // 保存修复后的文件
      const outputPath = path.join(messagesDir, `${file}.fixed`);
      fs.writeFileSync(outputPath, JSON.stringify(fileData[file], null, 2), 'utf8');
      console.log(`\n修复后的文件已保存到: ${outputPath}`);
    }
  });
  
  // 生成统一的模板
  console.log('\n📝 生成统一模板...');
  const template = {};
  sortedKeys.forEach(key => {
    const defaultValue = key.split('.').pop();
    setValueByPath(template, key, defaultValue);
  });
  
  const templatePath = path.join(messagesDir, 'template.json');
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf8');
  console.log(`模板文件已保存到: ${templatePath}`);
  
  console.log('\n✅ 分析完成！');
  console.log('\n📋 建议操作:');
  console.log('1. 检查 .fixed 文件，确认修复内容正确');
  console.log('2. 手动翻译缺失的键值');
  console.log('3. 删除重复的键');
  console.log('4. 用修复后的文件替换原文件');
}

// 运行脚本
if (require.main === module) {
  alignI18nFiles();
}

module.exports = { alignI18nFiles }; 