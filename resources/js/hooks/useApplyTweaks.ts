import { useEffect } from 'react';
import type { Tweaks } from '@/types';

export function useApplyTweaks(t: Tweaks) {
    useEffect(() => {
        document.documentElement.classList.toggle('dark', !!t.dark);
    }, [t.dark]);

    useEffect(() => {
        const root = document.documentElement;
        const preset = t.themePreset || 'charcoal';
        root.classList.toggle('theme-sepia', preset === 'sepia');
        root.classList.toggle('theme-nord', preset === 'nord');
    }, [t.themePreset]);

    useEffect(() => {
        document.documentElement.classList.toggle('focus-mode', !!t.focusMode);
    }, [t.focusMode]);

    useEffect(() => {
        const root = document.documentElement.style;
        root.setProperty('--fs', t.fontSize + 'px');
        document.documentElement.style.fontSize = t.fontSize + 'px';
        const density = t.density === 'compact' ? 0.82 : t.density === 'roomy' ? 1.14 : 1.0;
        root.setProperty('--d', String(density));
        const bw = t.borderSoftness === 'hairline' ? '0.5px' : '1px';
        root.setProperty('--border-w', bw);
        const accent = t.accent || '#1f1d1a';
        root.setProperty('--accent', accent);
        root.setProperty('--accent-soft', `color-mix(in srgb, ${accent} 6%, transparent)`);
    }, [t.fontSize, t.density, t.borderSoftness, t.accent]);
}
