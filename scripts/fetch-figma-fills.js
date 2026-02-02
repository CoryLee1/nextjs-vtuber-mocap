const fs = require('fs');
const path = require('path');

const designDataPath = path.join(__dirname, '../src/app/v1/design-data.json');
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const figmaTokenMatch = envFile.match(/FIGMA_PAT=(.*)/);
const FIGMA_TOKEN = figmaTokenMatch[1].trim();
const FILE_KEY = 'SbqimktgOKSM7cnvWGs8hk';

async function main() {
  const data = JSON.parse(fs.readFileSync(designDataPath, 'utf8'));
  const imageRefs = new Set();

  function findImageRefs(node) {
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          imageRefs.add(fill.imageRef);
        }
      }
    }
    if (node.children) {
      for (const child of node.children) {
        findImageRefs(child);
      }
    }
  }

  // Iterate over nodes in design-data.json
  for (const nodeId in data.nodes) {
    findImageRefs(data.nodes[nodeId].document);
  }

  console.log(`Found ${imageRefs.size} unique image references.`);

  if (imageRefs.size > 0) {
    const url = `https://api.figma.com/v1/files/${FILE_KEY}/images`;
    const response = await fetch(url, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN }
    });
    const imageData = await response.json();
    const metaPath = path.join(__dirname, '../src/app/v1/image-meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(imageData.meta.images, null, 2));
    console.log('Saved image-meta.json');

    const assetsDir = path.join(__dirname, '../public/v1-assets/fills');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    for (const [ref, imageUrl] of Object.entries(imageData.meta.images)) {
      if (imageRefs.has(ref)) {
        const filename = `${ref}.png`;
        console.log(`Downloading fill: ${filename}...`);
        const fileResponse = await fetch(imageUrl);
        const buffer = await fileResponse.arrayBuffer();
        fs.writeFileSync(path.join(assetsDir, filename), Buffer.from(buffer));
      }
    }
    console.log('All image fills downloaded.');
  }
}

main();
