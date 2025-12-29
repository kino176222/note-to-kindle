const fs = require('fs-extra');

async function superCleanMarkdown() {
    console.log('🧹 MarkdownのHTMLタグ完全除去を開始します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // 1. 具体的なHTMLタグの除去（属性があってもマッチするように）
    const tagsToRemove = [
        'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'strong', 'em', 'b', 'i', 'br', 'hr', 'blockquote',
        'ul', 'ol', 'li', 'pre', 'code'
    ];

    // 開始タグ <tag ...> と 終了タグ </tag> を削除
    // コンテンツは残す

    // まず <strong>...</strong> のような中身のあるものをMarkdown記法に変換できるものはする
    // strong -> **
    content = content.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**');
    content = content.replace(/<b[^>]*>([\s\S]*?)<\/b>/g, '**$1**');
    content = content.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*');
    content = content.replace(/<i[^>]*>([\s\S]*?)<\/i>/g, '*$1*');

    // Hタグ -> #
    content = content.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, '\n# $1\n');
    content = content.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n');
    content = content.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n');

    // 残りのタグを削除
    for (const tag of tagsToRemove) {
        const regexOpen = new RegExp(`<${tag}[^>]*>`, 'gi');
        const regexClose = new RegExp(`<\/${tag}>`, 'gi');
        content = content.replace(regexOpen, '');
        content = content.replace(regexClose, '');
    }

    // 2. 汎用的なHTMLタグ除去（念のため）
    // ただし、 <http...> や <user@example.com> は残したいので、
    // <[a-z]+ ...> のような形式をターゲットにする
    // ここは慎重に、あきらかにHTMLタグっぽいものだけ消す
    content = content.replace(/<div[\s\S]*?>/gi, '');
    content = content.replace(/<\/div>/gi, '');
    content = content.replace(/<span[\s\S]*?>/gi, '');
    content = content.replace(/<\/span>/gi, '');
    content = content.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ''); // styleタグとその中身も消す

    // 3. 連続する空行を詰める
    content = content.replace(/\n{3,}/g, '\n\n');

    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('✅ HTMLタグの完全除去完了');
}

superCleanMarkdown().catch(console.error);
