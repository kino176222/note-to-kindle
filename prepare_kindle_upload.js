
const fs = require('fs-extra');

async function prepareKindleUpload() {
    console.log('Preparing Kindle upload package...');

    // Read the current HTML
    let html = await fs.readFile('/Users/kino/Desktop/vibe_coding_kindle_final.html', 'utf8');

    // Replace all absolute image paths with relative paths
    html = html.replace(/\/Users\/kino\/Developer\/note-to-kindle\/images\//g, 'images/');

    // Update title to be more descriptive
    html = html.replace(
        /<title>Vibe Coding入門<\/title>/,
        '<title>【完全無料】初心者向けVibe Coding入門：AIと対話してアプリを作る→Gitで保存→世界に公開</title>'
    );

    // Write to kindle_upload folder
    await fs.writeFile('/Users/kino/Desktop/kindle_upload/vibe_coding_kindle.html', html, 'utf8');

    console.log('✅ HTML prepared with relative image paths');
    console.log('✅ Title updated');
    console.log('📁 Upload package ready at: /Users/kino/Desktop/kindle_upload/');
    console.log('');
    console.log('📦 Package contents:');
    console.log('   - vibe_coding_kindle.html (main file)');
    console.log('   - images/ (folder with all images)');
}

prepareKindleUpload().catch(console.error);
