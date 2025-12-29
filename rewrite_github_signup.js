
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function rewriteGithubSignup() {
    console.log('Rewriting GitHub Signup Section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Matches the GitHub OGP text or related context
    // Target: "GitHub · Change is constant. GitHub keeps you ahead."
    // Or just look for the GitHub link block.

    // I will try to find the OGP title text first.
    let target = "GitHub · Change is constant. GitHub keeps you ahead.";

    if (!content.includes(target)) {
        // Fallback: look for generic GitHub link section
        // Maybe "GitHubのアカウント作成" header?
        target = "GitHubのアカウント作成";
    }

    // Since I can't be 100% sure of the exact OGP text present in MD (it might be just a URL),
    // I will search for the relevant section using keywords.

    // The user provided prompt implies:
    // Existing text: "GitHub · Change is constant..." (This is likely the text of a link card)

    // Let's assume the user pasted exactly what is in the doc.
    const replacement = `GitHub公式サイト：[https://github.com](https://github.com)

**手順**

1. 公式サイトにアクセス
2. 画面右上の「Sign up」をクリック
3. 英語の入力画面が出てきたら...
   👉 **迷わずスクショ → AIに質問**

「この画面になったんだけど、どうすればいい？」と聞けば、AIが全ての入力項目を日本語で教えてくれます。これも練習です！`;

    // Strategy: Find the line containing the "GitHub link" or "OGP text" and replace the surrounding block.
    // I'll use regex to separate content around "GitHub" URL if needed.

    // Attempt to match the block containing the old link/text
    const regex = /\[?GitHub · Change is constant.*?\]?\(.*?\)/;
    // Or just the URL

    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        await fs.writeFile(masterPath, content, 'utf8');
        console.log('GitHub section rewritten (Regex match).');
    } else {
        // Try searching for the text literal
        if (content.includes("GitHub · Change is constant")) {
            // Replacing line by line might be tricky without knowing context, so I'll try to match the paragraph
            content = content.replace(/.*GitHub · Change is constant.*/, replacement);
            await fs.writeFile(masterPath, content, 'utf8');
            console.log('GitHub section rewritten (Literal match).');
        } else {
            // If not found, look for "STEP 4" or "GitHub" chapter to guide manual fix?
            // But I'll try just appending/replacing usage of https://github.com/

            // Let's assume the user is correct about the text existing.
            console.error('Target GitHub text not found.');
        }
    }
}

rewriteGithubSignup().catch(console.error);
