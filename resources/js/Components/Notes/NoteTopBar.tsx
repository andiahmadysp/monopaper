import { memo } from 'react';
import { Minimize2, PanelLeft, Search } from 'lucide-react';

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
            <button
                className="docs-topbar-menu-btn"
                onClick={onToggleSidebar}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
            >
                <PanelLeft size={15} strokeWidth={1.75} />
            </button>
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
                    <button
                        className="docs-topbar-exit-focus"
                        onClick={onExitFocus}
                        title="Exit focus mode"
                        aria-label="Exit focus mode"
                    >
                        <Minimize2 size={14} strokeWidth={1.75} />
                    </button>
                )}
            </div>
        </div>
    );
});
