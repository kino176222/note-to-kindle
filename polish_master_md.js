const fs = require('fs-extra');

async function polishMasterMarkdown() {
    console.log('Markdownの最終仕上げを開始します...');

    const TARGET_FILE = '/Users/kino/Desktop/vibe_coding_master.md';
    let content = await fs.readFile(TARGET_FILE, 'utf8');

    // ==========================================
    // 1. 絵文字の置換 (Emoji Replacement)
    // ==========================================
    const emojiMap = {
        '⚠️': '【注意】',
        '💡': '【ヒント】',
        '✅': '[✓]',
        '👉': '→',
        '⭕️': '【OK】',
        '❌': '【NG】',
        '🎯': '【ポイント】'
    };

    for (const [emoji, text] of Object.entries(emojiMap)) {
        content = content.replace(new RegExp(emoji, 'g'), text);
    }
    console.log('✅ 絵文字をテキストに置換しました');

    // ==========================================
    // 2. AI Rules の構造修正 (Fix AI Rules Structure)
    // ==========================================
    // AI Rulesセクションを特定して、その中の見出し(##)を太字(**)に置換する
    // 目次に表示されないようにするため

    // AI Rulesセクションの開始位置を探す
    const aiRulesStartRegex = /# AI Rules & Guidelines/;
    const aiRulesMatch = content.match(aiRulesStartRegex);

    if (aiRulesMatch) {
        const startIndex = aiRulesMatch.index;
        // 次の大きな見出し(# )またはファイル末尾までを範囲とする
        const nextHeaderRegex = /\n# [^#]/g;
        nextHeaderRegex.lastIndex = startIndex + 1;
        const nextHeaderMatch = nextHeaderRegex.exec(content);
        const endIndex = nextHeaderMatch ? nextHeaderMatch.index : content.length;

        let aiRulesSection = content.substring(startIndex, endIndex);

        // セクション内の ## 見出しを **太字** に変換
        aiRulesSection = aiRulesSection.replace(/^##\s+(.+)$/gm, '<p style="font-weight:bold; font-size:1.2em; margin-top:1em;">$1</p>');
        // リスト内の太字 **text** があれば維持

        // AI Rules全体をグレーのボックスで囲む (HTMLタグを直接挿入)
        // タイトルはボックスの外に出すか、中に入れるか。中に入れます。
        const styledAiRules = `
<div style="background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 20px 0;">
${aiRulesSection.replace(/^# AI Rules/, '<h3 style="margin-top:0;">AI Rules')}
</div>
`;

        // 元のコンテンツを置換 (replace only the first occurrence found by index)
        content = content.substring(0, startIndex) + styledAiRules + content.substring(endIndex);
        console.log('✅ AI Rulesをグレーボックス化し、目次から除外しました');
    }

    // ==========================================
    // 3. プロンプトとAFTERの強調 (Gray Background)
    // ==========================================

    // "プロンプト例" という言葉の近く、または特定のキーワードを探してボックス化
    // User mentioned: "スクショして「解説して！」と投げる"

    const promptStyle = '<div style="background-color: #f0f0f0; padding: 10px; margin: 10px 0; border-left: 4px solid #555; font-family: monospace;">';
    const closeDiv = '</div>';

    // 具体的なテキストをターゲットにする (Regex escapeが必要な場合は注意)
    const targets = [
        'スクショを添付して「これどういう意味？」と質問',
        '「テキストを日本語に直して」',
        '「背景を白にして」',
        'テキストを日本語に直して',
        '背景を白にして'
    ];

    // コードブロック記法 ``` を HTML div に変換 (generate_v5.jsでもやっているが、Markdownレベルで確定させる)
    // 特に "AFTER" コードなどは ``` で囲まれているはず
    // ここでは、明示的に ``` で囲まれたブロックを変換する
    // ただし、AI Rulesの処理ですでにHTML化している可能性があるので注意

    // 既存の ``` ブロックをすべてスタイル付きDIVに置換してしまうのが手っ取り早い
    content = content.replace(/```\n([\s\S]*?)\n```/g, (match, codeContent) => {
        // AI Rulesの中に既にdivが入っている場合などは除外したいが...
        // シンプルに変換
        return `${promptStyle}\n${codeContent}\n${closeDiv}`;
    });

    console.log('✅ コードブロックをグレーボックス(HTML)に変換しました');

    // 保存
    await fs.writeFile(TARGET_FILE, content, 'utf8');
    console.log('🎉 全て完了しました');
}

polishMasterMarkdown().catch(console.error);
