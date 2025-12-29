
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function updateChapterHeadings() {
    console.log('Updating chapter headings to 第○章 format...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Replace chapter headings
    // Pattern: ## 0章：... → ## 第0章 ...
    // Pattern: ## 1章：... → ## 第1章 ...

    content = content.replace(/^## 0章：(.+)$/gm, '## 第0章 $1');
    content = content.replace(/^## 1章：(.+)$/gm, '## 第1章 $1');
    content = content.replace(/^## 2章：(.+)$/gm, '## 第2章 $1');
    content = content.replace(/^## 3章：(.+)$/gm, '## 第3章 $1');
    content = content.replace(/^## 4章：(.+)$/gm, '## 第4章 $1');
    content = content.replace(/^## 5章：(.+)$/gm, '## 第5章 $1');
    content = content.replace(/^## 6章：(.+)$/gm, '## 第6章 $1');
    content = content.replace(/^## 7章：(.+)$/gm, '## 第7章 $1');
    content = content.replace(/^## 8章：(.+)$/gm, '## 第8章 $1');
    content = content.replace(/^## ９章(.+)$/gm, '## 第9章$1');
    content = content.replace(/^## 10章：(.+)$/gm, '## 第10章 $1');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Chapter headings updated.');
}

updateChapterHeadings().catch(console.error);
