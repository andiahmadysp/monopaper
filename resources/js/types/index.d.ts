export interface NoteListItem {
    id: number;
    parent_id: number | null;
    position: number;
    title: string;
    slug: string;
    updated_at: string;
}

export interface Note extends NoteListItem {
    content: Record<string, unknown> | null;
    created_at: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};

export interface Tweaks {
    fontSize: number;
    density: 'compact' | 'comfortable' | 'roomy';
    borderSoftness: 'hairline' | 'subtle' | 'crisp';
    accent: string;
    dark: boolean;
    focusMode?: boolean;
    spellCheck?: boolean;
    wordCount?: boolean;
    themePreset?: 'charcoal' | 'sepia' | 'nord';
}

export type ToastType = 'success' | 'info' | 'error' | 'delete';

export interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}
