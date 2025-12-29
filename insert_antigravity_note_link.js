
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function insertAntigravityNoteLink() {
    console.log('Inserting Antigravity Note Link and Image...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target the specific text
    // Note: It might be wrapped in strong tags or raw depending on previous edits.
    // Grep showed: <strong>▼Antigravityのもう少し詳しい使い方を解説した記事です。</strong>

    const target = "<strong>▼Antigravityのもう少し詳しい使い方を解説した記事です。</strong>";
    const replacement = `<strong>▼Antigravityのもう少し詳しい使い方を解説した記事です。</strong>

![Antigravity Note](/Users/kino/Developer/note-to-kindle/images/antigravity_usage_note.png)

[https://note.com/kino_11/n/naae6275e29d6](https://note.com/kino_11/n/naae6275e29d6)`;

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Link and Image inserted.');
    } else {
        // Fallback: search without tags if not found
        const rawTarget = "▼Antigravityのもう少し詳しい使い方を解説した記事です。";
        if (content.includes(rawTarget)) {
            content = content.replace(rawTarget, replacement); // Replace raw with formatted block
            await fs.writeFile(masterPath, content, 'utf8');
            console.log('Link and Image inserted (Fallback match).');
        } else {
            console.error('Target text for Note Link not found.');
        }
    }
}

insertAntigravityNoteLink().catch(console.error);
