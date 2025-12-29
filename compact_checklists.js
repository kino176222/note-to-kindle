
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function compactChecklists() {
    console.log('Compacting checklist items...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Pattern: 🔲 item\n\n🔲 item → 🔲 item\n🔲 item
    // Remove blank lines between checklist items

    // Replace multiple newlines between checkbox items with single newline
    content = content.replace(/(🔲[^\n]+)\n\n+(🔲)/g, '$1\n$2');
    content = content.replace(/(✅[^\n]+)\n\n+(✅)/g, '$1\n$2');
    content = content.replace(/(☐[^\n]+)\n\n+(☐)/g, '$1\n$2');
    content = content.replace(/(⬜[^\n]+)\n\n+(⬜)/g, '$1\n$2');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Checklist items compacted.');
}

compactChecklists().catch(console.error);
