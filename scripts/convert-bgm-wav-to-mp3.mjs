#!/usr/bin/env node
/**
 * 将 4 首 BGM WAV 转为 MP3，输出命名为 "xxx-Cynthia-xmyri.mp3"
 * 需要已安装 ffmpeg（PATH 可用）。
 *
 * 用法：
 *   node scripts/convert-bgm-wav-to-mp3.mjs <输入目录>
 * 或指定输出目录：
 *   node scripts/convert-bgm-wav-to-mp3.mjs <输入目录> <输出目录>
 *
 * 输入文件预期名称（不区分顺序）：
 *   cold-background (1).wav
 *   deep sleep wip (2).wav
 *   reboot-background-wip (1).wav
 *   absent wip (2).wav
 *
 * 输出文件（放到 public/sounds/bgm/）：
 *   cold-background-Cynthia-xmyri.mp3
 *   deep-sleep-wip-Cynthia-xmyri.mp3
 *   reboot-background-wip-Cynthia-xmyri.mp3
 *   absent-wip-Cynthia-xmyri.mp3
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const INPUT_MAP = [
  { pattern: /cold-background\s*\(\s*1\s*\)\.wav/i, out: 'cold-background-Cynthia-xmyri.mp3' },
  { pattern: /deep\s*sleep\s*wip\s*\(\s*2\s*\)\.wav/i, out: 'deep-sleep-wip-Cynthia-xmyri.mp3' },
  { pattern: /reboot-background-wip\s*\(\s*1\s*\)\.wav/i, out: 'reboot-background-wip-Cynthia-xmyri.mp3' },
  { pattern: /absent\s*wip\s*\(\s*2\s*\)\.wav/i, out: 'absent-wip-Cynthia-xmyri.mp3' },
];

const inputDir = process.argv[2] || path.join(projectRoot, 'bgm-source');
const outputDir = process.argv[3] || path.join(projectRoot, 'public', 'sounds', 'bgm');

if (!fs.existsSync(inputDir)) {
  console.error('输入目录不存在:', inputDir);
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });

const files = fs.readdirSync(inputDir);
let converted = 0;
for (const entry of INPUT_MAP) {
  const wav = files.find((f) => entry.pattern.test(f));
  if (!wav) {
    console.warn('未找到匹配文件:', entry.pattern.toString());
    continue;
  }
  const inputPath = path.join(inputDir, wav);
  const outputPath = path.join(outputDir, entry.out);
  console.log('Converting:', wav, '->', entry.out);
  execSync(
    `ffmpeg -y -i "${inputPath}" -codec:a libmp3lame -qscale:a 2 "${outputPath}"`,
    { stdio: 'inherit' }
  );
  converted++;
}
console.log('Done. Converted', converted, 'files. Output:', outputDir);
