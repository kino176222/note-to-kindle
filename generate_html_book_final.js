const fs = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');
const matter = require('gray-matter');

const INPUT_FILE = 'processed_manuscript.md';
const OUTPUT_HTML = '/Users/kino/Desktop/vibe_coding_book_final.html';

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

    // 画像レンダラー (Base64埋め込み)
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

    // コンテンツ読み込み
    const content = await fs.readFile(INPUT_FILE, 'utf8');
    const parsed = matter(content);
    let mdBody = parsed.content;

    // ---------------------------------------------------------
    // テキスト前処理
    // ---------------------------------------------------------

    // 太字バグ修正
    mdBody = mdBody.replace(/\*\*\s*\n\s*/g, '**');
    mdBody = mdBody.replace(/\s*\n\s*\*\*/g, '**');

    // 著者URL等の修正
    mdBody = mdBody.replace(/\[\*\*Google Antigravity\*\*.*?\]\(.*?\)/g, '**公式サイト (antigravity.google) にアクセス**');
    mdBody = mdBody.replace(/Googleアカウントでログイン\*\* まで進めてください。/g, 'Googleアカウントでログイン** してください。');
    mdBody = mdBody.replace(/🔴.*?(\n|$)/g, '');
    mdBody = mdBody.replace(/g# AI Rules/g, '# AI Rules');
    mdBody = mdBody.replace(/;yb/g, '');

    // ---------------------------------------------------------
    // 目次生成 & 見出し書き換え (ID付与)
    // ---------------------------------------------------------
    const lines = mdBody.split('\n');
    let chapterCount = 0;

    // 目次用配列: { chapterNum: 1, title: "xxx", subSections: ["1-1 xxx", "1-2 xxx"] }
    let tocStruct = [];
    let currentChapter = null;
    let convertedBodyLines = [];

    for (const line of lines) {
        // H2 (章)
        const matchH2 = line.match(/^##\s+(.+)$/);
        // H3 (小見出し) -> 今回は簡易的に "### 1.1 xxx" のような形式を想定し、連番を振る
        const matchH3 = line.match(/^###\s+(.+)$/);

        if (matchH2) {
            chapterCount++;
            const title = matchH2[1];
            const id = `chapter-${chapterCount}`;

            currentChapter = {
                id: id,
                num: chapterCount,
                title: title,
                subSections: []
            };
            tocStruct.push(currentChapter);

            // 章扉（CSSアート）を挿入
            // H2タグ自体は見出しとして残すが、その前に派手な扉絵を入れる
            const chapterCover = `
            <div class="chapter-cover page-break">
                <div class="chapter-num">CHAPTER ${chapterCount}</div>
                <div class="chapter-title-big">${title}</div>
                <div class="chapter-deco"></div>
            </div>
            `;

            // Kindleでは見出し(h2)が論理目次のターゲットになるので、カバーの直後に配置
            // ただし視覚的にはカバーが大きいので、H2自体は隠すか控えめにする手もあるが、
            // ここではカバーの下に標準的な見出しとして配置する（目次ジャンプ先として分かりやすくするため）
            convertedBodyLines.push(chapterCover);
            convertedBodyLines.push(`<h2 id="${id}" class="hidden-h2">${title}</h2>`);

        } else if (matchH3 && currentChapter) {
            const title = matchH3[1];
            // 小見出し番号 (例: 1-1)
            const subNum = `${currentChapter.num}-${currentChapter.subSections.length + 1}`;
            const subId = `sub-${subNum}`;

            currentChapter.subSections.push({ id: subId, num: subNum, title: title });

            convertedBodyLines.push(`<h3 id="${subId}" class="styled-h3"><span class="sub-num">${subNum}</span> ${title}</h3>`);
        } else {
            convertedBodyLines.push(line);
        }
    }

    mdBody = convertedBodyLines.join('\n');

    // リスト（箇条書き）をチェックボックス風にする単純置換
    // - ✅ xxx -> そのまま
    // - - xxx -> チェックボックス風スタイル適用 (CSSでやるため、Markdownの時点ではクラスを当てられないが、
    // ここでは簡易的に全リストアイテムを対象にするCSSを書く)

    // ---------------------------------------------------------
    // HTML生成
    // ---------------------------------------------------------
    let htmlBody = md.render(mdBody);

    // ---------------------------------------------------------
    // パーツ作成
    // ---------------------------------------------------------

    // 1. まえがき
    const preface = `
    <div class="preface page-break">
        <h2 style="border:none; text-align:center;">はじめに</h2>
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

    // 2. 目次 (2カラム・階層型)
    let tocHtmlContent = `<ul class="toc-root">`;
    tocStruct.forEach(chap => {
        tocHtmlContent += `
        <li class="toc-chapter">
            <a href="#${chap.id}" class="toc-chap-link">第${chap.num}章 ${chap.title}</a>
            ${chap.subSections.length > 0 ? `
            <ul class="toc-sub">
                ${chap.subSections.map(sub => `
                    <li><a href="#${sub.id}"><span class="toc-sub-num">${sub.num}</span> ${sub.title}</a></li>
                `).join('')}
            </ul>
            ` : ''}
        </li>`;
    });
    tocHtmlContent += `</ul>`;

    const tocSection = `
    <div class="toc-container page-break">
        <h2 style="border:none; text-align:center; font-size:1.5em; margin-bottom: 40px;">目次</h2>
        ${tocHtmlContent}
    </div>
    `;

    // 3. 著者紹介
    const bioSection = `
    <div class="bio-box">
        <h3>著者：Kino</h3>
        <p>AIと共に「つくる楽しさ」を探求するクリエイター。</p>
        <p>技術の壁をVibe（ノリと勢い）で乗り越える「Vibe Coding」を提唱し、初心者でもアプリ開発を楽しめる手法を発信中。</p>
        <p>note: <a href="https://note.com/kino_11">https://note.com/kino_11</a></p>
    </div>
    `;

    // ---------------------------------------------------------
    // CSS (200点を目指すデザイン)
    // ---------------------------------------------------------
    const css = `
    <style>
        body { 
            font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Helvetica Neue", Arial, sans-serif;
            line-height: 1.9;
            color: #222;
            margin: 0; padding: 0;
            background: #fff;
        }
        /* コンテナ */
        .container {
            max-width: 750px;
            margin: 0 auto;
            padding: 40px 20px;
        }

        a { color: #0056b3; text-decoration: none; }
        
        /* 改ページ */
        .page-break { page-break-before: always; }

        /* 章扉 (CSSアート) */
        .chapter-cover {
            height: 80vh; /* ほぼ1ページ使う */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #f4f8fb; /* 薄い青 */
            border: 2px solid #222;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
            text-align: center;
            padding: 20px;
        }
        .chapter-num {
            font-size: 1.5em;
            letter-spacing: 0.2em;
            color: #0056b3;
            font-weight: bold;
            margin-bottom: 30px;
            z-index: 2;
        }
        .chapter-title-big {
            font-size: 2.5em;
            font-weight: 800;
            line-height: 1.3;
            z-index: 2;
        }
        .chapter-deco {
            position: absolute;
            background: linear-gradient(45deg, rgba(0,86,179,0.1) 25%, transparent 25%, transparent 50%, rgba(0,86,179,0.1) 50%, rgba(0,86,179,0.1) 75%, transparent 75%, transparent);
            background-size: 40px 40px;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1;
        }
        
        /* 隠しH2（機能としては残すが、見た目は隠す or 小さくする） */
        h2.hidden-h2 {
            font-size: 0; 
            margin: 0; height: 0; 
            border: none; padding: 0;
        }

        /* 小見出し (1-1 スタイル) */
        h3.styled-h3 {
            font-size: 1.4em;
            border-bottom: 2px solid #0056b3;
            padding-bottom: 8px;
            margin-top: 60px;
            color: #333;
        }
        .sub-num {
            color: #fff;
            background: #0056b3;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            margin-right: 8px;
            vertical-align: middle;
        }

        /* マーカー強調 */
        strong {
            background: linear-gradient(transparent 65%, rgba(0, 200, 255, 0.3) 65%);
        }

        /* アクションリスト（チェックボックス風） */
        li {
            list-style: none; /* デフォルトを消す */
            position: relative;
            padding-left: 1.5em;
            margin-bottom: 10px;
        }
        ul li::before {
            content: "☐";
            position: absolute;
            left: 0;
            color: #0056b3;
            font-weight: bold;
        }
        /* 番号付きはそのまま */
        ol li {
            list-style: decimal;
            padding-left: 0.5em;
        }
        ol li::before { content: none; }


        /* コラム (休憩スペース) */
        blockquote {
            background: #fffaf0; /* 薄いオレンジ */
            border: 2px dashed #f5cba7;
            border-radius: 10px;
            padding: 20px;
            margin: 40px 0;
            position: relative;
        }
        blockquote::before {
            content: "☕️ Break Time";
            display: block;
            font-weight: bold;
            color: #d35400;
            margin-bottom: 10px;
        }

        /* 目次デザイン */
        .toc-root { padding: 0; }
        .toc-chapter {
            margin-bottom: 20px;
        }
        .toc-chap-link {
            font-weight: bold;
            font-size: 1.2em;
            color: #000;
            border-bottom: 2px solid #eee;
            display: block;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        .toc-sub {
            padding-left: 20px;
        }
        .toc-sub li::before { content: none; } /* チェックボックス消す */
        .toc-sub a {
            color: #555;
            font-size: 0.95em;
            border-bottom: 1px dotted #ccc;
            display: block;
            padding: 5px 0;
        }
        .toc-sub-num {
            color: #0056b3;
            font-weight: bold;
            margin-right: 5px;
        }

        /* まえがき */
        .preface-body {
            font-size: 1.05em;
            line-height: 2.2;
        }

        /* 著者紹介 */
        .bio-box {
            background: #f4f8fb;
            padding: 30px;
            border-radius: 8px;
            margin-top: 50px;
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
        <div class="cover" style="height: 95vh; display: flex; flex-direction: column; justify-content: center; text-align:center; background: #222; color: #fff; padding: 20px;">
            <p style="color: #4da6ff; letter-spacing: 0.2em; font-weight: bold;">Vibe Coding Series</p>
            <h1 style="font-size: 4em; margin: 20px 0; line-height: 1.1;">Vibe<br>Coding<br><span style="font-size:0.5em; font-weight:300;">完全入門</span></h1>
            <p style="font-size: 1.2em; margin-top: 30px; color: #eee;">AIと対話してアプリを作る技術</p>
            <div style="margin-top: 50px; font-size: 1.5em; font-weight: bold;">Kino</div>
        </div>
        
        <div class="container">
            ${preface}
            ${tocSection}
            ${htmlBody}
            ${bioSection}
        </div>

    </body>
    </html>
    `;

    await fs.writeFile(OUTPUT_HTML, fullHtml);
    console.log(`HTML Book Generated: ${OUTPUT_HTML}`);
}

generateHtmlBook();
