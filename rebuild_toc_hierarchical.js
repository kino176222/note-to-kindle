const fs = require('fs-extra');

async function rebuildTocHierarchical() {
    console.log('🏗️ 目次を階層化し、全見出しをリンク可能なHTMLタグに変換します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    const lines = content.split('\n');
    const toc = [];
    let currentChapter = null; // 現在処理中の章オブジェクト

    // 見出しを処理した後の新しい行を入れる配列
    const newLines = [];

    // 既存の目次ブロックを探すためのフラグ
    let insideToc = false;

    // 行ごとに処理
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // 目次ブロックの検出（置換用）
        if (line.includes('<div class="inline-toc">')) {
            insideToc = true;
            newLines.push('__TOC_PLACEHOLDER__');
            continue;
        }
        if (insideToc) {
            if (line.includes('</div>')) {
                insideToc = false;
            }
            continue; // 目次の中身はスキップ
        }

        // H2 (章) の検出
        // 既にHTML化されている場合 (<h2...) と Markdown (##) の場合がある
        // fix_ai_rules_and_hashes.js や hardcode_html_links.js で既にHTML化されている可能性があるため、
        // 両方に対応する必要があるが、hardcode_html_links.js は一部しか実行されていないかもしれない。
        // ここでは、Markdownの ## と ### を優先して処理し、HTML化する。
        // もし既にHTMLタグなら、それをパースして目次に追加する。

        // 正規表現: Markdown見出し
        // ## タイトル {#id} or ## タイトル
        const mdH2Match = line.match(/^##\s+(.+?)(?:\s+\{#([^\}]+)\})?$/);
        const mdH3Match = line.match(/^###\s+(.+?)(?:\s+\{#([^\}]+)\})?$/);

        // 正規表現: HTML見出し (以前のスクリプトで変換されたもの)
        const htmlH2Match = line.match(/<h2 id="([^"]+)">(.+)<\/h2>/);
        const htmlH3Match = line.match(/<h3 id="([^"]+)">(.+)<\/h3>/);

        let headerData = null; // { level: 2, title: '...', id: '...' }

        if (mdH2Match) {
            headerData = {
                level: 2,
                title: mdH2Match[1].trim(),
                id: mdH2Match[2]
            };
        } else if (htmlH2Match) {
            headerData = {
                level: 2,
                title: htmlH2Match[2].trim(), // HTMLタグの中身
                id: htmlH2Match[1]
            };
        } else if (mdH3Match) {
            headerData = {
                level: 3,
                title: mdH3Match[1].trim(),
                id: mdH3Match[2]
            };
        } else if (htmlH3Match) {
            headerData = {
                level: 3,
                title: htmlH3Match[2].trim(), // HTMLタグの中身
                id: htmlH3Match[1]
            };
        }

        if (headerData) {
            console.log(`Matched Header: ${headerData.level} - ${headerData.title}`);

            // IDがない場合の自動生成
            if (!headerData.id) {
                // "1.1 Vibe Coding" -> "sec-1-1"
                // "第1章 ..." -> "ch-1"
                const numberMatch = headerData.title.match(/([0-9]+\.[0-9]+)/);
                const chapterMatch = headerData.title.match(/第([0-9]+)章/);

                if (numberMatch) {
                    headerData.id = `sec-${numberMatch[1].replace('.', '-')}`;
                } else if (chapterMatch) {
                    headerData.id = `ch-${chapterMatch[1]}`;
                } else {
                    // 最後の手段：適当なハッシュ
                    headerData.id = `h-${Math.random().toString(36).substr(2, 5)}`;
                }
            }

            // HTML行に変換して保存
            if (headerData.level === 2) {
                newLines.push(`<h2 id="${headerData.id}">${headerData.title}</h2>`);

                // 目次ツリーに追加
                currentChapter = {
                    title: headerData.title,
                    id: headerData.id,
                    children: []
                };
                toc.push(currentChapter);

            } else if (headerData.level === 3) {
                newLines.push(`<h3 id="${headerData.id}">${headerData.title}</h3>`);

                // 現在の章の子として追加
                if (currentChapter) {
                    currentChapter.children.push({
                        title: headerData.title,
                        id: headerData.id
                    });
                } else {
                    // 第0章の前にあるH3など（例えば「はじめに」とか）
                    // 独立した項目として扱うか、直前の章がないのでルートに追加する？
                    // ユーザー要望では「第1章の下に1.1」なので、章外のH3はフラットでいいかも。
                    toc.push({
                        title: headerData.title,
                        id: headerData.id,
                        children: []
                    });
                }
            }

        } else {
            // 見出しでない行はそのまま
            newLines.push(line);
        }
    }

    // HTML目次の生成
    let tocHtml = '<div class="inline-toc">\n<ul class="toc-root">\n';

    toc.forEach(chapter => {
        tocHtml += `  <li class="toc-chapter">\n`;
        tocHtml += `    <a href="#${chapter.id}">${chapter.title}</a>\n`;

        if (chapter.children.length > 0) {
            tocHtml += `    <ul class="toc-section">\n`;
            chapter.children.forEach(section => {
                tocHtml += `      <li class="toc-item"><a href="#${section.id}">${section.title}</a></li>\n`;
            });
            tocHtml += `    </ul>\n`;
        }

        tocHtml += `  </li>\n`;
    });

    tocHtml += '</ul>\n</div>';

    // プレースホルダーを実際の目次に置換
    let finalContent = newLines.join('\n');
    finalContent = finalContent.replace('__TOC_PLACEHOLDER__', tocHtml);

    // もし __TOC_PLACEHOLDER__ が複数回あるとおかしくなるが、通常1回。
    // まだHTMLファイル全体をjoinしたので、最初の1箇所だけ置換される。

    await fs.writeFile(TARGET_FILE, finalContent, 'utf8');
    console.log('✅ 目次の階層化と全見出しのHTML化が完了しました');
}

rebuildTocHierarchical().catch(console.error);
