#!/usr/bin/env node
/**
 * 将 Echuu_Private_UserList - Sheet1.csv 中的用户导入为已注册用户（密码为空，仅邮箱可登录）
 * 用法：node scripts/import-angels-from-csv.js [CSV路径]
 * 默认 CSV：src/app/v1/assets/ECHUU V1 UX_icon/Echuu_Private_UserList - Sheet1.csv
 */
const path = require('path');
const fs = require('fs');

// 加载 .env
function loadEnv(dir) {
  const envPath = path.join(dir, '.env');
  const localPath = path.join(dir, '.env.local');
  [envPath, localPath].forEach((p) => {
    if (!fs.existsSync(p)) return;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) {
        let v = m[2].trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        process.env[m[1]] = v;
      }
    });
  });
}
const root = path.join(__dirname, '..');
loadEnv(root);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultCsvPath = path.join(root, 'src/app/v1/assets/ECHUU V1 UX_icon/Echuu_Private_UserList - Sheet1.csv');

function parseCsvLine(line) {
  const parts = line.split(',');
  const name = (parts[0] || '').trim();
  const email = (parts[1] || '').trim().toLowerCase();
  return { name: name || null, email };
}

async function main() {
  const csvPath = process.argv[2] || defaultCsvPath;
  if (!fs.existsSync(csvPath)) {
    console.error('CSV 不存在:', csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0];
  const dataLines = header.toLowerCase().includes('email') ? lines.slice(1) : lines;

  let created = 0;
  let skipped = 0;

  for (const line of dataLines) {
    const { name, email } = parseCsvLine(line);
    if (!email || !email.includes('@')) {
      skipped++;
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: null, // 密码为空，仅邮箱即可登录
        },
      });
      created++;
      console.log('  +', email, name || '');
    } catch (e) {
      if (e.code === 'P2002') {
        skipped++;
        // 已存在，跳过
      } else {
        console.error('  失败', email, e.message);
      }
    }
  }

  console.log('\n完成: 新增', created, '，跳过/无效', skipped);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
