
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function replaceGifs() {
    console.log('Replacing GIFs with Screenshots...');
    let content = await fs.readFile(masterPath, 'utf8');

    // URLs found:
    // 1. https://assets.st-note.com/.../picture_pc_df6f9f5a6cb9b6513c48dfc35e042a09.gif (Likely Red Omikuji)
    // 2. https://assets.st-note.com/.../picture_pc_6cee3cb64f2cbcdb88e299ef2ca151a0.gif (Likely Cyber Omikuji)
    // 3. https://assets.st-note.com/.../picture_pc_e8074d42710ec596db0b891de0d9a123.gif (Unknown)

    // Strategy: Replace by exact match or sequential logic.
    // Since grep output gave line numbers, sequential is risky if file changed.
    // Direct URL matching is safest.

    // 1. Red Omikuji
    content = content.replace(
        'https://assets.st-note.com/production/uploads/images/239161073/picture_pc_df6f9f5a6cb9b6513c48dfc35e042a09.gif?width=1200',
        '/Users/kino/Developer/note-to-kindle/images/omikuji_red.png'
    );

    // 2. Cyber Omikuji
    content = content.replace(
        'https://assets.st-note.com/production/uploads/images/239164392/picture_pc_6cee3cb64f2cbcdb88e299ef2ca151a0.gif?width=1200',
        '/Users/kino/Developer/note-to-kindle/images/omikuji_cyber.png'
    );

    // Note: If there is a 3rd GIF, we leave it for now or ask user.

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('GIFs replaced.');
}

replaceGifs().catch(console.error);
