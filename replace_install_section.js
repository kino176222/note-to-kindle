
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function replaceInstallSection() {
    console.log('Rewriting Installation Section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Regex to match the section to be replaced
    // Start: "さあ、執事をあなたのPCに招き入れましょう。"
    // End: Implicitly until the next instruction or just capture the paragraph.
    // The original text involves external links and "ここでは詳細説明を省きます".

    // Pattern:
    // さあ、執事をあなたのPCに招き入れましょう。
    // ... (lines) ...
    // (Until some end marker? Let's check the context again or use a broad replace if unique)

    // Since grep found line 349, I will replace that paragraph block.
    // I'll construct a regex that captures the old link reference.

    const targetBlockRegex = /さあ、執事をあなたのPCに招き入れましょう。[\s\S]*?(?=##|\n\n\n)/;
    // Caution: this might be too aggressive if "##" is far away.
    // Let's use a more specific match based on typical content.
    // "インストール手順は、こちらの記事が非常に分かりやすいです"

    const exactTarget = /さあ、執事をあなたのPCに招き入れましょう。[\s\S]*?詳細説明を省きます）[\s\S]*?\[.*?\]\(.*?\)[\s\S]*?(?=\n\n|\n▲)/;

    // Since I don't know the ExACT text of the link, I'll try to find the anchor sentence and replace following lines.

    const anchor = "さあ、執事をあなたのPCに招き入れましょう。";
    const index = content.indexOf(anchor);

    if (index === -1) {
        console.error("Anchor text not found.");
        return;
    }

    // Manually splice standard replacement
    // Note: The specific matching logic via regex is safer if we know the end.
    // Let's assume the block ends before the next '##' or '▲' or just replace a chunk of lines.
    // The user said: "Remove the external note intro".

    // I will replace the text starting from anchor, and covering the next ~10 lines that likely contain the link.
    // Instead of guessing, I will replace the text "インストール手順は、こちらの記事が" ... up to the link.

    // New Content
    const newSection = `さあ、執事をあなたのPCに招き入れましょう。

公式サイト：[https://antigravity.google](https://antigravity.google)

![Antigravity Install](/Users/kino/Developer/note-to-kindle/images/antigravity_install.png)

やり方は簡単です。
上のサイトにアクセスして、**「Download for MacOS」**（またはWindows）を押してダウンロードするだけ。

あとは画面の指示に従ってインストールし、**Googleアカウントでログイン** すれば完了です。

細かい設定はいりません。
スクショの通りに進めれば大丈夫なので、サクッと済ませてしまいましょう。`;

    // Regex to replace the old bulky description
    // Matches: Anchor + anything until "ログインまで進めてください。" (from user prompt imply) or similar end.
    // Actually, looking at previous regex attempts, matching by exact keywords is best.

    // Old text likely contains: "こちらの記事が非常に分かりやすいです"
    // I will replace [Anchor ... <some existing link>] with [NewSection]

    // Let's just use replace on the Anchor + the "bad" sentence.
    content = content.replace(
        /さあ、執事をあなたのPCに招き入れましょう。[\s\S]*?(?=## |<div|▼|▲)/,
        // We assume it ends before next header or UI delimiter
        newSection + "\n\n"
    );

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Installation section updated.');
}

replaceInstallSection().catch(console.error);
