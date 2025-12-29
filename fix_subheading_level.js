
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixSubheadingLevel() {
    console.log('Fixing 2.5 heading level...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Change ## 2.5 to ### 2.5 (h2 to h3)
    content = content.replace(/^## 2\.5 画面の見方（図解）$/gm, '### 2.5 画面の見方（図解）');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Heading level fixed.');
}

fixSubheadingLevel().catch(console.error);
