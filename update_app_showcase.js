
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function updateAppShowcase() {
    console.log('Updating App Showcase in Deployment Section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target: 処理が終わると、`https://...vercel.app` という**「本物のURL」**が発行されます。
    // Note: The previous grep showed <strong> tags might be present or not depending on context.
    // Grep line 2230: ...<strong>「本物のURL」</strong>が発行されます。

    // Original Text Context around line 2230.
    // I will replace the sentence and add the showcase below it.

    // I need to be careful not to delete subsequent text if it's important.
    // Likely the next lines are "Manga Gallery" or previous placeholders.

    // Let's replace the whole block if I can identify the range.
    // Or just insert AFTER the target line.

    const targetLineRegex = /処理が終わると、`https:\/\/.*vercel\.app` という.*「本物のURL」.*が発行されます。/;

    // New Content Block
    const newContent = `処理が終わると、\`https://...vercel.app\` という<strong>「本物のURL」</strong>が発行されます。
世界中の誰でもアクセスできる、あなたの作品の完成です！

![Manga Gallery Showcase](/Users/kino/Developer/note-to-kindle/images/showcase_manga.png)
**Manga Gallery**
[https://manga-gallery-sable.vercel.app](https://manga-gallery-sable.vercel.app)

![Cyber Omikuji Showcase](/Users/kino/Developer/note-to-kindle/images/showcase_omikuji.png)
**CYBER OMIKUJI 2077**
[https://omikuji-app-theta.vercel.app](https://omikuji-app-theta.vercel.app)`;

    if (targetLineRegex.test(content)) {
        content = content.replace(targetLineRegex, newContent);

        // Also clean up if there were old links right below it to avoid duplication?
        // Usage of "Manga Gallery" text might exist.
        // But since user is rewriting, assuming valid replacement.

        await fs.writeFile(masterPath, content, 'utf8');
        console.log('App Showcase Updated.');
    } else {
        console.error('Target URL sentence not found.');
    }
}

updateAppShowcase().catch(console.error);
