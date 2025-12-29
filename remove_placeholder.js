
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function removePlaceholderText() {
    console.log('Removing placeholder text...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Remove the placeholder line
    content = content.replace(/🔴ここになんか図をいれておくかなー（なんでもいいので）\n?/g, '');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Placeholder text removed.');
}

removePlaceholderText().catch(console.error);
