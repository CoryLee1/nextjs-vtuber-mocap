const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const figmaTokenMatch = envFile.match(/FIGMA_PAT=(.*)/);
if (!figmaTokenMatch) {
  console.error('FIGMA_PAT not found in .env.local');
  process.exit(1);
}
const FIGMA_TOKEN = figmaTokenMatch[1].trim();
const FILE_KEY = 'SbqimktgOKSM7cnvWGs8hk';

const NODE_IDS = [
  '632:773', '632:762', '632:749', '632:738', '632:692', '632:784', 
  '632:819', '632:709', '632:854', '632:887', '632:981', '632:1018', 
  '632:1105', '632:1196', '632:1287', '632:1378', '632:1469', '632:1560'
];

const ASSETS_DIR = path.join(__dirname, '../public/v1-assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function figmaApi(endpoint) {
  const url = `https://api.figma.com/v1/${endpoint}`;
  const response = await fetch(url, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(ASSETS_DIR, filename));
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(path.join(ASSETS_DIR, filename), () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('Fetching Figma node data...');
    const nodesData = await figmaApi(`files/${FILE_KEY}/nodes?ids=${NODE_IDS.join(',')}`);
    fs.writeFileSync(path.join(__dirname, '../src/app/v1/design-data.json'), JSON.stringify(nodesData, null, 2));
    console.log('Saved design-data.json');

    console.log('Fetching image URLs...');
    // Try smaller batches or url encoding if needed, although : is usually fine.
    // Figma API might fail if too many nodes are requested for export at once.
    const BATCH_SIZE = 5;
    const imageUrls = {};
    
    for (let i = 0; i < NODE_IDS.length; i += BATCH_SIZE) {
      const batch = NODE_IDS.slice(i, i + BATCH_SIZE);
      console.log(`Fetching batch: ${batch.join(',')}`);
      try {
        const batchResponse = await figmaApi(`images/${FILE_KEY}?ids=${batch.join(',')}&format=png&scale=2`);
        Object.assign(imageUrls, batchResponse.images);
      } catch (err) {
        console.error(`Error fetching batch ${batch}:`, err.message);
      }
    }

    for (const [id, url] of Object.entries(imageUrls)) {
      if (url) {
        const filename = `${id.replace(':', '-')}.png`;
        console.log(`Downloading ${filename}...`);
        await downloadImage(url, filename);
      }
    }
    console.log('All assets downloaded successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
