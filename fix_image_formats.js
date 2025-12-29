const fs = require('fs-extra');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function convertImagesToCorrectFormat() {
    console.log('画像形式を確認・修正中...');

    const imagesDir = '/Users/kino/Desktop/kindle_upload/images';
    const files = await fs.readdir(imagesDir);

    let converted = 0;

    for (const file of files) {
        if (file.startsWith('external_image_') && file.endsWith('.jpg')) {
            const filePath = `${imagesDir}/${file}`;

            try {
                // Check file type
                const { stdout } = await execAsync(`file "${filePath}"`);

                if (stdout.includes('PNG image data')) {
                    // Convert PNG to JPG using sips (macOS built-in tool)
                    const newPath = filePath.replace('.jpg', '_temp.jpg');
                    await execAsync(`sips -s format jpeg "${filePath}" --out "${newPath}"`);
                    await fs.move(newPath, filePath, { overwrite: true });

                    console.log(`✅ 変換完了: ${file} (PNG → JPEG)`);
                    converted++;
                }
            } catch (error) {
                console.error(`❌ エラー: ${file}`, error.message);
            }
        }
    }

    console.log('');
    console.log(`✅ 画像形式の修正完了 (${converted}個変換)`);
}

convertImagesToCorrectFormat().catch(console.error);
