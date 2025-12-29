const fs = require('fs-extra');
const https = require('https');
const path = require('path');

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

async function fixExternalImages() {
    console.log('外部画像URLを修正中...');

    // Read master markdown
    let content = await fs.readFile('/Users/kino/Desktop/vibe_coding_master.md', 'utf8');

    // Find all external image URLs
    const urlPattern = /!\[([^\]]*)\]\((https:\/\/assets\.st-note\.com\/[^)]+)\)/g;
    const matches = [...content.matchAll(urlPattern)];

    console.log(`外部画像URL: ${matches.length}個発見`);

    // Download each image and replace URL
    for (let i = 0; i < matches.length; i++) {
        const [fullMatch, altText, url] = matches[i];
        const imageFilename = `external_image_${i + 1}.jpg`;
        const imagePath = `/Users/kino/Developer/note-to-kindle/images/${imageFilename}`;

        console.log(`ダウンロード中 (${i + 1}/${matches.length}): ${url}`);

        try {
            await downloadImage(url, imagePath);

            // Replace URL with local path
            content = content.replace(url, `images/${imageFilename}`);

            console.log(`✅ 保存完了: ${imageFilename}`);
        } catch (error) {
            console.error(`❌ ダウンロード失敗: ${url}`);
            console.error(error.message);
        }
    }

    // Save updated markdown
    await fs.writeFile('/Users/kino/Desktop/vibe_coding_master.md', content, 'utf8');

    console.log('');
    console.log('✅ 外部画像URLの修正完了');
    console.log('次のステップ: HTMLを再生成してください');
}

fixExternalImages().catch(console.error);
