/**
 * Random pause between actions so requests don't fire in the tight,
 * perfectly-even bursts that made staging's bot/rate-limit protection start
 * returning 429/403 mid-run.
 */
export function humanDelay(minMs = 400, maxMs = 1200): Promise<void> {
    const ms = minMs + Math.random() * (maxMs - minMs);
    return new Promise((resolve) => setTimeout(resolve, ms));
}
