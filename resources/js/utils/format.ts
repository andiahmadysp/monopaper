export function fmtMMSS(totalSec: number): string {
    const s = Math.max(0, Math.round(totalSec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
}

export function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function fmtShortDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export function fmtAmt(n: number): string {
    return Math.round(n).toLocaleString('id-ID');
}

export function fmtIDR(n: number): string {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function fmtCompactIDR(n: number): string {
    if (n >= 1_000_000)
        return 'Rp ' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
    if (n >= 1_000) return 'Rp ' + Math.round(n / 1_000) + 'k';
    return 'Rp ' + n;
}

export function countWordsInJSON(node: any): number {
    if (!node) return 0;
    if (node.type === 'text' && typeof node.text === 'string') {
        return node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    let count = 0;
    if (Array.isArray(node.content)) {
        for (const child of node.content) {
            count += countWordsInJSON(child);
        }
    }
    return count;
}
