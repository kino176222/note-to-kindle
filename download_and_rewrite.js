const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const matter = require('gray-matter');

const SOURCE_FILE = 'source.md';
const IMAGES_DIR = 'images';
const OUTPUT_FILE = 'processed_manuscript.md';

// 待機関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImage(url, filename, retries = 3) {
    if (await fs.pathExists(filename)) {
        console.log(`Skipping existing: ${filename}`);
        return;
    }

    for (let i = 0; i < retries; i++) {
        try {
            await sleep(1000 * (i + 1)); // リトライ毎に待機時間を増やす

            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const writer = fs.createWriteStream(filename);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`Downloaded: ${filename}`);
            return;
        } catch (error) {
            console.warn(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i === retries - 1) console.error(`Failed to download ${url} after ${retries} attempts`);
        }
    }
}

async function processFile() {
    await fs.ensureDir(IMAGES_DIR);

    // ソースファイルから再読み込みせず、処理済みのものがあればそこから未取得画像だけ狙うのもありだが
    // ここではシンプルにソースから全走査し、ファイル有無でスキップ判定する
    const content = await fs.readFile(SOURCE_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    const imgRegex = /!\[(.*?)\]\((https:\/\/assets\.st-note\.com\/.*?)\)/g;
    let match;
    let count = 0;

    const tasks = [];
    const replacements = [];

    while ((match = imgRegex.exec(mdBody)) !== null) {
        const altText = match[1];
        const originalUrl = match[2];
        const cleanUrl = originalUrl.split('?')[0];
        const ext = path.extname(cleanUrl) || '.jpg';
        const filename = `image_${String(count).padStart(3, '0')}${ext}`;
        const localPath = path.join(IMAGES_DIR, filename);

        // ダウンロードタスクに追加（直列実行のために即時実行しない）
        tasks.push({ url: originalUrl, path: localPath });

        replacements.push({
            original: match[0],
            new: `![${altText}](${localPath})`
        });

        count++;
    }

    // 画像ダウンロード実行（直列処理でサーバー負荷を下げる）
    console.log(`Starting download for ${tasks.length} images...`);
    for (const task of tasks) {
        await downloadImage(task.url, task.path);
        await sleep(500); // 間隔を空ける
    }

    // Note用語のリライト処理
    console.log('Rewriting terms for Kindle...');
    replacements.forEach(rep => {
        mdBody = mdBody.replace(rep.original, rep.new);
    });

    const rewriteRules = [
        { from: /このNote/g, to: '本書' },
        { from: /この記事/g, to: '本章' },
        { from: /マガジン/g, to: 'シリーズ' },
        { from: /クリエイター/g, to: '著者' },
        { from: /スキ/g, to: '評価' },
        { from: /目次から「今やりたい章」だけ進めてください/g, to: '目次から気になった章だけ読んでもOKです' },
        { from: /（後で解説）/g, to: '（第2章で解説）' } // 具体的な章番号に
    ];

    rewriteRules.forEach(rule => {
        mdBody = mdBody.replace(rule.from, rule.to);
    });

    // 改ページ（Kindle用）の挿入: H2タグの前に改ページを入れる
    mdBody = mdBody.replace(/^(##\s)/gm, '<div style="page-break-before: always;"></div>\n\n$1');

    await fs.writeFile(OUTPUT_FILE, mdBody);
    console.log(`Processed manuscript saved to ${OUTPUT_FILE}`);
}

processFile();
