const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_final_v2.html';

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
    // 2. テキスト前処理 (徹底掃除)
    // ---------------------------------------------------------

    // 太字バグ修正
    mdBody = mdBody.replace(/\*\*\s*\n\s*/g, '**');
    mdBody = mdBody.replace(/\s*\n\s*\*\*/g, '**');

    // リンク残骸の一掃 (カードっぽい表記をシンプルなリンクテキストに)
    // 例: [**Vercel: ...**](https://...) -> **Vercel** (https://...)
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*.*?\]\((https:\/\/.*?)\)/g, '**$1** ($2)');
    mdBody = mdBody.replace(/\[\*\*(.*?)\*\*\]\((.*?)\)/g, '**$1**'); // タイトルのみ

    // 特定のゴミ
    mdBody = mdBody.replace(/g# AI Rules/g, '# AI Rules');
    mdBody = mdBody.replace(/;yb/g, '');
    mdBody = mdBody.replace(/🔴.*?(\n|$)/g, '');

    // ---------------------------------------------------------
    // 3. テキストからHTMLへの変換（自前ビルド回避）
    // ---------------------------------------------------------
    // 前回はMarkdownのテキスト自体を `<h3 id=...>` に書き換えてから md.render していたため、
    // Markdownパーサーがそれをエスケープしてしまい、画面にタグが表示される事故が起きました。
    // 今回は、Markdownパーサーの「レンダラー」をフックして、正しいHTMLを出力させます。

    // H2とH3のレンダラーをカスタマイズしてIDとクラスを付与
    let chapterCount = 0;

    // H2 (章) のレンダラー
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const level = token.tag; // h2, h3...

        if (level === 'h2') {
            chapterCount++;
            const id = `chapter-${chapterCount}`;
            // 目次用に保存したいが、ここは同期処理。
            // 簡易的に data-title 属性などをつけて後でスクレイピングするか、
            // 事前に構造解析するかだが、今回は「目次生成」は別途テキスト走査で行い、
            // ここでは「HTML出力時の装飾」に集中する。

            // 章扉（Chapter Cover）を直前に挿入するハック
            // 本来は token stream をいじるのが正解だが、ここでは close タグの後に挿入...いや open の前がいい
            // しかし renderer.rules はタグごとなので、素直にクラスをつける。
            token.attrSet('id', id);
            token.attrSet('class', 'chapter-start');
            return `<div class="chapter-cover page-break"><div class="chapter-num">CHAPTER ${chapterCount}</div><div class="chapter-deco"></div></div><${level} ${self.renderAttrs(token)}>`;
        }

        if (level === 'h3') {
            // H3には連番を振りたいが、complexになるので今回はシンプルなデザインにする
            token.attrSet('class', 'styled-h3');
            return `<${level} ${self.renderAttrs(token)}>`;
        }

        return self.renderToken(tokens, idx, options);
    };

    // 目次生成用の構造解析（レンダリングとは別に行う）
    const lines = mdBody.split('\n');
    let tocStruct = [];
    let chapNum = 0;
    let currChap = null;

    for (const line of lines) {
        const matchH2 = line.match(/^##\s+(.+)$/);
        const matchH3 = line.match(/^###\s+(.+)$/);

        if (matchH2) {
            chapNum++;
            // ここでMarkdown記号を除去してもいい
            const title = matchH2[1].replace(/\*\*/g, '');
            currChap = { id: `chapter-${chapNum}`, num: chapNum, title: title, subs: [] };
            tocStruct.push(currChap);
        } else if (matchH3 && currChap) {
            const title = matchH3[1].replace(/\*\*/g, '');
            const subNum = `${currChap.num}-${currChap.subs.length + 1}`;
            currChap.subs.push({ num: subNum, title: title });
        }
    }

    let htmlBody = md.render(mdBody);

    // 章扉の中にタイトルを入れるために、置換でハックする
    // <div ...></div><h2 ...>TITLE</h2> -> <div ...><div class="chapter-title-big">TITLE</div></div><h2 class="hidden">TITLE</h2>
    // 正規表現で生成後のHTMLを整形
    htmlBody = htmlBody.replace(
        /<div class="chapter-cover page-break"><div class="chapter-num">CHAPTER (\d+)<\/div><div class="chapter-deco"><\/div><\/div><h2 id="(.*?)" class="chapter-start">(.*?)<\/h2>/g,
        (match, num, id, title) => {
            return `
            <div class="chapter-cover page-break">
                <div class="chapter-num">CHAPTER ${num}</div>
                <div class="chapter-title-big">${title}</div>
                <div class="chapter-deco"></div>
            </div>
            <h2 id="${id}" class="hidden-h2">${title}</h2>
            `;
        }
    );


    // ---------------------------------------------------------
    // コンポーネント
    // ---------------------------------------------------------
    const preface = `
    <div class="preface page-break">
        <h2 style="border:none; text-align:center; font-size: 1.8em;">はじめに</h2>
        <div class="preface-body">
            <p>「プログラミングなんて、自分には縁がない」</p>
            <p>ずっとそう思っていました。<br>難しいコード、黒い画面、謎のエラー……。<br>「作りたいもの」はあるのに、その扉はいつも重く閉ざされていて、私には開け方すら分からなかったのです。</p>
            <p>でも、時代は変わりました。</p>
            <p>私が出会ったのは <strong>「Vibe Coding（バイブ・コーディング）」</strong>。</p>
            <p>これは、気合を入れて勉強する方法ではありません。<br>AIという最強の相棒と、「こんなの作りたい！」「ここ直して！」と会話しながら、ノリと勢い（Vibe）で形にしていく、新しいモノづくりのスタイルです。</p>
            <p>プログラミング経験ゼロだった私が、今では自分でWebアプリを作り、世界に公開し、誰かに「これ便利だよ」と手渡すことができるようになりました。</p>
            <p>「魔法使い」にはなれなくても、私たちには「魔法の杖（AI）」があります。</p>
            <p>この本は、そんな「AIを使ったモノづくりの楽しさ」を、マンガや図解を交えながら、誰にでも分かるように全力でシェアするために書きました。</p>
            <p>さあ、難しいことは抜きにして。<br>最初の一歩を、一緒に踏み出しましょう。</p>
            <div style="text-align:right; margin-top:50px;">Kino</div>
        </div>
    </div>
    `;

    // 著者紹介
    const bioBox = `
    <div class="bio-box">
        <h3>著者：Kino</h3>
        <p>AIと共に「つくる楽しさ」を探求するクリエイター。</p>
        <p>技術の壁をVibe（ノリと勢い）で乗り越える「Vibe Coding」を提唱し、初心者でもアプリ開発を楽しめる手法を発信中。</p>
        <p>note: <a href="https://note.com/kino_11">https://note.com/kino_11</a></p>
    </div>
    `;

    // 目次HTML化
    let tocHtml = `<div class="toc-container page-break"><h2 style="border:none; text-align:center;">目次</h2><ul class="toc-root">`;
    tocStruct.forEach(c => {
        tocHtml += `
        <li class="toc-chapter"><a href="#${c.id}">第${c.num}章 ${c.title}</a>
        ${c.subs.length > 0 ? `
            <ul class="toc-sub">
                ${c.subs.map((s, i) => {
            // リンク先IDが現状ないので、簡易的に親章へ飛ばすか、アンカーを作る必要があるが
            // 今回は見た目重視で省略（本来は body生成時にh3にidをつけるべき）
            return `<li><span class="toc-sub-num">${s.num}</span> ${s.title}</li>`
        }).join('')}
            </ul>
        ` : ''}
        </li>`;
    });
    tocHtml += `</ul></div>`;


    // ---------------------------------------------------------
    // CSS : 文字サイズ特大化 & 見やすさMAX
    // ---------------------------------------------------------
    const css = `
    <style>
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 2.1; /* 行間たっぷり */
            color: #111; /* 真っ黒より少し目に優しい */
            margin: 0; padding: 0;
            background: #fff;
            font-size: 20px; /* 文字サイズ標準より大きく */
        }
        .container {
            max-width: 800px; /* 横幅も少し広く */
            margin: 0 auto;
            padding: 60px 20px;
        }

        a { color: #0044aa; text-decoration: none; border-bottom: 1px solid #ddd; }
        
        .page-break { page-break-before: always; }

        /* 章扉 */
        .chapter-cover {
            height: 90vh; /* 画面いっぱい */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #f0f7ff;
            border: 4px solid #333;
            margin: 60px 0;
            position: relative;
            text-align: center;
            padding: 40px;
        }
        .chapter-num {
            font-size: 1.5em;
            letter-spacing: 0.2em;
            color: #0044aa;
            font-weight: bold;
            margin-bottom: 20px;
            z-index: 2;
        }
        .chapter-title-big {
            font-size: 2.8em;
            font-weight: 800;
            line-height: 1.2;
            z-index: 2;
        }
        .chapter-deco {
            position: absolute;
            background-image: radial-gradient(#ddd 1px, transparent 1px);
            background-size: 20px 20px;
            top: 0; left: 0; right: 0; bottom: 0;
            opacity: 0.5;
            z-index: 1;
        }

        /* 隠しH2 */
        h2.hidden-h2 {
            display: none; /* Kindle的には display:none は避けたほうがいいが、HTMLプレビュー優先 */
        }

        /* 小見出し */
        h3.styled-h3 {
            font-size: 1.6em;
            border-bottom: 3px solid #0044aa;
            padding-bottom: 10px;
            margin-top: 80px;
            margin-bottom: 30px;
            color: #222;
        }

        /* 強調 */
        strong {
            background: linear-gradient(transparent 60%, rgba(255, 240, 0, 0.4) 60%); /* 黄色マーカー */
        }

        /* リスト */
        li { margin-bottom: 15px; }

        /* コラム */
        blockquote {
            background: #fff8e1;
            border: 2px solid #ffecb3;
            border-radius: 12px;
            padding: 30px;
            margin: 50px 0;
            font-size: 0.95em;
        }

        /* 著者紹介 */
        .bio-box {
            border: 1px solid #ccc;
            background: #f9f9f9;
            padding: 40px;
            border-radius: 8px;
            margin-top: 100px;
        }

        /* 目次 */
        .toc-root { list-style: none; padding: 0; }
        .toc-chapter { margin-bottom: 30px; }
        .toc-chapter > a {
            font-size: 1.4em;
            font-weight: bold;
            color: #000;
            border: none;
            display: block;
            margin-bottom: 10px;
        }
        .toc-sub { 
            list-style: none; 
            padding-left: 20px; 
            border-left: 2px solid #eee;
        }
        .toc-sub li {
            font-size: 1.1em;
            color: #555;
            margin-bottom: 8px;
        }
        .toc-sub-num {
            color: #0044aa;
            font-weight: bold;
            margin-right: 10px;
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
        
        <div class="cover" style="height: 95vh; display: flex; flex-direction: column; justify-content: center; text-align:center; background: #111; color: #fff; padding: 20px;">
            <p style="color: #4da6ff; letter-spacing: 0.2em; font-weight: bold;">Vibe Coding Series</p>
            <h1 style="font-size: 4.5em; margin: 30px 0; line-height: 1;">Vibe<br>Coding<br><span style="font-size:0.5em; font-weight:300;">完全入門</span></h1>
            <p style="font-size: 1.4em; margin-top: 30px; color: #ccc;">AIと対話してアプリを作る技術</p>
            <div style="margin-top: 60px; font-size: 1.8em; font-weight: bold;">Kino</div>
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
