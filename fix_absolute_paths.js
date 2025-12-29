const fs = require('fs-extra');

async function fixAbsolutePaths() {
    console.log('絶対パスを相対パスに修正中...');

    // Read HTML
    let html = await fs.readFile('/Users/kino/Desktop/kindle_upload/vibe_coding_kindle.html', 'utf8');

    // Fix absolute paths to relative paths
    html = html.replace(/src="\/Users\/kino\/Developer\/note-to-kindle\/images\//g, 'src="images/');
    html = html.replace(/src="\/Users\/kino\/Desktop\/kindle_upload\/images\//g, 'src="images/');

    // Save updated HTML
    await fs.writeFile('/Users/kino/Desktop/kindle_upload/vibe_coding_kindle.html', html, 'utf8');

    console.log('✅ 絶対パスを相対パスに修正完了');
}

fixAbsolutePaths().catch(console.error);
