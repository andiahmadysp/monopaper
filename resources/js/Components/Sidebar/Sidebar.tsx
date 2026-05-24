import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { NoteListItem } from '@/types';
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragMoveEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { FileText, Plus, Search, X } from 'lucide-react';
import SortableItem from './SortableItem';

import {
    FlatItem,
    Projection,
    flattenTree,
    getProjection,
    removeChildrenOf,
    computeOptimisticReorder,
    INDENT_WIDTH,
} from '@/utils/sidebar';

interface SidebarProps {
    notes: NoteListItem[];
    currentSlug: string;
    onNew: (parentId?: number) => void;
    onDelete?: (slug: string) => void;
    onReorder?: (notes: NoteListItem[]) => void;
    creating: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export default memo(function Sidebar({
    notes,
    currentSlug,
    onNew,
    onDelete,
    onReorder,
    creating,
    isOpen = true,
    onClose,
}: SidebarProps) {
    const [q, setQ] = useState('');
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
    const [activeId, setActiveId] = useState<number | null>(null);
    const [overId, setOverId] = useState<number | null>(null);
    const [offsetLeft, setOffsetLeft] = useState(0);
    const [sidebarWidth, setSidebarWidth] = useState(230);
    const isResizing = useRef(false);
    const sortableSnapshot = useRef<FlatItem[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );

    const flat = useMemo(() => flattenTree(notes, collapsed), [notes, collapsed]);

    const filteredFlat = useMemo(() => {
        if (!q.trim()) return flat;
        return flat.filter((i) =>
            i.title.toLowerCase().includes(q.toLowerCase()),
        );
    }, [flat, q]);

    const sortableItems = useMemo(() => {
        if (!activeId) return filteredFlat;
        return removeChildrenOf(filteredFlat, new Set([activeId]));
    }, [filteredFlat, activeId]);

    const ids = sortableItems.map((i) => i.id);

    const projected = useMemo((): Projection | null => {
        if (!activeId || !overId) return null;
        const base = sortableSnapshot.current.length
            ? sortableSnapshot.current
            : sortableItems;
        return getProjection(base, activeId, overId, offsetLeft, INDENT_WIDTH);
    }, [sortableItems, activeId, overId, offsetLeft]);

    const toggleCollapse = useCallback((id: number) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const goTo = useCallback(
        (slug: string) => {
            if (slug === currentSlug) return;
            router.get(
                route('notes.show', { note: slug }),
                {},
                {
                    only: ['note'],
                    preserveState: true,
                    preserveScroll: false,
                },
            );
        },
        [currentSlug],
    );

    const addChild = useCallback(
        (parentId: number) => {
            if (creating) return;
            onNew(parentId);
        },
        [creating, onNew],
    );

    const deleteNote = useCallback(
        (slug: string) => {
            if (onDelete) {
                onDelete(slug);
            } else {
                if (!confirm('Delete this note?')) return;
                router.delete(route('notes.destroy', { note: slug }));
            }
        },
        [onDelete],
    );

    function resetDrag() {
        setActiveId(null);
        setOverId(null);
        setOffsetLeft(0);
    }

    function onDragStart({ active }: DragStartEvent) {
        sortableSnapshot.current = sortableItems;
        setActiveId(active.id as number);
        setOverId(null);
        setOffsetLeft(0);
    }

    function onDragMove({ delta }: DragMoveEvent) {
        setOffsetLeft(delta.x);
    }

    function onDragOver({ over }: DragOverEvent) {
        if (over) setOverId(over.id as number);
    }

    function onDragEnd({ active, over }: DragEndEvent) {
        const finalOverId = over?.id as number | undefined;
        const snapshot = sortableSnapshot.current;

        if (finalOverId && active.id !== finalOverId) {
            const activeItem = snapshot.find((i) => i.id === active.id);
            if (activeItem) {
                const finalProjection = getProjection(
                    snapshot,
                    active.id as number,
                    finalOverId,
                    offsetLeft,
                    INDENT_WIDTH,
                );
                if (finalProjection) {
                    const activeIdx = snapshot.findIndex(
                        (i) => i.id === active.id,
                    );
                    const overIdx = snapshot.findIndex(
                        (i) => i.id === finalOverId,
                    );
                    const newItems = arrayMove(snapshot, activeIdx, overIdx);
                    const newActiveIdx = newItems.findIndex(
                        (i) => i.id === active.id,
                    );
                    let position = newItems
                        .slice(0, newActiveIdx)
                        .filter(
                            (i) => i.parent_id === finalProjection.parentId,
                        ).length;

                    if (activeItem.parent_id === finalProjection.parentId) {
                        const overDoc = notes.find((i) => i.id === finalOverId);
                        if (overDoc !== undefined) {
                            position = overDoc.position;
                        }
                    }

                    const notesSnapshot = [...notes];
                    onReorder?.(
                        computeOptimisticReorder(
                            notes,
                            active.id as number,
                            finalProjection.parentId,
                            position,
                        ),
                    );
                    router.patch(
                        route('notes.reorder', { note: activeItem.slug }),
                        { parent_id: finalProjection.parentId, position },
                        {
                            preserveScroll: true,
                            preserveState: true,
                            onError: () => onReorder?.(notesSnapshot),
                        },
                    );
                }
            }
        }

        resetDrag();
    }

    const _snap = sortableSnapshot.current.length
        ? sortableSnapshot.current
        : sortableItems;
    const activeIdx = _snap.findIndex((i) => i.id === activeId);
    const overIdx = _snap.findIndex((i) => i.id === overId);
    const isDraggingUp =
        activeIdx !== -1 && overIdx !== -1 && activeIdx > overIdx;

    const activeItem = activeId ? flat.find((i) => i.id === activeId) : null;

    function startResize(e: React.MouseEvent) {
        e.preventDefault();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        function onMove(ev: MouseEvent) {
            if (!isResizing.current) return;
            setSidebarWidth(
                Math.max(160, Math.min(480, startWidth + ev.clientX - startX)),
            );
        }
        function onUp() {
            isResizing.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    return (
        <aside
            className={['docs-sidebar', isOpen ? 'docs-sidebar--open' : '']
                .filter(Boolean)
                .join(' ')}
            style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
            <div className="docs-sidebar-header">
                <div className="docs-sidebar-brand">
                    <span>Monopaper</span>
                </div>
                <div className="docs-sidebar-header-actions">
                    <button
                        className="docs-sidebar-add"
                        onClick={() => onNew()}
                        disabled={creating}
                        title="New note"
                    >
                        <Plus size={13} strokeWidth={2.5} />
                    </button>
                    {onClose && (
                        <button
                            className="docs-sidebar-close"
                            onClick={onClose}
                            title="Close sidebar"
                        >
                            <X size={13} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            <div className="docs-sidebar-search">
                <Search size={11} className="docs-sidebar-search-icon" />
                <input
                    type="text"
                    placeholder="Search…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                />
            </div>

            <div className="docs-sidebar-list">
                <div className="docs-section-label">Notes</div>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={onDragStart}
                    onDragMove={onDragMove}
                    onDragOver={onDragOver}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext
                        items={ids}
                        strategy={verticalListSortingStrategy}
                    >
                        {sortableItems.map((item) => {
                            const isTarget =
                                !!activeId &&
                                item.id === overId &&
                                item.id !== activeId;
                            const lineLeft =
                                (projected?.depth ?? item.depth) *
                                    INDENT_WIDTH +
                                8;
                            return (
                                <SortableItem
                                    key={item.id}
                                    item={item}
                                    isGhost={item.id === activeId}
                                    showLineAbove={isTarget && isDraggingUp}
                                    showLineBelow={isTarget && !isDraggingUp}
                                    lineLeft={lineLeft}
                                    onToggle={toggleCollapse}
                                    onNavigate={goTo}
                                    onAddChild={addChild}
                                    onDelete={deleteNote}
                                    currentSlug={currentSlug}
                                />
                            );
                        })}
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                        {activeItem && (
                            <div className="docs-tree-item docs-drag-overlay">
                                <FileText size={13} />
                                <span className="docs-drag-overlay-title">
                                    {activeItem.title || 'Untitled'}
                                </span>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                {filteredFlat.length === 0 && q && (
                    <div className="docs-sidebar-empty">No results</div>
                )}
                {filteredFlat.length === 0 && !q && (
                    <div className="docs-sidebar-empty">No notes yet</div>
                )}
            </div>

            <div className="docs-sidebar-resizer" onMouseDown={startResize} />
        </aside>
    );
});
