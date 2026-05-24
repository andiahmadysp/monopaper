import NotesLayout from '@/Layouts/NotesLayout';
import ConfirmDialog from '@/Components/ConfirmDialog';
import { ErrorBoundary } from '@/Components/ErrorBoundary';
import Sidebar from '@/Components/Sidebar/Sidebar';
import { NoteTopBar } from '@/Components/NoteTopBar';
import { useNoteAutoSave } from '@/hooks/useNoteAutoSave';
import { useTweaks } from '@/hooks/useTweaks';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useUIStore } from '@/store/ui';
import { useToast } from '@/hooks/useToast';
import { Toaster } from '@/Components/Toast';
import { NoteListItem, Note } from '@/types';
import { contentCache } from '@/utils/cache';
import { countWordsInJSON, fmtNoteDate, timeAgo } from '@/utils/format';
import { xsrfToken } from '@/utils/http';
import { Head, router } from '@inertiajs/react';
import { type WikiNote } from '@/Components/Editor/WikiLinkExtension';
import { type JSONContent } from 'novel';
import type { Command } from '@/Components/CommandPalette';
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
const CommandPalette = lazy(() => import('@/Components/CommandPalette'));
const TweaksPanel = lazy(() => import('@/Components/TweaksPanel'));

interface Props {
    notes: NoteListItem[];
    note: Note;
}

export default function NotesShow({ notes: initNotes, note: initNote }: Props) {
    const [t, setTweak] = useTweaks();
    const { toasts, toast, dismiss } = useToast();
    const appearance = useUIStore((s) => s.appearance);

    const [notes, setNotes] = useState<NoteListItem[]>(initNotes);
    const [note, setNote] = useState<Note>(initNote);
    const [title, setTitle] = useState(initNote.title);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [confirmPending, setConfirmPending] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const slugRef = useRef(initNote.slug);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const editorAreaRef = useRef<HTMLDivElement>(null);
    const isPendingRef = useRef(false);

    const {
        saveState,
        setSaveState,
        wordCount,
        setWordCount,
        pendingContent,
        handleContentChange: rawHandleContentChange,
        flushSave,
    } = useNoteAutoSave({
        slugRef,
        isPendingRef,
        initialWordCount: countWordsInJSON(initNote.content),
    });

    const handleContentChange = useCallback(
        (json: JSONContent) => rawHandleContentChange(json, note.id),
        [rawHandleContentChange, note.id],
    );

    const allNotes = useMemo<WikiNote[]>(
        () => notes.filter((n) => n.id > 0).map((n) => ({ slug: n.slug, title: n.title || 'Untitled' })),
        [notes],
    );

    useSwipeGesture({
        edgeLeft: 32,
        threshold: 40,
        bottomPercent: 30,
        onSwipeRight: useCallback(() => {
            if (window.innerWidth > 768) return;
            setSidebarOpen(true);
        }, []),
    });
    useSwipeGesture({
        threshold: 80,
        verticalTolerance: 60,
        bottomPercent: 30,
        onSwipeLeft: useCallback(() => {
            if (window.innerWidth > 768) return;
            if (sidebarOpen) setSidebarOpen(false);
        }, [sidebarOpen]),
    });

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
            contentCache.set(initNote.id, initNote.content as JSONContent | null);
        }
        setWordCount(countWordsInJSON(contentCache.get(initNote.id) ?? initNote.content));
        if (initNote.title === 'Untitled' && !initNote.content) {
            requestAnimationFrame(() => {
                titleInputRef.current?.focus();
                titleInputRef.current?.select();
            });
        }
    }, [initNote.id]);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                setPaletteOpen((p) => !p);
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                setTweak('focusMode', !useUIStore.getState().tweaks.focusMode);
            }
        }
        function onWikiNav(e: Event) {
            const slug = (e as CustomEvent<string>).detail;
            if (slug) router.visit(route('notes.show', { note: slug }));
        }
        function onWikiClick(e: MouseEvent) {
            const el = (e.target as HTMLElement).closest<HTMLElement>('[data-wiki-link]');
            const slug = el?.dataset.slug;
            if (!slug) return;
            e.preventDefault();
            e.stopPropagation();
            router.visit(route('notes.show', { note: slug }));
        }
        window.addEventListener('keydown', onKey);
        window.addEventListener('wikilink:navigate', onWikiNav);
        document.addEventListener('mousedown', onWikiClick, true);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('wikilink:navigate', onWikiNav);
            document.removeEventListener('mousedown', onWikiClick, true);
        };
    }, []);

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

            flushSave();

            const tempId = -Date.now();
            const now = new Date().toISOString();
            const tempNote: Note = {
                id: tempId,
                parent_id: parentId ?? null,
                position: notes.filter((d) => d.parent_id === (parentId ?? null)).length,
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
                    body: JSON.stringify({ title: 'Untitled', parent_id: parentId ?? null }),
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const created: Note = await res.json();

                const cached = contentCache.get(tempId);
                contentCache.delete(tempId);
                contentCache.set(created.id, cached ?? null);

                setNotes((prev) => prev.map((d) => d.id === tempId ? { ...d, ...created } : d));
                setNote((prev) => prev.id === tempId ? { ...prev, ...created } : prev);
                slugRef.current = created.slug;
                isPendingRef.current = false;

                window.history.replaceState(
                    window.history.state,
                    '',
                    route('notes.show', { note: created.slug }),
                );

                const currentTitle = titleInputRef.current?.value.trim() || 'Untitled';
                if (currentTitle !== 'Untitled') {
                    router.patch(
                        route('notes.update', { note: created.slug }),
                        { title: currentTitle },
                        { preserveScroll: true, preserveState: true },
                    );
                }

                if (pendingContent.current) {
                    setSaveState('saving');
                    flushSave();
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
        [creating, notes, flushSave, initNote],
    );

    const openConfirm = useCallback((title: string, onConfirm: () => void) => {
        setConfirmPending({ title, message: 'This cannot be undone.', onConfirm });
    }, []);

    const handleDelete = useCallback(() => {
        if (deleting) return;
        const snapshot = [...notes];
        openConfirm(`Delete "${note.title || 'Untitled'}"?`, () => {
            setConfirmPending(null);
            setDeleting(true);
            setNotes((prev) => prev.filter((d) => d.slug !== slugRef.current));
            router.delete(route('notes.destroy', { note: slugRef.current }), {
                preserveScroll: true,
                onSuccess: () => toast('Note deleted', 'delete'),
                onError: () => setNotes(snapshot),
                onFinish: () => setDeleting(false),
            });
        });
    }, [deleting, note.title, notes, openConfirm]);

    const handleDeleteNote = useCallback((slug: string) => {
        const target = notes.find((d) => d.slug === slug);
        const snapshot = [...notes];
        openConfirm(`Delete "${target?.title || 'Untitled'}"?`, () => {
            setConfirmPending(null);
            setNotes((prev) => prev.filter((d) => d.slug !== slug));
            router.delete(route('notes.destroy', { note: slug }), {
                preserveScroll: true,
                onSuccess: () => toast('Note deleted', 'delete'),
                onError: () => setNotes(snapshot),
            });
        });
    }, [notes, openConfirm]);

    const handleReorder = useCallback((newNotes: NoteListItem[]) => {
        setNotes(newNotes);
    }, []);

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
            { id: 'new-note', group: 'Create', label: 'New note', run: () => handleNew() },
            { id: 'new-child', group: 'Create', label: `New sub-note under "${note.title || 'this'}"`, run: () => handleNew(note.id) },
            { id: 'delete-note', group: 'Actions', label: `Delete "${note.title || 'Untitled'}"`, run: handleDelete },
            {
                id: 'open-appearance',
                group: 'Actions',
                label: 'Appearance settings',
                keywords: ['appearance', 'theme', 'font', 'size', 'tweak'],
                hint: '⌘⇧A',
                run: () => window.postMessage({ type: '__activate_edit_mode' }, '*'),
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
                    <NoteTopBar
                        saveState={saveState}
                        focusMode={t.focusMode ?? false}
                        onToggleSidebar={() => setSidebarOpen((o) => !o)}
                        onOpenPalette={() => setPaletteOpen((p) => !p)}
                        onExitFocus={() => setTweak('focusMode', false)}
                    />
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
                                <span>Created {fmtNoteDate(note.created_at)}</span>
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
                                        editorAreaRef.current?.querySelector<HTMLElement>('.tiptap')?.focus();
                                    }
                                }}
                                placeholder="Untitled"
                            />
                        </div>
                        <ErrorBoundary>
                            <Suspense fallback={<div className="docs-editor-loading" />}>
                                <Editor
                                    key={note.id}
                                    docKey={note.id}
                                    initialContent={
                                        (contentCache.get(note.id) as JSONContent | null) ??
                                        (note.content as JSONContent | null)
                                    }
                                    onChange={handleContentChange}
                                    allNotes={allNotes}
                                />
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                    {(t.wordCount ?? true) && (
                        <div className="docs-editor-status">
                            <span>{wordCount} words</span>
                            <span className="docs-editor-status-sep">·</span>
                            <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                        </div>
                    )}
                </div>
            </div>
            <Suspense fallback={null}>
                <CommandPalette
                    open={paletteOpen}
                    onClose={() => setPaletteOpen(false)}
                    commands={commands}
                />
                <TweaksPanel tweaks={t} onTweak={setTweak} />
            </Suspense>
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

NotesShow.layout = (page: React.ReactNode) => (
    <NotesLayout>{page}</NotesLayout>
);
