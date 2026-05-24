import React, { memo, useEffect, useRef, useState } from 'react';
import { IconButton } from '@/Components/ui/IconButton';
import { useSortable } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    File,
    MoreHorizontal,
    Plus,
    Trash2,
} from 'lucide-react';
import { FlatItem, INDENT_WIDTH } from '@/utils/sidebar';

interface ItemProps {
    item: FlatItem;
    isGhost: boolean;
    showLineAbove: boolean;
    showLineBelow: boolean;
    lineLeft: number;
    onToggle: (id: number) => void;
    onNavigate: (slug: string) => void;
    onAddChild: (parentId: number) => void;
    onDelete: (slug: string) => void;
    currentSlug: string;
}

export default memo(function SortableItem({
    item,
    isGhost,
    showLineAbove,
    showLineBelow,
    lineLeft,
    onToggle,
    onNavigate,
    onAddChild,
    onDelete,
    currentSlug,
}: ItemProps) {
    const { listeners, setNodeRef } = useSortable({ id: item.id });
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        function onOutside(e: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', onOutside);
        return () => document.removeEventListener('mousedown', onOutside);
    }, [menuOpen]);

    return (
        <div
            ref={setNodeRef}
            className={isGhost ? 'docs-sortable-item docs-sortable-item--ghost' : 'docs-sortable-item'}
        >
            {showLineAbove && (
                <div
                    className="docs-drop-line"
                    style={{ left: lineLeft }}
                    aria-hidden
                />
            )}

            <div
                className={[
                    'docs-tree-item',
                    item.slug === currentSlug ? 'active' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                style={{ paddingLeft: item.depth * INDENT_WIDTH + 8 }}
                {...listeners}
            >
                {item.hasChildren ? (
                    <button
                        className="docs-tree-chevron"
                        onClick={() => onToggle(item.id)}
                        tabIndex={-1}
                    >
                        {item.collapsed ? (
                            <ChevronRight size={12} strokeWidth={2} />
                        ) : (
                            <ChevronDown size={12} strokeWidth={2} />
                        )}
                    </button>
                ) : (
                    <span className="docs-tree-leaf-icon">
                        <File size={11} strokeWidth={2} />
                    </span>
                )}

                <button
                    className="docs-tree-label"
                    onClick={() => onNavigate(item.slug)}
                    onMouseEnter={() => {
                        if (item.slug !== currentSlug) {
                            router.prefetch(
                                route('notes.show', { note: item.slug }),
                                { only: ['note'] },
                                { cacheFor: '30s' },
                            );
                        }
                    }}
                >
                    <span className="docs-tree-title">
                        {item.title || 'Untitled'}
                    </span>
                </button>

                <span className="docs-tree-actions" ref={menuRef}>
                    <IconButton
                        className="docs-tree-action"
                        aria-label="More options"
                        title="More options"
                        tabIndex={-1}
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen((o) => !o);
                        }}
                    >
                        <MoreHorizontal size={12} strokeWidth={2} />
                    </IconButton>
                    {menuOpen && (
                        <div className="docs-tree-menu">
                            <button
                                className="docs-tree-menu-item"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                    onAddChild(item.id);
                                    setMenuOpen(false);
                                }}
                            >
                                <Plus size={12} strokeWidth={2.5} />
                                <span>New child</span>
                            </button>
                            <button
                                className="docs-tree-menu-item docs-tree-menu-item--danger"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                    onDelete(item.slug);
                                    setMenuOpen(false);
                                }}
                            >
                                <Trash2 size={12} strokeWidth={1.75} />
                                <span>Delete</span>
                            </button>
                        </div>
                    )}
                </span>
            </div>

            {showLineBelow && (
                <div
                    className="docs-drop-line"
                    style={{ left: lineLeft }}
                    aria-hidden
                />
            )}
        </div>
    );
});
