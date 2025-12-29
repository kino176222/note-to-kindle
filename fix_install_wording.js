
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function fixInstallWording() {
    console.log('Fixing install instruction wording...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Target the specific phrase generated in the previous step
    const target = "スクショの通りに進めれば大丈夫なので、サクッと済ませてしまいましょう。";

    const replacement = "もし分からないことがあっても大丈夫です。\nその画面を**スクショしてAIに貼り、「これどうすればいい？」と聞いて**みてください。\nAIが親切に教えてくれますし、それが一番の「Vibe Codingの練習」になります！";

    if (content.includes(target)) {
        content = content.replace(target, replacement);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('Wording fixed.');
    } else {
        console.log('Target phrase not found. Maybe already fixed?');
    }
}

fixInstallWording().catch(console.error);
