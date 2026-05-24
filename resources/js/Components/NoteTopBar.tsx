import { memo } from 'react';
import { Minimize2, PanelLeft, Search } from 'lucide-react';
import { IconButton } from '@/Components/ui/IconButton';

type SaveState = 'saved' | 'saving' | 'unsaved';

interface NoteTopBarProps {
    saveState: SaveState;
    focusMode: boolean;
    onToggleSidebar: () => void;
    onOpenPalette: () => void;
    onExitFocus: () => void;
}

export const NoteTopBar = memo(function NoteTopBar({
    saveState,
    focusMode,
    onToggleSidebar,
    onOpenPalette,
    onExitFocus,
}: NoteTopBarProps) {
    return (
        <div className="docs-topbar">
            <IconButton
                className="docs-topbar-menu-btn"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
                onClick={onToggleSidebar}
            >
                <PanelLeft size={15} strokeWidth={1.75} />
            </IconButton>
            <div className="docs-topbar-right">
                <span className={`docs-save-dot docs-save-dot--${saveState}`}>
                    {saveState === 'saved' ? '● Saved' : saveState === 'saving' ? 'Saving…' : '● Unsaved'}
                </span>
                <button
                    className="docs-search-btn"
                    onClick={onOpenPalette}
                    title="Search or open command palette (⌘K)"
                >
                    <Search size={11} strokeWidth={2} />
                    <span>Search or jump to…</span>
                    <span className="docs-search-kbd">⌘K</span>
                </button>
                {focusMode && (
                    <IconButton
                        className="docs-topbar-exit-focus"
                        aria-label="Exit focus mode"
                        title="Exit focus mode"
                        onClick={onExitFocus}
                    >
                        <Minimize2 size={14} strokeWidth={1.75} />
                    </IconButton>
                )}
            </div>
        </div>
    );
});
