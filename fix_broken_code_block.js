
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixBrokenCodeBlock() {
    console.log('Fixing broken code blocks...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to find the broken "AI Rules" block
    // It starts with ```ruby and contains AI Rules
    // We capture the content inside
    const blockRegex = /```ruby([\s\S]*?)```/g;

    content = content.replace(blockRegex, (match, innerContent) => {
        // Only process if it looks like the AI Rules block (safe check)
        if (innerContent.includes('AI Rules & Guidelines')) {
            console.log('Found AI Rules block, cleaning...');

            // 1. Fix strange 'g#' artifact -> '#'
            let cleanContent = innerContent.replace(/g# /g, '# ');

            // 2. Restore <strong> tags to ** markers
            cleanContent = cleanContent.replace(/<strong>/g, '**');
            cleanContent = cleanContent.replace(/<\/strong>/g, '**');

            // 3. Change language to markdown or text for better compatibility
            return '```markdown' + cleanContent + '```';
        }
        return match;
    });

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Code block fixed.');
}

fixBrokenCodeBlock().catch(console.error);
