
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function compactCodeBlock() {
    console.log('Compacting Code Block lines...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to find the AI Rules code block
    // It is now marked as ```markdown ... ``` (from previous fix)
    // and contains "AI Rules & Guidelines"

    const blockRegex = /```markdown([\s\S]*?)```/g;

    content = content.replace(blockRegex, (match, innerContent) => {
        if (innerContent.includes('AI Rules & Guidelines')) {
            console.log('Found AI Rules block, compacting...');

            // Remove multiple newlines, reducing them to single newline
            // But preserving structure.
            // Replace \n\s*\n with \n

            let compactContent = innerContent.replace(/\n\s*\n/g, '\n');

            // Also trim leading/trailing newlines
            compactContent = compactContent.trim();

            return '```markdown\n' + compactContent + '\n```';
        }
        return match;
    });

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Code block compacted.');
}

compactCodeBlock().catch(console.error);
