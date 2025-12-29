
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function forceBoldToHtml() {
    console.log('Forcing bold markers to HTML tags...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to find **Text** and convert to <strong>Text</strong>
    // To avoid breaking Code Blocks or matching across paragraphs, we restrict:
    // 1. No newlines inside (single line bold)
    // 2. Not greedy
    // 3. We try to avoid matching inside backticks if possible, but simple regex is hard.
    //    However, usually ** is not valid inside inline code `...` anyway in Markdown (it renders literal).
    //    So changing it to <strong> inside text is What User Wants usually.
    //    Exponentiation usage (2 ** 3) usually has spaces? "2 ** 3".
    //    Our regex requires non-space boundary? Markdown standard does.
    //    But here we just want to catch the text User complained about: **「...」**

    // Pattern: ** followed by non-space, content, then non-space followed by **
    // Note: Japanese chars are non-space.

    // We will use a function to ignore code blocks ``` ... ```
    // Split by code blocks?

    const parts = content.split(/(```[\s\S]*?```|`[^`]*?`)/g);

    const fixedParts = parts.map(part => {
        // If it starts with backticks, it's code. Return as is.
        if (part.startsWith('`')) return part;

        // Text part: Replace ** ... **
        return part.replace(/\*\*([^\s].*?[^\s])\*\*/g, '<strong>$1</strong>')
            .replace(/\*\*([^\s])\*\*/g, '<strong>$1</strong>'); // Single char bold
    });

    content = fixedParts.join('');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Bold markers forced to HTML strong tags.');
}

forceBoldToHtml().catch(console.error);
