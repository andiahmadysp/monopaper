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
        // Only apply accent override for charcoal preset — sepia/nord define their own accent via CSS class
        if (!t.themePreset || t.themePreset === 'charcoal') {
            const accent = t.accent || '#1f1d1a';
            root.setProperty('--accent', accent);
            const hex = accent.replace('#', '');
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            const isLight = (r * 299 + g * 587 + b * 114) > 128000;
            const pct = isLight ? '12%' : '6%';
            root.setProperty('--accent-soft', `color-mix(in srgb, ${accent} ${pct}, transparent)`);
        } else {
            root.removeProperty('--accent');
            root.removeProperty('--accent-soft');
        }
    }, [t.fontSize, t.density, t.borderSoftness, t.accent, t.themePreset]);
}
