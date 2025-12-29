
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function replaceIntro() {
    console.log('Rewriting Introduction...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Define the new Intro Markdown
    // Note: Using absolute path for the image for safety in local preview.
    const newIntro = `![Vibe Coding Cover](/Users/kino/Developer/note-to-kindle/images/book_cover_vibe.jpg)

# 【完全無料】初心者向けVibe Coding入門
## AIと対話してアプリを作り、世界に公開する冒険の書

**プロローグ：コードが書けないからこそ、最強になれる**

こんにちは、Kinoです。

あなたは今、「プログラミングなんて難しそうだ」「自分にはセンスがない」と思っていませんか？
実は、AI時代の今、その「素人感覚」こそが最強の武器になります。

本書は、プログラミングを「勉強」するための本ではありません。
AIという最強の相棒といっしょに手を動かし、あなたのアイデアを形にして、世界に公開するための「冒険の書」です。

## 本書のクリア条件（ゴール）

本書のゴールは、「理解すること」ではなく**「公開すること」**です。
以下のクエストをクリアしたとき、あなたはもう立派な「Vibe Coder」です。

<div class="checklist-item"><span class="check-icon">✅</span> AIに日本語で頼みながらアプリを作る</div>
<div class="checklist-item"><span class="check-icon">✅</span> 作ったコードを<strong>GitHubに保存</strong>（セーブ）する</div>
<div class="checklist-item"><span class="check-icon">✅</span> <strong>Vercelで公開し、本物のURLを発行</strong>する</div>
<div class="checklist-item"><span class="check-icon">✅</span> エラーが出ても<strong>「スクショ → AI相談」</strong>で前に進める</div>

準備はいいですか？
それでは、冒険を始めましょう。

<div style="page-break-after: always;"></div>

`;

    // Strategy: Replace from Start of File up to "## 0章"
    // Using split to be safe.
    const anchor = '## 0章';
    const parts = content.split(anchor);

    if (parts.length < 2) {
        console.error('Could not find anchor "## 0章". Aborting replacement.');
        return;
    }

    // parts[0] is the old intro. parts[1] is the rest.
    // Replace parts[0] with newIntro.
    // Keep '## 0章' (anchor) by adding it back.

    const newContent = newIntro + anchor + parts[1];

    await fs.writeFile(masterPath, newContent, 'utf8');
    console.log('Introduction rewritten successfully.');
}

replaceIntro().catch(console.error);
