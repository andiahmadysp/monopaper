import { useCallback, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { type JSONContent } from 'novel';
import { contentCache } from '@/utils/cache';
import { countWordsInJSON } from '@/utils/format';

type SaveState = 'saved' | 'saving' | 'unsaved';

interface Options {
    slugRef: React.MutableRefObject<string>;
    isPendingRef: React.MutableRefObject<boolean>;
    initialWordCount: number;
}

export function useNoteAutoSave({ slugRef, isPendingRef, initialWordCount }: Options) {
    const [saveState, setSaveState] = useState<SaveState>('saved');
    const [wordCount, setWordCount] = useState(initialWordCount);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingContent = useRef<JSONContent | null>(null);

    const saveContent = useCallback((content: JSONContent) => {
        setSaveState('saving');
        router.patch(
            route('notes.update', { note: slugRef.current }),
            { content },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['note'],
                onSuccess: () => setSaveState('saved'),
                onError: () => setSaveState('unsaved'),
            },
        );
    }, [slugRef]);

    const handleContentChange = useCallback((json: JSONContent, noteId: number) => {
        pendingContent.current = json;
        contentCache.set(noteId, json);
        setWordCount(countWordsInJSON(json));
        if (isPendingRef.current) return;
        setSaveState('unsaved');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            if (pendingContent.current) saveContent(pendingContent.current);
        }, 1500);
    }, [saveContent, isPendingRef]);

    const flushSave = useCallback(() => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (pendingContent.current) saveContent(pendingContent.current);
    }, [saveContent]);

    return {
        saveState,
        setSaveState,
        wordCount,
        setWordCount,
        pendingContent,
        saveTimer,
        handleContentChange,
        flushSave,
    };
}
