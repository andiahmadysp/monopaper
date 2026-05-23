import CommandPalette, { Command } from '@/Components/CommandPalette';
import TweaksPanel from '@/Components/TweaksPanel';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Sidebar from '@/Components/Sidebar/Sidebar';
import { useApplyTweaks } from '@/hooks/useApplyTweaks';
import { useTweaks } from '@/hooks/useTweaks';
import { useUIStore } from '@/store/ui';
import { useToast } from '@/hooks/useToast';
import { Toaster } from '@/Components/Toast';
import { NoteListItem, Note } from '@/types';
import { contentCache } from '@/utils/cache';
import { countWordsInJSON } from '@/utils/format';
import { Head, router } from '@inertiajs/react';
import { PanelLeft, Search } from 'lucide-react';
import { type JSONContent } from 'novel';
import React, {
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

const Editor = lazy(() => import('@/Components/Editor/Editor'));

function xsrfToken(): string {
    return decodeURIComponent(
        document.cookie
            .split('; ')
            .find((c) => c.startsWith('XSRF-TOKEN='))
            ?.slice('XSRF-TOKEN='.length) ?? '',
    );
}

function fmtDate(iso: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(iso));
}

function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
    notes: NoteListItem[];
    note: Note;
}

export default function NotesShow({ notes: initNotes, note: initNote }: Props) {
    const [t, setTweak] = useTweaks();
    useApplyTweaks(t);
    const { toasts, toast, dismiss } = useToast();

    const [notes, setNotes] = useState<NoteListItem[]>(initNotes);
    const [note, setNote] = useState<Note>(initNote);
    const [title, setTitle] = useState(initNote.title);
    const [wordCount, setWordCount] = useState(() => countWordsInJSON(initNote.content));
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>(
        'saved',
    );
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [confirmPending, setConfirmPending] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const appearance = useUIStore((s) => s.appearance);

    const slugRef = useRef(initNote.slug);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingContent = useRef<JSONContent | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const editorAreaRef = useRef<HTMLDivElement>(null);
    const isPendingRef = useRef(false);

    // Sync sidebar list from Inertia (e.g. after drag reorder)
    useEffect(() => {
        if (!isPendingRef.current) setNotes(initNotes);
    }, [initNotes]);

    // Sync active note when Inertia navigates to a different note
    useEffect(() => {
        if (isPendingRef.current) return;
        slugRef.current = initNote.slug;
        setNote(initNote);
        setTitle(initNote.title);
        setSaveState('saved');
        pendingContent.current = null;
        if (!contentCache.has(initNote.id)) {
            contentCache.set(
                initNote.id,
                initNote.content as JSONContent | null,
            );
        }
        const loadedContent = contentCache.get(initNote.id) ?? initNote.content;
        setWordCount(countWordsInJSON(loadedContent));
        if (initNote.title === 'Untitled' && !initNote.content) {
            requestAnimationFrame(() => {
                titleInputRef.current?.focus();
                titleInputRef.current?.select();
            });
        }
    }, [initNote.id]);

    // Ctrl+K / ⌘K
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                setPaletteOpen((p) => !p);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const saveContent = useCallback((content: JSONContent) => {
        setSaveState('saving');
        router.patch(
            route('notes.update', { note: slugRef.current }),
            { content },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['note'], // Performance: Autosave only requests note data, bypassing heavy sidebar queries
                onSuccess: () => setSaveState('saved'),
                onError: () => setSaveState('unsaved'),
            },
        );
    }, []);

    const handleContentChange = useCallback(
        (json: JSONContent) => {
            pendingContent.current = json;
            contentCache.set(note.id, json);
            setWordCount(countWordsInJSON(json));
            if (isPendingRef.current) return;
            setSaveState('unsaved');
            if (saveTimer.current) clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
                if (pendingContent.current) saveContent(pendingContent.current);
            }, 1500);
        },
        [saveContent, note.id],
    );

    const handleTitleBlur = useCallback(() => {
        const trimmed = title.trim() || 'Untitled';
        setTitle(trimmed);
        if (isPendingRef.current || trimmed === note.title) return;
        setNotes(prev => prev.map(d => d.id === note.id ? { ...d, title: trimmed } : d));
        router.patch(
            route('notes.update', { note: slugRef.current }),
            { title: trimmed },
            { preserveScroll: true, preserveState: true },
        );
    }, [title, note.title, note.id]);

    const handleNew = useCallback(
        async (parentId?: number) => {
            if (creating || isPendingRef.current) return;
            setCreating(true);
            isPendingRef.current = true;

            if (saveTimer.current) clearTimeout(saveTimer.current);

            const tempId = -Date.now();
            const now = new Date().toISOString();
            const tempNote: Note = {
                id: tempId,
                parent_id: parentId ?? null,
                position: notes.filter((d) => d.parent_id === (parentId ?? null))
                    .length,
                title: 'Untitled',
                slug: `__temp_${Math.abs(tempId)}`,
                updated_at: now,
                created_at: now,
                content: null,
            };

            contentCache.set(tempId, null);
            pendingContent.current = null;
            setNotes((prev) => [...prev, tempNote]);
            setNote(tempNote);
            setTitle('Untitled');
            setSaveState('saved');
            slugRef.current = tempNote.slug;

            requestAnimationFrame(() => {
                titleInputRef.current?.focus();
                titleInputRef.current?.select();
            });

            try {
                const res = await fetch(route('notes.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': xsrfToken(),
                    },
                    body: JSON.stringify({
                        title: 'Untitled',
                        parent_id: parentId ?? null,
                    }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const created: Note = await res.json();

                const cached = contentCache.get(tempId);
                contentCache.delete(tempId);
                contentCache.set(created.id, cached ?? null);

                setNotes((prev) =>
                    prev.map((d) =>
                        d.id === tempId ? { ...d, ...created } : d,
                    ),
                );
                setNote((prev) =>
                    prev.id === tempId ? { ...prev, ...created } : prev,
                );
                slugRef.current = created.slug;
                isPendingRef.current = false;

                window.history.replaceState(
                    window.history.state,
                    '',
                    route('notes.show', { note: created.slug }),
                );

                const currentTitle =
                    titleInputRef.current?.value.trim() || 'Untitled';
                if (currentTitle !== 'Untitled') {
                    router.patch(
                        route('notes.update', { note: created.slug }),
                        { title: currentTitle },
                        { preserveScroll: true, preserveState: true },
                    );
                }

                if (pendingContent.current) {
                    setSaveState('saving');
                    saveContent(pendingContent.current);
                }
                toast('Note created');
            } catch (_err) {
                isPendingRef.current = false;
                contentCache.delete(tempId);
                setNotes((prev) => prev.filter((d) => d.id !== tempId));
                setNote(initNote);
                setTitle(initNote.title);
                slugRef.current = initNote.slug;
                setSaveState('saved');
            } finally {
                setCreating(false);
            }
        },
        [creating, notes, saveContent, initNote],
    );

    const handleDelete = useCallback(() => {
        if (deleting) return;
        const snapshot = [...notes];
        setConfirmPending({
            title: `Delete "${note.title || 'Untitled'}"?`,
            message: 'This cannot be undone.',
            onConfirm: () => {
                setConfirmPending(null);
                setDeleting(true);
                setNotes((prev) =>
                    prev.filter((d) => d.slug !== slugRef.current),
                );
                router.delete(
                    route('notes.destroy', { note: slugRef.current }),
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast('Note deleted', 'delete');
                        },
                        onError: () => setNotes(snapshot),
                        onFinish: () => setDeleting(false),
                    },
                );
            },
        });
    }, [deleting, note.title, notes]);

    const handleReorder = useCallback((newNotes: NoteListItem[]) => {
        setNotes(newNotes);
    }, []);

    const handleDeleteNote = useCallback(
        (slug: string) => {
            const target = notes.find((d) => d.slug === slug);
            const snapshot = [...notes];
            setConfirmPending({
                title: `Delete "${target?.title || 'Untitled'}"?`,
                message: 'This cannot be undone.',
                onConfirm: () => {
                    setConfirmPending(null);
                    setNotes((prev) => prev.filter((d) => d.slug !== slug));
                    router.delete(route('notes.destroy', { note: slug }), {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast('Note deleted', 'delete');
                        },
                        onError: () => setNotes(snapshot),
                    });
                },
            });
        },
        [notes],
    );

    const commands = useMemo<Command[]>(() => {
        const cmds: Command[] = [];

        notes.filter((d) => d.slug !== note.slug && d.id > 0).forEach((d) => {
            cmds.push({
                id: `nav-${d.id}`,
                group: 'Open',
                label: d.title || 'Untitled',
                keywords: ['open', 'navigate', 'note'],
                run: () => router.get(route('notes.show', { note: d.slug })),
            });
        });

        cmds.push(
            {
                id: 'new-note',
                group: 'Create',
                label: 'New note',
                run: () => handleNew(),
            },
            {
                id: 'new-child',
                group: 'Create',
                label: `New sub-note under "${note.title || 'this'}"`,
                run: () => handleNew(note.id),
            },
            {
                id: 'delete-note',
                group: 'Actions',
                label: `Delete "${note.title || 'Untitled'}"`,
                run: handleDelete,
            },
            {
                id: 'open-appearance',
                group: 'Actions',
                label: 'Appearance settings',
                keywords: ['appearance', 'theme', 'font', 'size', 'tweak'],
                hint: '⌘⇧A',
                run: () =>
                    window.postMessage({ type: '__activate_edit_mode' }, '*'),
            },
        );

        return cmds;
    }, [notes, note, handleNew, handleDelete]);

    return (
        <>
            <Head title={note.title || 'Notes'} />
            <div className="docs-shell">
                {sidebarOpen && (
                    <div
                        className="docs-sidebar-backdrop"
                        onClick={() => setSidebarOpen(false)}
                        aria-hidden
                    />
                )}

                <Sidebar
                    notes={notes}
                    currentSlug={note.slug}
                    onNew={handleNew}
                    onDelete={handleDeleteNote}
                    onReorder={handleReorder}
                    creating={creating}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />

                <div className="docs-main">
                    <div className="docs-topbar">
                        <button
                            className="docs-topbar-menu-btn"
                            onClick={() => setSidebarOpen((o) => !o)}
                            title="Toggle sidebar"
                            aria-label="Toggle sidebar"
                        >
                            <PanelLeft size={15} strokeWidth={1.75} />
                        </button>
                        <div className="docs-topbar-right">
                            <span
                                className={`docs-save-dot docs-save-dot--${saveState}`}
                            >
                                {saveState === 'saved'
                                    ? '● Saved'
                                    : saveState === 'saving'
                                      ? 'Saving…'
                                      : '● Unsaved'}
                            </span>
                            <button
                                className="docs-search-btn"
                                onClick={() => setPaletteOpen((p) => !p)}
                                title="Search or open command palette (⌘K)"
                            >
                                <Search size={11} strokeWidth={2} />
                                <span>Search or jump to…</span>
                                <span className="docs-search-kbd">⌘K</span>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={editorAreaRef}
                        className="docs-editor-area"
                        data-font={appearance.font}
                        data-size={appearance.size}
                        data-lh={appearance.lh}
                        data-width={appearance.width}
                    >
                        <div className="docs-content-header">
                            <p className="docs-content-meta">
                                <span>Created {fmtDate(note.created_at)}</span>
                                <span className="docs-content-meta-sep">·</span>
                                <span>Edited {timeAgo(note.updated_at)}</span>
                            </p>
                            <input
                                ref={titleInputRef}
                                className="docs-content-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={handleTitleBlur}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        editorAreaRef.current
                                            ?.querySelector<HTMLElement>(
                                                '.tiptap',
                                            )
                                            ?.focus();
                                    }
                                }}
                                placeholder="Untitled"
                            />
                        </div>
                        <Suspense
                            fallback={<div className="docs-editor-loading" />}
                        >
                            <Editor
                                key={note.id}
                                docKey={note.id}
                                initialContent={
                                    (contentCache.get(
                                        note.id,
                                    ) as JSONContent | null) ??
                                    (note.content as JSONContent | null)
                                }
                                onChange={handleContentChange}
                            />
                        </Suspense>
                    </div>

                    {/* Word Count Status Bar */}
                    {(t.wordCount ?? true) && (
                        <div className="docs-editor-status">
                            <span>{wordCount} words</span>
                            <span className="docs-editor-status-sep">·</span>
                            <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                        </div>
                    )}
                </div>
            </div>

            <CommandPalette
                open={paletteOpen}
                onClose={() => setPaletteOpen(false)}
                commands={commands}
            />
            <TweaksPanel tweaks={t} onTweak={setTweak} />
            <ConfirmDialog
                open={!!confirmPending}
                title={confirmPending?.title ?? ''}
                message={confirmPending?.message ?? ''}
                onConfirm={confirmPending?.onConfirm ?? (() => {})}
                onCancel={() => setConfirmPending(null)}
            />
            <Toaster toasts={toasts} dismiss={dismiss} />
        </>
    );
}
