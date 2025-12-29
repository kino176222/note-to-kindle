
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function cleanupAndRewriteVercel() {
    console.log('Cleaning up tail content and rewriting Vercel section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. Remove everything after "それをAIに愚痴ってください。それがあなたの次回作になります。"
    const cutoffText = "それをAIに愚痴ってください。それがあなたの次回作になります。";
    const cutoffIndex = content.indexOf(cutoffText);

    if (cutoffIndex !== -1) {
        // Keep everything up to and including this line, then add a nice ending
        content = content.substring(0, cutoffIndex + cutoffText.length);
        content += "\n\n本書は以上です。素晴らしいVibe Codingライフを！\n";
        console.log('Tail content removed.');
    }

    // 2. Rewrite Vercel section (around line 2163)
    // Find "### 8.3 Vercelの登録" or similar
    const vercelSectionRegex = /###\s*8\.3\s*Vercelの登録[\s\S]*?(?=###|本書は以上です|$)/;

    const newVercelContent = `### 8.3 Vercelの登録

Vercel公式サイト：[https://vercel.com](https://vercel.com)

![Vercel Signup](/Users/kino/Developer/note-to-kindle/images/vercel_signup.png)

**手順**

1. 公式サイトにアクセスし、「Sign Up」を押す
2. 「Hobby」プランを選択し、名前を入力
3. 「Continue with GitHub」を押して、さっき作ったGitHubアカウントと連携する

これで登録完了です！

**【コピペ用プロンプト】**

\`\`\`
作ったアプリを全世界に公開したいです。
Vercelのセットアップをフォローしてください。
\`\`\`

※ここも英語の画面が出ますが、読む必要はありません。
いつも通り、**スクショを撮ってAIに聞きながら**進めましょう。

`;

    if (vercelSectionRegex.test(content)) {
        content = content.replace(vercelSectionRegex, newVercelContent);
        console.log('Vercel section rewritten.');
    } else {
        console.log('Vercel section not found with regex, trying simpler match...');
        // Fallback: find "8.3 Vercelの登録" and replace until next section
        const simpleMatch = "### 8.3 Vercelの登録";
        if (content.includes(simpleMatch)) {
            const startIdx = content.indexOf(simpleMatch);
            const nextSection = content.indexOf("###", startIdx + simpleMatch.length);
            const endIdx = nextSection !== -1 ? nextSection : content.length;

            content = content.substring(0, startIdx) + newVercelContent + content.substring(endIdx);
            console.log('Vercel section rewritten (fallback method).');
        }
    }

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Cleanup and rewrite complete.');
}

cleanupAndRewriteVercel().catch(console.error);
