const fs = require('fs-extra');
const path = require('path');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_FILE = 'kindle_draft.md';

async function refine() {
    let content = await fs.readFile(INPUT_FILE, 'utf8');

    // 1. 不要なタグ・行の削除
    content = content.replace(/<div style="page-break-before: always;"><\/div>/g, ''); // 一旦改ページ削除（HTML生成時に制御するため）
    // 4. 太字の改行またぎ修正 (これが原因で ** が残る)
    // "**テキスト\nテキスト**" -> "**テキストテキスト**" (改行を除去して連結)
    // または、Markdownパーサーが解釈できるようにする
    content = content.replace(/\*\*\s*\n\s*(.*?)\s*\n?\s*\*\*/gs, '**$1**');

    // ★修正: 太字記法を認識させるため、前後にスペースを強制挿入
    // **文字** -> [スペース]**文字**[スペース]
    // これによりMarkdownパーサーが文中の強調として正しく認識する
    content = content.replace(/\*\*(.*?)\*\*/g, ' **$1** ');

    // 単純な改行またぎの修正
    content = content.replace(/\*\*\s*\n\s*/g, '**');
    content = content.replace(/\s*\n\s*\*\*/g, '**');

    // 7. 箇条書きの修正
    // "-完全無料" のようにスペースがない、または直前の改行不足でリストにならない問題を解消
    // 行頭の "- " ではない "-" を "- " にする
    content = content.replace(/^-(?=[^\s-])/gm, '- ');
    // リストの前に必ず空行を入れる（Markdownの仕様対策）
    content = content.replace(/([^\n])\n- /g, '$1\n\n- ');

    // 5. 第1章（ブログタイトル）の削除
    content = content.replace(/^##\s*【完全無料】.*(\n|$)/m, '');

    // ★重要: 「Vibe Codingの極意」セクションの修正
    // 改行が崩れている箇所を正しい文章に一括置換
    const wrongText = /STEP 1に進む前に、[\s\S]*?彼は疲れを知らない執事です。/;
    const correctText = `
これから読み進める前に、 **これだけは絶対に覚えておいてください。** これをやらないと、100%挫折します。

**◼️自分で手を動かし、調べる（でも、独りじゃない）**

![画像](images/image_005.jpg)

こんな書籍を書いておきながら矛盾するようですが、AIにコードを書いてもらうとしても、 **「自分で手を動かして、調べて、学ぶ姿勢」が一番大事です。**

「全部お任せ」ではなく、「どういう仕組み？」とAIに聞きながら、自分の知識として **腹落ちさせていく** 。これがVibe Codingの醍醐味です。

とは言え、最初は壁があります。
特に **環境設定** などでは、 **英語の公式サイト** を見たり、謎の英語エラーが出たりして、「うっ」となる瞬間があるでしょう。

**そこで「スクショ」の出番です。**

英語のページも、意味不明なエラー画面も、全部スクショしてAIに投げてください。
「これどういう意味？」「次は何ボタンを押せばいい？」と聞けば、AIが完璧な翻訳ガイドになってくれます。

- ❌ 英語だ、分からない、怖い…（思考停止）
- ⭕️ **スクショして「解説して！」と投げる。** （AIという最強の翻訳こんにゃくを使う）

<div class="hint-box">
<strong>💡 攻略のヒント：英語とエラーは、スクショで解決</strong>
<p>悩む時間はゼロでいい。浮いた時間で「中身の理解」に時間を使いましょう。</p>
</div>

**◼️ AIを「使い倒す」**

遠慮は無用です。
「こんなこと聞いたら恥ずかしいかな…」なんて思う必要はありません。
彼は疲れを知らない執事です。
`;
    content = content.replace(wrongText, correctText);

    // テキスト置換（第2章->このあと）
    content = content.replace(/（第2章で解説）を使って/, '（このあと解説）を使って');

    // ★追加: 文中の不要な改行を削除して段落結合
    // 1. Vibe Codingとは...
    content = content.replace(/(作り方。)\s*\n\s*(従来の)/g, '$1$2');
    // 2. あなたは...
    content = content.replace(/(伝えるだけ。)\s*\n\s*(実際の)/g, '$1$2');
    content = content.replace(/(作りたいか」)\s*\n\s*(「どうしたいか」)/g, '$1$2');
    // 3. 本章を読み終えたとき...
    content = content.replace(/(とき、)\s*\n\s*(あなたは)/g, '$1$2');
    // 4. 0地点とは...
    content = content.replace(/(0地点とは、)\s*\n\s*(「完璧に)/g, '$1$2');
    // 5. この「一歩目の軽さ」こそが...
    content = content.replace(/(一歩目の軽さ」こそが、)\s*\n\s*(Vibe Codingが)/g, '$1$2');
    content = content.replace(/(理由です。)\s*\n\s*(「まずは)/g, '$1$2');
    // 6. Gemini執事
    content = content.replace(/(設定は不要。)\s*\n\s*(あなたが)/g, '$1$2');
    content = content.replace(/(ことだけです。)\s*\n\s*(つまり)/g, '$1$2');

    // ▼記号削除
    content = content.replace(/▼/g, '');


    // ★追加: 4-2 「AIエディタとは何か」セクションの修正 (再定義: 段落構成をユーザー指定に合わせる)
    const wrongText42 = /### AIエディタとは何か[\s\S]*?「かしこまりました」[\s\S]*?正体です。/;
    const correctText42 = `
### AIエディタとは何か（黒い画面の正体）

![画像](images/image_009.jpg)

いきなり「Antigravity」と言われても、正直よく分かりませんよね。

まずは結論から。
AIエディタとは、文章やコードを“自分で全部書かなくても”、AIと一緒に編集できるエディタ です。

【普通のエディタとの違い】 
Windowsの「メモ帳」や、Macの「テキストエディット」を想像してください。

あれは、あなたがキーボードを叩かないと一文字も進みません。

でも、AIエディタは違います。
画面の横に、常に AIが待機 しています。
あなたがやるのは、これだけ。

- 「ここ、もっと分かりやすくして」
- 「この機能、追加したい」
- 「エラー出た。どうすればいい？」

するとAIが、
「かしこまりました」
と言って、文字やコードを勝手に書き換えてくれる 。

この **「命令して、作ってもらう」** というスタイルこそが、Vibe Codingの正体です。
`;
    // 以前の置換よりも広範囲（"正体です。"まで）を対象にするので注意、または以前の置換が先に走るならマッチしないかも?
    // 以前のロジックを上書きするために、この部分を単独で記述するか、もしくは以前のコードブロックを書き換える。
    // 今回は「const wrongText42」の定義ごと置き換えるのが安全。
    // 既存のコードにある `wrongText42` と `correctText42` を書き換える形にするため、Replacement範囲を工夫する。
    // replace_file_content で targetContent を既存の correctText42 定義ブロックにする。

    content = content.replace(wrongText42, correctText42);


    // ★追加: 文中の「エディタ」表記を「AIエディタ」に統一（文脈によるが安全な範囲で）
    // 例えば「Cursorというエディタ」->「CursorというAIエディタ」
    content = content.replace(/Cursorというエディタ/g, 'CursorというAIエディタ');
    content = content.replace(/AIコーディングエディタ/g, 'AIエディタ');

    // 区切り線除去 regex
    content = content.replace(/^---+\s*$/gm, '');
    content = content.replace(/<hr>/g, '');

    // 不要なテキスト削除
    content = content.replace(/こんにちは、Kinoです。(\n|$)/g, '');
    content = content.replace(/迷ったら、目次から気になった章だけ読んでもOKです。(\n|$)/g, '');

    // ★追加: 文中の不要な改行を削除して段落結合
    // 1. Vibe Codingとは...
    content = content.replace(/(作り方。)\s*\n\s*(従来の)/g, '$1$2');
    // 2. あなたは...
    content = content.replace(/(伝えるだけ。)\s*\n\s*(実際の)/g, '$1$2');
    // 3. 本章を読み終えたとき...
    content = content.replace(/(とき、)\s*\n\s*(あなたは)/g, '$1$2');
    // 4. 0地点とは...
    content = content.replace(/(0地点とは、)\s*\n\s*(「完璧に)/g, '$1$2');

    // 他の「TIP/鉄則」があれば変換（汎用的）
    // Markdownの複数行引用ブロックをHTMLのdivに変換
    // `> **【TIP/鉄則】**` で始まり、次の空行またはファイルの終わりまでを対象
    content = content.replace(/> \*\*【TIP\/鉄則】\*\*([\s\S]*?)(\n\n|$)/g, (match, p1, p2) => {
        // 各行の `>` を削除し、<p>タグで囲む
        const paragraphs = p1.split('\n> ').map(line => `<p>${line.trim()}</p>`).join('');
        return `<div class="hint-box"><h3>💡 攻略のヒント</h3>${paragraphs}</div>${p2}`;
    });

    // 冒頭のヘッダー画像削除 (image_000.png)
    content = content.replace(/!\[.*?\]\(images\/image_000\.png\)\n?/g, '');

    // 冒頭の著者リンク削除 (Kino)
    // [Kino](https://note.com/kino_11) のような形式
    content = content.replace(/^\[Kino\]\(https:\/\/note\.com\/.*?\)\n?/m, '');

    // 6. 章番号の残骸（9章など）を削除
    // "## 9章 Q&A" -> "## Q&A" (数字+章を消す)
    // generate_html側で連番を振るので、ここではテキストだけにする
    content = content.replace(/^##\s*[０-９\d]+章\s*/gm, '## ');
    content = content.replace(/^##\s*Q&A/gm, '## Q&A'); // Q&Aはそのまま見出しにしたいが、refineで数字を消す
    // 文中の "9章" などの残りカスも念のためチェック（見出し行のみ）
    content = content.replace(/^##\s*.*?([０-９\d]+章)[:：\s]*/gm, '## ');
    content = content.replace(/🔴.*?(\n|$)/g, ''); // 赤丸コメント削除
    content = content.replace(/;yb/g, '');
    content = content.replace(/g# AI Rules/g, '# AI Rules');

    // キャンペーンバナー削除 (image_068)
    content = content.replace(/\[!\[買うたび.*?\]\(images\/image_068\.jpg\)\].*?\n/s, '');
    // ハッシュタグ削除
    content = content.replace(/- \[\s*#無料\s*\]\(.*?\)\n/g, '');
    content = content.replace(/- \[\s*#バイブコーディング\s*\]\(.*?\)\n/g, '');

    // 2. QAの太字解除 & 見出しレベル下げ（目次に出さないため）
    // ### Q1. ... -> **Q1. ...**
    // 既存の太字解除ロジックと統合
    content = content.replace(/^###\s*(Q\d+.*?)$/gm, '**$1**');
    content = content.replace(/\*\*A\.\s(.*?)\*\*/g, 'A. $1');
    content = content.replace(/\*\*Q\d+\.\s(.*?)\*\*/g, 'Q. $1');

    // 3. 第1章と第2章の統合
    // 戦略: "## 2章：準備フェーズ" を削除し、その配下の "### 2.x" をすべて、連番をリセットせずとも
    // HTML生成側の自動採番に任せる形にする。
    // そのために、Markdown上の「x章」「x.x」というハードコードされた番号をすべて消す。

    // "## 1章：Vibe Coding..." -> "## Vibe Coding..."
    content = content.replace(/^##\s*\d+章\s*[:：]?\s*/gm, '## ');
    content = content.replace(/^##\s*0章\s*[:：]?\s*/gm, '## '); // 0章も
    content = content.replace(/^##\s*９章\s*[:：]?\s*/gm, '## '); // 全角数字対策
    content = content.replace(/^##\s*\d+章\s*/gm, '## ');

    // "### 1.1 Vibe Codingとは" -> "### Vibe Codingとは"
    content = content.replace(/^###\s*[\d\.-]+\s*/gm, '### ');

    // 第2章の統合
    // "## 準備フェーズ（AIと環境を整える）" という見出しを探して削除し、セクション区切りをなくす
    // ただし、見出し自体は残して「準備フェーズ」というセクションにしたいかもしれない
    // ユーザーは「統合していい」と言った。
    // なので、見出しレベルを ### に下げるか、もしくは単なる太字テキストにするか。
    // ここでは「## 準備フェーズ」を削除して、配下の ### コンテンツを直前の章（Vibe Coding章）に続ける形にする。

    // ただし、単純に消すと文脈が繋がらないので、「## 準備フェーズ」を「### 準備フェーズ」に置換して、
    // 第1章の中の1セクションとして扱うようにする。
    content = content.replace(/^##\s*準備フェーズ/gm, '### 準備フェーズ');

    // 他の章は ## のままなので、結果として
    // 旧1章 (##)
    //   ...
    //   旧2章 (### に格下げ)
    // 旧3章 (##) -> 新2章になる

    // これでHTML生成スクリプト側でH2をカウントすれば、自動的に章番号が繰り上がる。

    await fs.writeFile(OUTPUT_FILE, content);
    console.log(`Refined Markdown saved to ${OUTPUT_FILE}`);
}

refine();
