
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function replaceIntro() {
    console.log('Rewriting Introduction (Fixing Bold)...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Use HTML <strong> tags for critical emphasis to ensure visibility
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

本書のゴールは、「理解すること」ではなく<strong>「公開すること」</strong>です。
以下のクエストをクリアしたとき、あなたはもう立派な「Vibe Coder」です。

<div class="checklist-item"><span class="check-icon">✅</span> AIに日本語で頼みながらアプリを作る</div>
<div class="checklist-item"><span class="check-icon">✅</span> 作ったコードを<strong>GitHubに保存</strong>（セーブ）する</div>
<div class="checklist-item"><span class="check-icon">✅</span> <strong>Vercelで公開し、本物のURLを発行</strong>する</div>
<div class="checklist-item"><span class="check-icon">✅</span> エラーが出ても<strong>「スクショ → AI相談」</strong>で前に進める</div>

準備はいいですか？
それでは、冒険を始めましょう。

<div style="page-break-after: always;"></div>

`;

    const anchor = '## 0章';
    const parts = content.split(anchor);
    if (parts.length < 2) return;

    // Check if the intro is already replaced (to avoid duplication if anchors moved)
    // But since we split by anchor, we just replace the first part.

    // Note: If we run this again on the file that ALREADY has the new intro (which implies '## 0章' is there),
    // splitting by '## 0章' works fine. parts[0] is the current intro.

    const newContent = newIntro + anchor + parts[1];

    await fs.writeFile(masterPath, newContent, 'utf8');
    console.log('Introduction rewritten with strong tags.');
}

replaceIntro().catch(console.error);
