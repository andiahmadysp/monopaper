import { NoteListItem } from '@/types';
import { arrayMove } from '@dnd-kit/sortable';

export const INDENT_WIDTH = 14;

// ─── Types ───────────────────────────────────────────────────
export interface FlatItem extends NoteListItem {
    depth: number;
    hasChildren: boolean;
    collapsed: boolean;
}

export interface Projection {
    depth: number;
    parentId: number | null;
}

// ─── Algorithm ───────────────────────────────────────────────
export function getDragDepth(offset: number, indentWidth: number): number {
    return Math.round(offset / indentWidth);
}

export function getMaxDepth({ previousItem }: { previousItem?: FlatItem }): number {
    return previousItem ? previousItem.depth + 1 : 0;
}

export function getMinDepth({ nextItem }: { nextItem?: FlatItem }): number {
    return nextItem ? nextItem.depth : 0;
}

export function getProjection(
    items: FlatItem[],
    activeId: number,
    overId: number,
    dragOffset: number,
    indentWidth: number,
): Projection | null {
    const overIndex = items.findIndex((i) => i.id === overId);
    const activeIndex = items.findIndex((i) => i.id === activeId);
    if (overIndex === -1 || activeIndex === -1) return null;

    const activeItem = items[activeIndex];
    const newItems = arrayMove(items, activeIndex, overIndex);
    const newActiveIndex = newItems.findIndex((i) => i.id === activeId);
    const previousItem = newItems[newActiveIndex - 1];
    const nextItem = newItems[newActiveIndex + 1];

    const dragDepth = getDragDepth(dragOffset, indentWidth);
    const projectedDepth = activeItem.depth + dragDepth;
    const maxDepth = getMaxDepth({ previousItem });
    const minDepth = getMinDepth({ nextItem });
    const depth = Math.max(minDepth, Math.min(maxDepth, projectedDepth));

    function getParentId(): number | null {
        if (depth === 0 || !previousItem) return null;
        if (depth === previousItem.depth) return previousItem.parent_id;
        if (depth > previousItem.depth) return previousItem.id;
        // Shallower — find ancestor at target depth
        const ancestor = newItems
            .slice(0, newActiveIndex)
            .reverse()
            .find((i) => i.depth === depth - 1);
        return ancestor?.id ?? null;
    }

    return { depth, parentId: getParentId() };
}

export function removeChildrenOf(items: FlatItem[], ids: Set<number>): FlatItem[] {
    const exclude = new Set(ids);
    return items.filter((item) => {
        if (item.parent_id !== null && exclude.has(item.parent_id)) {
            if (item.hasChildren) exclude.add(item.id);
            return false;
        }
        return true;
    });
}

// ─── Flatten tree ────────────────────────────────────────────
export function flattenTree(
    items: NoteListItem[],
    collapsed: Set<number>,
    parentId: number | null = null,
    depth = 0,
): FlatItem[] {
    return items
        .filter((i) => i.parent_id === parentId)
        .sort((a, b) => a.position - b.position)
        .flatMap((item) => {
            const hasChildren = items.some((i) => i.parent_id === item.id);
            const isCollapsed = collapsed.has(item.id);
            const flat: FlatItem = {
                ...item,
                depth,
                hasChildren,
                collapsed: isCollapsed,
            };
            if (hasChildren && !isCollapsed) {
                return [
                    flat,
                    ...flattenTree(items, collapsed, item.id, depth + 1),
                ];
            }
            return [flat];
        });
}

// ─── Optimistic reorder helper ───────────────────────────────
export function computeOptimisticReorder(
    notes: NoteListItem[],
    activeId: number,
    newParentId: number | null,
    newPosition: number,
): NoteListItem[] {
    const activeDoc = notes.find((d) => d.id === activeId);
    if (!activeDoc) return notes;
    const oldParentId = activeDoc.parent_id;

    // Remove from old parent, shift siblings down
    let result: NoteListItem[] = notes
        .filter((d) => d.id !== activeId)
        .map((d) => {
            if (
                d.parent_id === oldParentId &&
                d.position > activeDoc.position
            ) {
                return { ...d, position: d.position - 1 };
            }
            return d;
        });

    // Make room in new parent
    result = result.map((d) => {
        if (d.parent_id === newParentId && d.position >= newPosition) {
            return { ...d, position: d.position + 1 };
        }
        return d;
    });

    return [
        ...result,
        { ...activeDoc, parent_id: newParentId, position: newPosition },
    ];
}
