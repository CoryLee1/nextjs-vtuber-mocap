const fs = require('fs');
const path = require('path');

const designDataPath = path.join(__dirname, '../src/app/v1/design-data.json');

function main() {
  const data = JSON.parse(fs.readFileSync(designDataPath, 'utf8'));
  const mapping = {};

  function traverse(node) {
    if (node.fills) {
      for (const fill of node.fills) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          mapping[node.name] = fill.imageRef;
        }
      }
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const nodeId in data.nodes) {
    traverse(data.nodes[nodeId].document);
  }

  fs.writeFileSync(path.join(__dirname, '../src/app/v1/node-image-map.json'), JSON.stringify(mapping, null, 2));
  console.log('Saved node-image-map.json');
}

main();
