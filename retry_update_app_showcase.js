
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function retryUpdateAppShowcase() {
    console.log('Retrying App Showcase Update...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Simpler target string from grep output (ignoring Markdown syntax characters for match)
    const uniquePart = "「本物のURL」が発行されます。";

    // Check if it exists
    if (!content.includes(uniquePart)) {
        console.error('Even the simpler target text was not found. Please check file manually.');
        return;
    }

    // Find the full line or paragraph containing this.
    // I want to replace the text "処理が終わると....発行されます。" with the new block.

    // Regex for the line ending with that unique part
    const lineRegex = /.*「本物のURL」が発行されます。/;

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
    console.log('App Showcase Updated (Retry Successful).');
}

retryUpdateAppShowcase().catch(console.error);
