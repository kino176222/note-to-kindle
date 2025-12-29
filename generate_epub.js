const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const epub = require('epub-gen');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_EPUB = '/Users/kino/Desktop/vibe_coding_book.epub'; // ユーザーがデスクトップで見つけやすいように

async function generateEpub() {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });

    const content = await fs.readFile(INPUT_FILE, 'utf8');

    // Frontmatter除去
    const parsed = matter(content);
    let mdBody = parsed.content;

    // 画像パスの修正 (絶対パスにしないとepub-genが画像を拾えない場合があるため)
    // images/image_xxx.jpg -> /Users/kino/Developer/note-to-kindle/images/image_xxx.jpg
    const currentDir = process.cwd();
    mdBody = mdBody.replace(/\(images\//g, `(${path.join(currentDir, 'images')}/`);

    // チャプター分割
    // ## (H2) を章の区切りとする
    const chapters = [];
    const lines = mdBody.split('\n');
    let currentChapter = { title: "はじめに", content: "" };

    // 最初の章（タイトル行までスキップしつつ、まえがきを抽出）
    // NOTE: 簡易的な実装です。

    let buffer = [];

    for (const line of lines) {
        if (line.match(/^##\s/)) {
            // 前の章を保存
            if (buffer.length > 0) {
                currentChapter.content = md.render(buffer.join('\n'));
                chapters.push(currentChapter);
            }
            // 新しい章の開始
            const title = line.replace(/^##\s/, '').trim();
            currentChapter = { title: title, content: "" };
            buffer = [];
        } else {
            buffer.push(line);
        }
    }
    // 最後の章を保存
    if (buffer.length > 0) {
        currentChapter.content = md.render(buffer.join('\n'));
        chapters.push(currentChapter);
    }

    const options = {
        title: "【完全無料】初心者向けVibe Coding入門",
        author: "Kino",
        publisher: "Kino Publishing",
        cover: path.join(currentDir, 'images', 'image_000.png'), // 見出し画像をカバーにする（仮）
        content: chapters,
        css: `
            body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
            h1, h2 { text-align: center; page-break-before: always; }
            img { max-width: 100%; height: auto; display: block; margin: 1em auto; }
            blockquote { 
                background: #f9f9f9; 
                border-left: 5px solid #ccc; 
                margin: 1.5em 10px; 
                padding: 0.5em 10px; 
            }
            code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 4px; }
            pre { background-color: #f4f4f4; padding: 10px; overflow-x: auto; }
        `
    };

    console.log("Generating EPUB...");

    try {
        await new epub(options, OUTPUT_EPUB).promise;
        console.log(`EPUB Generated Successfully: ${OUTPUT_EPUB}`);
    } catch (err) {
        console.error("Failed to generate EPUB:", err);
    }
}

generateEpub();
