
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function multipleTextFixes() {
    console.log('Applying multiple text fixes...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. Remove "STEP 5で" from Vercel text
    content = content.replace(
        /STEP 5で「Vercel」にデプロイすれば、発行されたURLをスマホに送るだけで、自分のスマホで動かせます。家宝になりますよ。/g,
        '「Vercel」にデプロイすれば、発行されたURLをスマホに送るだけで、自分のスマホで動かせます。\n家宝になりますよ。'
    );

    // 2. Remove "Manga Gallery" and "CYBER OMIKUJI 2077" text labels
    // These are likely bold headings above the showcase images
    content = content.replace(/\*\*Manga Gallery\*\*/g, '');
    content = content.replace(/\*\*CYBER OMIKUJI 2077\*\*/g, '');

    // Also try without bold
    content = content.replace(/^Manga Gallery$/gm, '');
    content = content.replace(/^CYBER OMIKUJI 2077$/gm, '');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Text fixes applied.');
}

multipleTextFixes().catch(console.error);
