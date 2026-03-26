/**
 * ⚡ 20-Year Exp Performance Strategy:
 * 1. Dice Coefficient (Sorensen-Dice) for string similarity.
 * 2. Optimized for short strings (Team Names).
 */

function getSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    s1 = s1.toLowerCase().replace(/[^a-z0-g\s]/g, '').trim();
    s2 = s2.toLowerCase().replace(/[^a-z0-g\s]/g, '').trim();

    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    const s1Bigrams = new Set();
    for (let i = 0; i < s1.length - 1; i++) {
        s1Bigrams.add(s1.substring(i, i + 2));
    }

    let intersection = 0;
    for (let i = 0; i < s2.length - 1; i++) {
        const bigram = s2.substring(i, i + 2);
        if (s1Bigrams.has(bigram)) {
            intersection++;
        }
    }

    return (2 * intersection) / (s1.length + s2.length - 2);
}

module.exports = { getSimilarity };
