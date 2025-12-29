const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_final_v3.html';

// 簡易MIMEタイプ判定
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.gif') return 'image/gif';
    return 'image/octet-stream';
}

async function generateHtmlBook() {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });

    // ---------------------------------------------------------
    // 1. 画像レンダラー (Base64埋め込み)
    // ---------------------------------------------------------
    const defaultRender = md.renderer.rules.image || function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

    md.renderer.rules.image = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const srcIndex = token.attrIndex('src');
        let src = token.attrs[srcIndex][1];

        if (!src.startsWith('http') && !src.startsWith('data:')) {
            const localPath = path.join(process.cwd(), src);
            if (fs.existsSync(localPath)) {
                const imgData = fs.readFileSync(localPath);
                const base64Image = Buffer.from(imgData).toString('base64');
                const mimeType = getMimeType(localPath);
                src = `data:${mimeType};base64,${base64Image}`;
                token.attrs[srcIndex][1] = src;
            }
        }
        return defaultRender(tokens, idx, options, env, self);
    };

    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // ---------------------------------------------------------
    // 2. テキスト前処理 (タイトル掃除 & バグ修正)
    // ---------------------------------------------------------

    // 太字バグ修正
    mdBody = mdBody.replace(/\*\*\s*\n\s*/g, '**');
    mdBody = mdBody.replace(/\s*\n\s*\*\*/g, '**');

    // リンク残骸の一掃
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*.*?\]\((https:\/\/.*?)\)/g, '**$1** ($2)');
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, '**$1**');
    mdBody = mdBody.replace(/g# AI Rules/g, '# AI Rules');
    mdBody = mdBody.replace(/;yb/g, '');
    mdBody = mdBody.replace(/🔴.*?(\n|$)/g, '');

    // タイトルの掃除 (重複番号の削除)
    // 例: ## 7章 1. 開発開始の儀式... -> ## 7章 開発開始の儀式...
    // 例: ## 0章：まずはこれだけ -> ## まずはこれだけ
    // 例: ## 1章：Vibe Codingという考え方 -> ## Vibe Codingという考え方
    // Markdownの本文を走査して置換するのは危険なので、目次生成時のH2/H3抽出ロジック内でクリーンアップする

    // ---------------------------------------------------------
    // 3. テキストからHTMLへの変換 & 構造解析
    // ---------------------------------------------------------

    // H2/H3 のレンダラーでクラスを付与
    let chapterCount = 0;
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const level = token.tag;

        if (level === 'h2') {
            chapterCount++;
            token.attrSet('id', `chapter-${chapterCount}`);
            // バナーを直前に挿入する処理は後で行う（titleが必要なため）
            return `<${level} ${self.renderAttrs(token)}>`;
        }

        if (level === 'h3') {
            token.attrSet('class', 'styled-h3');
            return `<${level} ${self.renderAttrs(token)}>`;
        }

        return self.renderToken(tokens, idx, options);
    };

    let htmlBody = md.render(mdBody);

    // ---------------------------------------------------------
    // 4. HTML整形 (タイトル掃除 & バナー挿入)
    // ---------------------------------------------------------
    // H2の中身を取り出し、クリーンアップして、バナー化する

    // 章番号カウンターのリセット
    let h2Counter = 0;

    htmlBody = htmlBody.replace(/<h2 id="(chapter-\d+)">(.*?)<\/h2>/g, (match, id, rawTitle) => {
        h2Counter++;

        // タイトル掃除
        // "7章 1. 開発" -> "開発"
        // "0章：まずは" -> "まずは"
        // "1章 : Vibe" -> "Vibe"
        let cleanTitle = rawTitle;
        cleanTitle = cleanTitle.replace(/^\d+章\s*[:：]?\s*/, ''); // "1章：" を消す
        cleanTitle = cleanTitle.replace(/^\d+\.\s*/, ''); // "1. " を消す
        cleanTitle = cleanTitle.replace(/（.*?）/, ''); // （概念）とかを消してスッキリさせる（お好みで）→ 今回は残す
        cleanTitle = cleanTitle.trim();

        const chapterNumStr = `第${h2Counter}章`;

        // バナー生成 (画像2枚目のオマージュ)
        const bannerHtml = `
        <div class="chapter-banner page-break" id="${id}">
            <div class="banner-inner">
                <div class="banner-num">${chapterNumStr}</div>
                <div class="banner-title">${cleanTitle}</div>
            </div>
        </div>
        `;
        // H2タグ自体は目次ジャンプ先として必要だが、バナーにIDをつけたので消してもいい。
        // しかしKindleの論理目地のためにはHタグがあったほうが無難だが、今回は自前TOCを使うのでバナーが実質の見出し。

        return bannerHtml;
    });

    // 小見出し（H3）の掃除
    // "1-1 xxx" みたいな連番を自動で振るために、既存のH3内のテキストを掃除して
    // <h3 class="styled-h3"><span class="h3-label">1-1</span> タイトル</h3> 形式にする

    // ここは正規表現で一括置換は難しい（章番号との連動が必要）
    // 簡易的に "X.X " みたいな数字を消すだけに留め、連番付与はCSSカウンタで行う手もあるが、
    // HTML構造を変えるのが確実。

    // 再度パースするのは重いので、HTML文字列操作で頑張る
    // 現在の章番号を知る必要がある... replaceのコールバックだけでは状態を持てない（非同期ではないので持てるが）

    // 戦略変更: H2が見つかるたびに章番号更新、H3が見つかるたびに連番更新
    let currentChapNum = 0;
    let currentSubNum = 0;

    htmlBody = htmlBody.replace(/(<div class="chapter-banner.*?<\/div>)|(<h3 class="styled-h3">.*?<\/h3>)/gs, (match, bannerPart, h3Part) => {

        if (bannerPart) {
            currentChapNum++;
            currentSubNum = 0;
            return match; // バナーはさっき生成したばかりなのでそのまま
        }

        if (h3Part) {
            currentSubNum++;
            // H3の中身を取り出す
            let content = h3Part.replace(/<h3 class="styled-h3">(.*?)<\/h3>/, '$1');

            // 掃除 "1.1 Vibeとは" -> "Vibeとは"
            content = content.replace(/^\d+(\.\d+)?\s*/, '');
            content = content.trim();

            const numStr = `${currentChapNum}-${currentSubNum}`;

            // 黄色い帯デザイン (画像3枚目オマージュ)
            return `<h3 class="styled-h3"><span class="h3-num">${numStr}</span> ${content}</h3>`;
        }
    });

    // ---------------------------------------------------------
    // 目次生成 (掃除後のタイトルを使う)
    // ---------------------------------------------------------
    // htmlBody から バナーとH3を抽出して目次を作る（ソースから作るより確実）

    let tocHtml = `<div class="toc-container page-break"><h2 style="border:none; text-align:center;">目次</h2><ul class="toc-root">`;

    const bannerRegex = /<div class="banner-num">(.*?)<\/div>\s*<div class="banner-title">(.*?)<\/div>/g;
    const h3Regex = /<h3 class="styled-h3"><span class="h3-num">(.*?)<\/span>\s*(.*?)<\/h3>/g;

    // 全体を走査して目次ツリーを作るのは正規表現だと辛いので
    // 一旦リストアップする

    // 単純化のため、matchAll で全部抜いて、出現順に処理
    const tags = htmlBody.matchAll(/(<div class="banner-num">.*?<\/div>\s*<div class="banner-title">.*?<\/div>)|(<h3 class="styled-h3">.*?<\/h3>)/gs);

    // 構築
    // ...実装コスト削減のため、簡易的なHTML解析を行う
    const cheerio = require('cheerio'); // もし使えれば楽だが、なければ正規表現で。
    // 今回は正規表現ループで。

    // 再度走査
    const tocMatches = [];
    const re = /(?:<div class="chapter-banner.*?id="(chapter-(\d+))".*?<div class="banner-num">(.*?)<\/div>\s*<div class="banner-title">(.*?)<\/div>)|(?:<h3 class="styled-h3"><span class="h3-num">(.*?)<\/span>\s*(.*?)<\/h3>)/gs;

    let m;
    let lastChapter = null;
    const tocTree = [];

    while ((m = re.exec(htmlBody)) !== null) {
        if (m[1]) { // H2 (Chapter)
            const id = m[1];
            const numText = m[3]; // 第1章
            const title = m[4];
            lastChapter = { id, numText, title, subs: [] };
            tocTree.push(lastChapter);
        } else { // H3
            if (lastChapter) {
                const num = m[5];
                const title = m[6];
                lastChapter.subs.push({ num, title });
            }
        }
    }

    // 目次HTML組み立て (画像1枚目風: 青字リンク、インデント、リーダーなし)
    tocHtml = `<div class="toc-container page-break"><div class="toc-header">MOKUJI</div><ul class="toc-root">`;
    tocTree.forEach(c => {
        tocHtml += `
        <li class="toc-chap-item">
            <a href="#${c.id}" class="toc-chap-link">${c.numText}　${c.title}</a>
            ${c.subs.length > 0 ? `
            <ul class="toc-sub-list">
                ${c.subs.map(s => `
                    <li><a href="#sub-${s.num.replace('.', '-')}" class="toc-sub-link"><span class="toc-s-num">${s.num}</span> ${s.title}</a></li>
                `).join('')}
            </ul>
            ` : ''}
        </li>`;
    });
    tocHtml += `</ul></div>`;

    // H3にアンカー用のIDを振るのを忘れていたので、htmlBodyをH3の出現順に再度置換してIDを埋め込む
    let h3Idx = 0;
    htmlBody = htmlBody.replace(/<h3 class="styled-h3">/g, () => {
        // ここでの正確なマッピングは難しいが、上から順であれば整合するはず
        // ただし toctree のサブインデックスと合わせる必要がある
        // toctree flatten
        const flatSubs = tocTree.flatMap(c => c.subs);
        if (h3Idx < flatSubs.length) {
            const s = flatSubs[h3Idx++];
            // id="sub-1-1"
            return `<h3 id="sub-${s.num.replace('.', '-')}" class="styled-h3">`;
        }
        return `<h3 class="styled-h3">`;
    });


    // ---------------------------------------------------------
    // コンポーネント (まえがき・著者紹介)
    // ---------------------------------------------------------
    const preface = `
    <div class="preface page-break">
        <h2 style="border:none; text-align:left; font-size: 1.5em; border-bottom: 2px solid #333; display:inline-block; margin-bottom: 30px;">はじめに</h2>
        <div class="preface-body">
            <p>「プログラミングなんて、自分には縁がない」</p>
            <p>ずっとそう思っていました。<br>難しいコード、黒い画面、謎のエラー……。<br>「作りたいもの」はあるのに、その扉はいつも重く閉ざされていて、私には開け方すら分からなかったのです。</p>
            <p>でも、時代は変わりました。</p>
            <p>私が出会ったのは <strong>「Vibe Coding（バイブ・コーディング）」</strong>。</p>
            <p>これは、気合を入れて勉強する方法ではありません。<br>AIという最強の相棒と、「こんなの作りたい！」「ここ直して！」と会話しながら、ノリと勢い（Vibe）で形にしていく、新しいモノづくりのスタイルです。</p>
            <p>この本は、そんな「AIを使ったモノづくりの楽しさ」を、マンガや図解を交えながら、誰にでも分かるように全力でシェアするために書きました。</p>
            <div style="text-align:right; margin-top:40px; font-weight:bold;">Kino</div>
        </div>
    </div>
    `;

    const bioBox = `
    <div class="bio-box page-break">
        <h3>著者プロフィール</h3>
        <p><strong>Kino</strong></p>
        <p>AIと共に「つくる楽しさ」を探求するクリエイター。</p>
        <p>技術の壁をVibe（ノリと勢い）で乗り越える「Vibe Coding」を提唱。</p>
        <p>note: <a href="https://note.com/kino_11">https://note.com/kino_11</a></p>
    </div>
    `;

    // ---------------------------------------------------------
    // CSS : 画像オマージュ & 視認性UP
    // ---------------------------------------------------------
    const css = `
    <style>
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 2.0; 
            color: #333; 
            margin: 0; padding: 0;
            background: #fff;
            font-size: 18px; 
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 50px 20px;
        }
        a { color: #0056b3; text-decoration: none; }
        
        .page-break { page-break-before: always; }

        /* 章扉バナー (画像2枚目オマージュ) */
        .chapter-banner {
            margin: 80px 0 60px 0;
            padding: 10px;
            /* 暖色系のグラデ枠線 */
            background: linear-gradient(to right, #ff9966, #ff5e62); 
            border-radius: 4px;
            box-shadow: 0 4px 15px rgba(255, 94, 98, 0.3);
        }
        .banner-inner {
            background: #fff;
            padding: 30px 20px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            min-height: 120px;
        }
        .banner-num {
            font-size: 1.8em;
            color: #d35400; /* 濃いオレンジ */
            font-weight: bold;
            margin-right: 30px;
            border-right: 2px solid #eee;
            padding-right: 30px;
            white-space: nowrap;
        }
        .banner-title {
            font-size: 1.8em;
            font-weight: bold;
            line-height: 1.3;
            color: #222;
        }

        /* 小見出し (画像3枚目オマージュ: 黄色帯) */
        h3.styled-h3 {
            background: #ffe066; /* 鮮やかな黄色 */
            padding: 10px 15px;
            font-size: 1.4em;
            color: #333;
            font-weight: bold;
            margin-top: 60px;
            margin-bottom: 20px;
            border-left: 8px solid #f1c40f; /* 濃い黄色アクセント */
            border-radius: 2px;
        }
        .h3-num {
            margin-right: 10px;
            font-family: Arial, sans-serif;
        }

        /* 目次 (画像1枚目オマージュ: スッキリ青リンク) */
        .toc-header {
            text-align: right;
            font-size: 0.9em;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .toc-root { list-style: none; padding: 0; }
        .toc-chap-item { margin-bottom: 25px; }
        
        .toc-chap-link {
            font-size: 1.3em;
            font-weight: bold;
            color: #222; /* 親は黒 */
            display: block;
            margin-bottom: 8px;
            border-left: 4px solid #0056b3;
            padding-left: 10px;
        }
        .toc-sub-list {
            list-style: none;
            padding-left: 20px;
        }
        .toc-sub-list li {
            margin-bottom: 8px;
        }
        .toc-sub-link {
            font-size: 1.05em;
            color: #0056b3; /* 子は青 */
            text-decoration: underline;
            text-decoration-color: #cce5ff;
        }

        /* 著者紹介 */
        .bio-box {
            background: #fcfcfc;
            border: 1px solid #ddd;
            padding: 30px;
            border-radius: 8px;
        }
    </style>
    `;

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>【完全無料】初心者向けVibe Coding入門</title>
        ${css}
    </head>
    <body>
        
        <!-- 表紙 -->
        <div class="cover" style="height: 95vh; display: flex; flex-direction: column; justify-content: center; text-align:center; background: #fff; color: #333; padding: 20px; border: 20px solid #ffe066;">
            <p style="color: #f39c12; letter-spacing: 0.2em; font-weight: bold;">Vibe Coding Series</p>
            <h1 style="font-size: 4em; margin: 20px 0; line-height: 1.1;">Vibe<br>Coding<br><span style="font-size:0.5em; font-weight:300;">完全入門</span></h1>
            <p style="font-size: 1.3em; margin-top: 30px; color: #555;">AIと対話してアプリを作る技術</p>
            <div style="margin-top: 50px; font-size: 1.5em; font-weight: bold;">Kino</div>
        </div>
        
        <div class="container">
            ${preface}
            ${tocHtml}
            ${htmlBody}
            ${bioBox}
        </div>

    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
