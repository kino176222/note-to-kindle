
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function insertFailureNoteLink() {
    console.log('Inserting Failure Note Link and Image...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target: <strong>⬇︎わたしの失敗談をまとめたnoteです。</strong>
    const target = "<strong>⬇︎わたしの失敗談をまとめたnoteです。</strong>";
    const replacement = `<strong>⬇︎わたしの失敗談をまとめたnoteです。</strong>

![MVP Failure Note](/Users/kino/Developer/note-to-kindle/images/mvp_failure_note.png)

[https://note.com/kino_11/n/nc41044eedfc6](https://note.com/kino_11/n/nc41044eedfc6)`;

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Failure Note Link inserted.');
    } else {
        const rawTarget = "⬇︎わたしの失敗談をまとめたnoteです。";
        if (content.includes(rawTarget)) {
            content = content.replace(rawTarget, replacement);
            await fs.writeFile(masterPath, content, 'utf8');
            console.log('Failure Note Link inserted (Fallback).');
        } else {
            console.error('Target text for Failure Note not found.');
        }
    }
}

insertFailureNoteLink().catch(console.error);
