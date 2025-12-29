
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixTextStepReference() {
    console.log('Fixing text reference (STEP 5 -> Following Chapters)...');
    let content = await fs.readFile(masterPath, 'utf8');

    const target = "世界中に公開してドヤ顔する方法は、STEP 5でバッチリ解説します。";
    const replacement = "世界中に公開してドヤ顔する方法は、これ以降の章でバッチリ解説します。";

    // Try replace
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Reference fixed.');
    } else {
        // Fallback for slight variations
        // Try identifying by "世界中に公開してドヤ顔する方法"
        const regex = /世界中に公開してドヤ顔する方法は、.*?解説します。/;
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            await fs.writeFile(masterPath, content, 'utf8');
            console.log('Reference fixed (Regex match).');
        } else {
            console.error('Target text not found.');
        }
    }
}

fixTextStepReference().catch(console.error);
