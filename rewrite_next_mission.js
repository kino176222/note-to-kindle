
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function rewriteNextMission() {
    console.log('Rewriting Next Mission section...');
    let content = await fs.readFile(masterPath, 'utf8');

    // Find "### 10.2 次のミッション" and replace until the end or next section
    const sectionHeader = "### 10.2 次のミッション";
    const startIdx = content.indexOf(sectionHeader);

    if (startIdx === -1) {
        console.error('Next Mission section not found.');
        return;
    }

    // Find the end (either next ### or "本書は以上です" or EOF)
    const afterHeader = content.substring(startIdx);
    const nextSectionMatch = afterHeader.substring(sectionHeader.length).search(/###|本書は以上です/);

    let endIdx;
    if (nextSectionMatch !== -1) {
        endIdx = startIdx + sectionHeader.length + nextSectionMatch;
    } else {
        endIdx = content.length;
    }

    const newContent = `### 10.2 次のミッション

**あなたの「めんどくさい」が、次の作品になる**

私ごとで恐縮ですが、私はAIで作った画像を使ってミュージックビデオを制作していました。
1枚の画像に9つのショットを並べて、それを手作業で1つずつ切り出していたのですが...

**もう耐えられない。**

「画像を自動で9分割できないかな？」

そう思った瞬間、Vibe Codingの出番でした。
AIに相談して、たった数時間で専用ツールを作成。
手作業が5秒で終わるようになりました。

![Image Split Tool](/Users/kino/Developer/note-to-kindle/images/image_split_tool.png)

詳しくはこちらのNoteで👇
[https://note.com/kino_11/n/n7f5f813afa90](https://note.com/kino_11/n/n7f5f813afa90)

---

**あなたにも、きっとある。**

「これ、マジでめんどくさい...」
「誰か代わりにやってくれないかな...」

そう思ったら、それがあなたの次の作品です。
AIに愚痴ってください。
それがあなたの次回作になります。

`;

    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);

    content = before + newContent + after;

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Next Mission section rewritten.');
}

rewriteNextMission().catch(console.error);
