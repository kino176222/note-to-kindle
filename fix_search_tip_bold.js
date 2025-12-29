
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixSearchTipBold() {
    console.log('Fixing bold rendering for search tip...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to find the broken bold ** ... **
    // The user screenshot shows spaces inside: ** 「Antigravity...」 **
    // Or maybe just the brackets.
    // I'll replace any variation of **「Antigravity インストール」** with <strong>...</strong>

    // Pattern: ** (optional space) 「Antigravity (optional space) インストール」 (optional space) **
    const regex = /\*\*\s*[「\[]Antigravity\s+インストール[」\]]\s*\*\*/g;
    // Also try simple string replace if regex is tricky due to escaping

    // Attempt 1: exact string I likely wrote
    content = content.replace('**「Antigravity インストール」**', '<strong>「Antigravity インストール」</strong>');

    // Attempt 2: Variation closer to what user sees if spaces were added
    content = content.replace('** 「Antigravity インストール」 **', '<strong>「Antigravity インストール」</strong>');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Search tip bold fixed.');
}

fixSearchTipBold().catch(console.error);
