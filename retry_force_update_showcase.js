
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function retryForceUpdateShowcase() {
    console.log('Force Updating App Showcase...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to match the line containing "本物のURL" regardless of tags
    const lineRegex = /.*「本物のURL」.*/;

    if (lineRegex.test(content)) {
        const newContent = `処理が終わると、\`https://...vercel.app\` という<strong>「本物のURL」</strong>が発行されます。
世界中の誰でもアクセスできる、あなたの作品の完成です！

![Manga Gallery Showcase](/Users/kino/Developer/note-to-kindle/images/showcase_manga.png)
**Manga Gallery**
[https://manga-gallery-sable.vercel.app](https://manga-gallery-sable.vercel.app)

![Cyber Omikuji Showcase](/Users/kino/Developer/note-to-kindle/images/showcase_omikuji.png)
**CYBER OMIKUJI 2077**
[https://omikuji-app-theta.vercel.app](https://omikuji-app-theta.vercel.app)`;

        content = content.replace(lineRegex, newContent);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('App Showcase Force Updated.');
    } else {
        console.error('CRITICAL: "本物のURL" keyword not found in file.');
    }
}

retryForceUpdateShowcase().catch(console.error);
