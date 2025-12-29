
const fs = require('fs-extra');
const masterPath = '/Users/kino/Desktop/vibe_coding_master.md';

async function removeCommentsSection() {
    console.log('Removing Comments Section and Note Tags...');
    let content = await fs.readFile(masterPath, 'utf8');

    // 1. Remove "10.3 コメント欄の使い方" section text
    // Target content block:
    /*
    10.3 コメント欄の使い方
    もし途中でつまずいたり...
    ...
    最後まで読んでいただき、ありがとうございました。
    */

    // I will try to find "10.3 コメント欄の使い方" and remove everything until the end of that specific prose, 
    // or just the whole tail of the document if it's the very end.

    // Note: My generator script appends the "App Showcase" at the HTML Generation stage, 
    // so removing it from MD is safe.

    const commentsHeader = "### 10.3 コメント欄の使い方"; // Assuming it is converted to h3 or h2
    // Or just "10.3 コメント欄の使い方" if regex was strict.
    // The user's text seems to be from the raw Note content.

    // Let's look for "10.3 コメント欄の使い方"
    // And remove until "#無料" or end.

    // The master file might have different formatting.
    // Let's search broadly.

    // Removal Target 1: The section
    content = content.replace(/###?\s*10\.3\s*コメント欄の使い方[\s\S]*?(?=(#無料|\[|#バイブコーディング|$))/g, '');

    // Removal Target 2: Note specific tags and footer links
    // #無料
    // #バイブコーディング
    // [【完全無料】... ](...)

    content = content.replace(/#無料/g, '');
    content = content.replace(/#バイブコーディング/g, '');

    // Remove the long link at the end (Note self-link)
    // Pattern: [【完全無料】初心者向けVibe Coding入門...](...)
    const noteLinkRegex = /\[【完全無料】初心者向けVibe Coding入門.*?\]\(.*?\)/g;
    content = content.replace(noteLinkRegex, '');

    // Remove "最後まで読んでいただき、ありがとうございました。" if it's dangling?
    // Maybe keep the "Thank you" but remove the support promise.

    // Let's specifically remove the promise text:
    // "本書のコメント欄をサポートセンターとして使ってください。...私が全力で回答しますし..."
    // Since I did a bulk replace above, I should verify.

    // If the header "10.3..." format text wasn't found (e.g. if it was "## 10.3"), try strict text match for the promise.
    const promiseText = "本書のコメント欄をサポートセンターとして使ってください。";
    if (content.includes(promiseText)) {
        // If still present (regex failed), remove block manually
        // Finding start of section
        const startIndex = content.lastIndexOf("10.3 コメント欄の使い方");
        if (startIndex !== -1) {
            // Remove from there to end of file, assuming it's the last chapter.
            // But wait, there might be "Appendix" or such?
            // User said "Then today is over. Thank you." -> seems like the end.

            // I'll cut from startIndex.
            // But I should preserve the "Thank you"?
            // User: "I want to cut this area because it's a hassle."
            // So cut the whole section.

            // Check what's after.
            // "では今日はここまで。最後まで読んでいただき..."

            // I will replace the whole block with just a simple closing if needed, or nothing.
            // Let's remove it entirely.

            content = content.substring(0, startIndex);

            // Append a simple finishing sentence if it feels abrupt?
            // "本書は以上です。素晴らしいVibe Codingライフを！"
            content += "\n\n本書は以上です。素晴らしいVibe Codingライフを！\n";
            console.log('Removed comments section by truncation.');
        }
    }

    // Cleanup extra newlines at EOF
    content = content.replace(/\n{4,}/g, '\n\n');

    await fs.writeFile(masterPath, content, 'utf8');
    console.log('Cleanup complete.');
}

removeCommentsSection().catch(console.error);
