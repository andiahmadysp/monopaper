import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tweaks, ToastType, ToastItem } from '@/types';

export type AppFont  = 'sans' | 'serif' | 'mono';
export type AppSize  = 'sm' | 'md' | 'lg';
export type AppLH    = 'tight' | 'normal' | 'relaxed';
export type AppWidth = 'narrow' | 'normal' | 'wide';

export interface Appearance {
    font: AppFont;
    size: AppSize;
    lh: AppLH;
    width: AppWidth;
}

export const APPEARANCE_DEFAULT: Appearance = {
    font: 'sans', size: 'md', lh: 'normal', width: 'normal',
};

export const TWEAK_DEFAULTS: Tweaks = {
    fontSize: 14,
    density: 'comfortable',
    borderSoftness: 'subtle',
    accent: '#1f1d1a',
    dark: false,
    focusMode: false,
    spellCheck: true,
    wordCount: true,
    themePreset: 'charcoal',
};

interface UIState {
    // Command palette
    paletteOpen: boolean;
    setPaletteOpen: (open: boolean) => void;

    // Toast (ephemeral — not persisted)
    toasts: ToastItem[];
    _toastCounter: number;
    toast: (message: string, type?: ToastType) => void;
    dismissToast: (id: number) => void;

    // Dashboard tweaks (persisted)
    tweaks: Tweaks;
    setTweak: (key: keyof Tweaks, value: unknown) => void;

    // Editor appearance (persisted)
    appearance: Appearance;
    setAppear: <K extends keyof Appearance>(key: K, value: Appearance[K]) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            // Palette
            paletteOpen: false,
            setPaletteOpen: (open) => set({ paletteOpen: open }),

            // Toast
            toasts: [],
            _toastCounter: 0,
            toast: (message, type = 'success') => {
                const id = get()._toastCounter + 1;
                set((s) => ({
                    _toastCounter: id,
                    toasts: [...s.toasts, { id, message, type }],
                }));
                setTimeout(() => get().dismissToast(id), 2600);
            },
            dismissToast: (id) =>
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

            // Dashboard tweaks
            tweaks: TWEAK_DEFAULTS,
            setTweak: (key, value) =>
                set((s) => ({ tweaks: { ...s.tweaks, [key]: value } })),

            // Editor appearance
            appearance: APPEARANCE_DEFAULT,
            setAppear: (key, value) =>
                set((s) => ({ appearance: { ...s.appearance, [key]: value } })),
        }),
        {
            name: 'life:ui',
            storage: createJSONStorage(() => localStorage),
            partialize: (s) => ({ tweaks: s.tweaks, appearance: s.appearance }),
        },
    ),
);
