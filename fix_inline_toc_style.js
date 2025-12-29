const fs = require('fs-extra');

async function structureInlineTableOfContents() {
    console.log('🏗 目次を押しやすい構造（ div .inline-toc ）に改造します...');

    // CSS追加
    const cssFile = '/Users/kino/Developer/note-to-kindle/epub_style_final.css';
    const cssContent = await fs.readFile(cssFile, 'utf8');
    const newCss = `
/* インライン目次（手動挿入分）のスタイル */
.inline-toc {
    background-color: #fff;
    padding: 10px;
    margin: 2em 0;
    border: 1px solid #eee;
    border-radius: 8px;
}

.inline-toc ul {
    list-style-type: none;
    padding-left: 0;
    margin: 0;
}

.inline-toc li {
    border-bottom: 1px solid #f0f0f0;
    margin: 0;
}

.inline-toc li:last-child {
    border-bottom: none;
}

.inline-toc a {
    display: block;        /* 行全体をタップ可能に */
    padding: 12px 10px;    /* タップ領域を広げる */
    color: #0066cc;        /* 青色リンク */
    text-decoration: none;
    font-size: 1.0em;
    font-weight: bold;
}

.inline-toc a:active {
    background-color: #e6f0ff; /* タップ時のフィードバック */
}
`;
    // CSSファイルの末尾に追加（重複チェックは簡易的に）
    if (!cssContent.includes('.inline-toc')) {
        await fs.appendFile(cssFile, newCss);
        console.log('✅ CSSに .inline-toc スタイルを追加しました');
    }

    // Markdown修正
    const mdFile = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(mdFile, 'utf8');

    // 目次リスト部分を特定してラップする
    // リストの開始: "- [本書のクリア条件（ゴール）](#goal)"
    // リストの終了: "- [第10章 AFTER 10（次の世界へ）](#ch10)"

    // 正規表現で、このブロック全体をキャプチャする
    // 柔軟性を高めるため、前後の文脈も使用

    const startPattern = /▼ 迷ったら、目次から「今やりたい章」だけ進めてください。/;

    // リストの終了点... 空行が2つ続くか、次のヘッダーまで。
    // 手動でリストを作ったので、中身は分かっている。

    // 単純に、リストの最初の要素から最後の要素までを探す。
    const listStartText = '- [本書のクリア条件（ゴール）](#goal)';
    const listEndText = '- [第10章 AFTER 10（次の世界へ）](#ch10)';

    const startIndex = content.indexOf(listStartText);
    const endIndex = content.indexOf(listEndText);

    if (startIndex !== -1 && endIndex !== -1) {
        // endIndexは行の開始点なので、行末まで含める
        const endLineEnd = content.indexOf('\n', endIndex);
        const actualEndIndex = endLineEnd !== -1 ? endLineEnd : content.length;

        const listContent = content.substring(startIndex, actualEndIndex);

        // 既にラップされているか確認
        // 直前の文字を確認するのは面倒なので、ラップ済みタグが含まれていないかで判断
        const surroundingContext = content.substring(startIndex - 50, actualEndIndex + 50);
        if (surroundingContext.includes('<div class="inline-toc">')) {
            console.log('ℹ️ 既にラップ済みです');
        } else {
            // 置き換え
            // Markdownが効くように空行を入れる
            const newBlock = `\n<div class="inline-toc">\n\n${listContent}\n\n</div>\n`;

            // 元のコンテンツを置換
            // content文字列を再構築
            const before = content.substring(0, startIndex);
            const after = content.substring(actualEndIndex);

            content = before + newBlock + after;

            await fs.writeFile(mdFile, content, 'utf8');
            console.log('✅ 目次リストを <div class="inline-toc"> で包みました');
        }
    } else {
        console.warn('⚠️ 目次リストが見つかりませんでした。テキストが変更されている可能性があります。');
        // デバッグ出力
        // console.log(content.substring(0, 1000)); 
    }
}

structureInlineTableOfContents().catch(console.error);
