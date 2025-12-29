const fs = require('fs-extra');

async function insertInlineTOC() {
    console.log('📖 目次リンク生成中...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // Headers to find: ## starting from 第0章 up to 第10章/FAQ
    // Regex for headers
    const headerRegex = /^(##\s+(.*))$/gm;
    let match;
    const tocLines = [];

    // Helper to generate pandoc-style IDs
    // This is an approximation. Pandoc preserves many non-ascii characters in recent versions.
    // Simplest approach: remove punctuation, space to hyphen.
    function generateId(text) {
        return text
            .toLowerCase()
            .replace(/[、。！(?:)（）]/g, '') // Remove some punctuation
            .replace(/\s+/g, '-')             // Space to hyphen
            .replace(/[^\w\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf-]/g, '') // Keep Japanese
            // Actually, let's look at the headers.
            // "第1章 Vibe Codingという考え方（概念）"
            // -> "第1章-vibe-codingという考え方概念"
            ;
    }

    // A more robust way creates explicit anchors!
    // We can replace the existing headers with headers that have explicit IDs.
    // e.g. ## 第1章 ... {#ch1}
    // Then link to #ch1. This is fail-safe.

    let newContent = content;
    const headers = [];

    // Scan content line by line to modify headers and build TOC
    const lines = content.split('\n');
    const finalLines = [];
    let chapterCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.startsWith('## ')) {
            // Check if it is a chapter we want in TOC
            const title = line.replace('## ', '').trim();
            // Assign a simple ID
            let id = '';
            if (title.startsWith('第')) {
                // Extract number or use counter
                const matchNum = title.match(/第(\d+)章/);
                if (matchNum) {
                    id = `chapter-${matchNum[1]}`;
                }
            } else if (title.includes('FAQ')) {
                id = 'chapter-faq';
            } else if (title.includes('AFTER')) {
                id = 'chapter-after';
            } else if (title.includes('まずはこれだけ')) {
                id = 'chapter-0';
            } else if (title.includes('クリア条件')) { // Specific one
                id = 'chapter-goal';
            }

            // Only add ID if we generated one, otherwise skip (e.g. big titles)
            if (id) {
                // If the line doesn't already have an ID (attributes)
                if (!line.includes('{')) {
                    line = `${line} {#${id}}`;
                } else {
                    // Extract existing ID if present?
                    // Usually we didn't add them yet.
                }
                headers.push({ title: title, id: id });
            }
        }
        finalLines.push(line);
    }

    // Construct formatting
    let tocMarkdown = '\n';
    headers.forEach(h => {
        tocMarkdown += `- [${h.title}](#${h.id})\n`;
    });
    tocMarkdown += '\n';

    // Insert TOC after target line
    const targetLine = '▼ 迷ったら、目次から「今やりたい章」だけ進めてください。';
    let outputString = finalLines.join('\n');

    if (outputString.includes(targetLine)) {
        // Only insert if not already there? 
        // Or replace if it exists to update it.
        // Let's replace the target line + any following list until next empty line or header
        // Simple approach: Replace the target line with Target + TOC

        // Remove old TOC if we previously generated it (check for existing links)
        // Hard to detect generic lists. 
        // We will just replace the target line.
        outputString = outputString.replace(targetLine, `${targetLine}\n${tocMarkdown}`);
    } else {
        console.warn('⚠️ Target line for TOC not found!');
    }

    await fs.writeFile(TARGET_FILE, outputString, 'utf8');
    console.log('✅ 目次リンクを生成し、見出しにIDを割り当てました');
}

insertInlineTOC().catch(console.error);
