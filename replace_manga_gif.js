
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function replaceMangaGif() {
    console.log('Replacing Manga Gallery GIF with Screenshot...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target GIF URL related to Manga Gallery
    // Found previously: https://assets.st-note.com/production/uploads/images/239178413/picture_pc_e8074d42710ec596db0b891de0d9a123.gif

    // Safety check: Find the text "AIから叩き台を作成したと報告があった" and replace the image nearby.
    // Or just replace the specific GIF URL if unique.

    // Let's replace the specific GIF URL found in previous grep (Line 1332)
    const gifUrl = "https://assets.st-note.com/production/uploads/images/239178413/picture_pc_e8074d42710ec596db0b891de0d9a123.gif?width=1200";

    if (content.includes(gifUrl)) {
        content = content.replace(gifUrl, '/Users/kino/Developer/note-to-kindle/images/manga_gallery_proto.png');
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Manga GIF replaced.');
    } else {
        // Fallback: search for nearby text?
        // User said: "Below the text 'AIから叩き台を作成したと報告があった'"
        console.error('Target GIF URL not found. Please verify manually.');
    }
}

replaceMangaGif().catch(console.error);
