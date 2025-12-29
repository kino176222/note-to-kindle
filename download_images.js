const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const matter = require('gray-matter');

const SOURCE_FILE = 'source.md';
const IMAGES_DIR = 'images';
const OUTPUT_FILE = 'processed_manuscript.md';

async function downloadImage(url, filename) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(filename);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download ${url}:`, error.message);
    }
}

async function processFile() {
    await fs.ensureDir(IMAGES_DIR);
    
    const content = await fs.readFile(SOURCE_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // 正規表現で画像リンクを抽出: ![alt](url)
    const imgRegex = /!\[(.*?)\]\((https:\/\/assets\.st-note\.com\/.*?)\)/g;
    let match;
    let count = 0;

    const downloads = [];
    const replacements = [];

    // 画像URLの検索とダウンロード予約
    while ((match = imgRegex.exec(mdBody)) !== null) {
        const altText = match[1];
        const originalUrl = match[2];
        // クエリパラメータを除去して拡張子を取得
        const cleanUrl = originalUrl.split('?')[0];
        const ext = path.extname(cleanUrl) || '.jpg';
        const filename = `image_${String(count).padStart(3, '0')}${ext}`;
        const localPath = path.join(IMAGES_DIR, filename);

        console.log(`Found image: ${originalUrl} -> ${localPath}`);
        
        downloads.push(downloadImage(originalUrl, localPath));
        
        // 置換用データの保存
        replacements.push({
            original: match[0],
            new: `![${altText}](${localPath})`
        });
        
        count++;
    }

    // 全画像のダウンロード実行
    console.log('Downloading images...');
    await Promise.all(downloads);
    console.log('Download complete.');

    // マークダウン内のリンクを置換
    replacements.forEach(rep => {
        mdBody = mdBody.replace(rep.original, rep.new);
    });

    // 結果を保存
    await fs.writeFile(OUTPUT_FILE, mdBody);
    console.log(`Processed file saved to ${OUTPUT_FILE}`);
}

processFile();
