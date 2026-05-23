import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { router } from '@inertiajs/react';

export interface Command {
    id: string;
    group: string;
    label: string;
    keywords?: string[];
    hint?: string;
    run: () => void;
    parts?: { text: string; highlight: boolean }[];
    score?: number;
    snippet?: string;
    snippetParts?: { text: string; highlight: boolean }[];
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
    commands: Command[];
}

interface HighlightPart {
    text: string;
    highlight: boolean;
}

interface FuzzyResult {
    matches: boolean;
    score: number;
    parts: HighlightPart[];
}

// Lightweight fuzzy match and highlighting algorithm
function fuzzyMatchAndHighlight(text: string, query: string): FuzzyResult {
    if (!query) {
        return {
            matches: true,
            score: 0,
            parts: [{ text, highlight: false }]
        };
    }

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    let queryIdx = 0;
    let score = 0;
    let consecutiveCount = 0;
    const highlightIndices = new Set<number>();

    for (let textIdx = 0; textIdx < text.length; textIdx++) {
        if (queryIdx < query.length && textLower[textIdx] === queryLower[queryIdx]) {
            highlightIndices.add(textIdx);
            queryIdx++;
            consecutiveCount++;

            // Reward consecutive match
            score += 10 + consecutiveCount * 5;

            // Reward matching start of word
            if (textIdx === 0 || textLower[textIdx - 1] === ' ' || textLower[textIdx - 1] === '_') {
                score += 15;
            }
        } else {
            consecutiveCount = 0;
            score -= 1; // Gap penalty
        }
    }

    const matches = queryIdx === query.length;
    if (!matches) {
        return { matches: false, score: 0, parts: [{ text, highlight: false }] };
    }

    // Boost exact starts-with
    if (textLower.startsWith(queryLower)) {
        score += 50;
    }
    // Boost exact match
    if (textLower === queryLower) {
        score += 100;
    }

    // Build parts
    const parts: HighlightPart[] = [];
    let currentPart = '';
    let currentHighlight = false;

    for (let i = 0; i < text.length; i++) {
        const needHighlight = highlightIndices.has(i);
        if (needHighlight !== currentHighlight) {
            if (currentPart) {
                parts.push({ text: currentPart, highlight: currentHighlight });
            }
            currentPart = text[i];
            currentHighlight = needHighlight;
        } else {
            currentPart += text[i];
        }
    }
    if (currentPart) {
        parts.push({ text: currentPart, highlight: currentHighlight });
    }

    return {
        matches: true,
        score,
        parts
    };
}

export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<{ id: number; title: string; slug: string; snippet: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setSearch('');
            setSearchResults([]);
            setLoading(false);
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    // Fetch search results asynchronously from the backend (with 250ms debounce)
    useEffect(() => {
        if (!search.trim()) {
            setSearchResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(() => {
            fetch(`/notes/search?q=${encodeURIComponent(search)}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Content search failed:', err);
                    setLoading(false);
                });
        }, 250);

        return () => clearTimeout(timer);
    }, [search]);

    // Filter, score, and sort commands (fuzzy search notes + simple search for action/setting commands)
    const filteredCommands = useMemo<Command[]>(() => {
        if (!search.trim()) {
            return commands.map(cmd => ({
                ...cmd,
                score: 0,
                parts: [{ text: cmd.label, highlight: false }]
            }));
        }

        // 1. Map backend search results (notes) to Commands
        const noteResults = searchResults.map((item): Command => {
            const titleResult = fuzzyMatchAndHighlight(item.title, search);
            const snippetResult = fuzzyMatchAndHighlight(item.snippet || '', search);

            return {
                id: `search-${item.id}`,
                group: 'Search Results',
                label: item.title,
                parts: titleResult.parts,
                snippet: item.snippet,
                snippetParts: snippetResult.parts,
                run: () => router.get(route('notes.show', { note: item.slug })),
            };
        });

        // 2. Filter non-note commands (Actions/Create) using simple substring match on label or keywords
        const queryLower = search.toLowerCase();
        const commandResults = commands
            .filter((cmd) => cmd.group !== 'Open') // Exclude notes (group 'Open') from client-side search
            .filter((cmd) => {
                const matchesLabel = cmd.label.toLowerCase().includes(queryLower);
                const matchesKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(queryLower)) ?? false;
                return matchesLabel || matchesKeywords;
            })
            .map((cmd) => ({
                ...cmd,
                parts: [{ text: cmd.label, highlight: false }] // No fuzzy highlights needed for static actions
            }));

        return [...noteResults, ...commandResults];
    }, [search, commands, searchResults]);

    // Group filtered commands (only used in default view when search is empty)
    const grouped = useMemo(() => {
        return filteredCommands.reduce<Record<string, typeof filteredCommands[number][]>>((acc, cmd) => {
            acc[cmd.group] = acc[cmd.group] || [];
            acc[cmd.group].push(cmd);
            return acc;
        }, {});
    }, [filteredCommands]);

    // Adjust active index if it exceeds list size
    useEffect(() => {
        setActiveIndex((prev) => {
            if (filteredCommands.length === 0) return 0;
            if (prev >= filteredCommands.length) return filteredCommands.length - 1;
            return prev;
        });
    }, [filteredCommands]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[activeIndex]) {
                    filteredCommands[activeIndex].run();
                    onClose();
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, filteredCommands, activeIndex, onClose]);

    // Keep active item in view scroll (using direct class targeting for robustness)
    useEffect(() => {
        if (!open || !listRef.current) return;
        const listEl = listRef.current;
        const activeEl = listEl.querySelector('.pal-item.on') as HTMLElement;
        if (!activeEl) return;

        const listRect = listEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        if (activeRect.bottom > listRect.bottom) {
            listEl.scrollTop += activeRect.bottom - listRect.bottom;
        } else if (activeRect.top < listRect.top) {
            listEl.scrollTop -= listRect.top - activeRect.top;
        }
    }, [activeIndex, open]);

    if (!open) return null;

    let absoluteIndex = 0;

    return (
        <div
            className="pal-backdrop"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="pal">
                <div className="pal-search-wrapper">
                    <Search className="pal-search-icon" size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search notes or type a command..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div ref={listRef} className="pal-list">
                    {loading ? (
                        <div className="pal-empty">Searching note content…</div>
                    ) : filteredCommands.length === 0 ? (
                        <div className="pal-empty">No results found for "{search}"</div>
                    ) : !search.trim() ? (
                        // Render Grouped when search is empty (shows categories)
                        Object.entries(grouped).map(([groupName, groupCmds]) => (
                            <div key={groupName}>
                                <div className="pal-group">{groupName}</div>
                                {groupCmds.map((cmd) => {
                                    const index = absoluteIndex++;
                                    const isActive = index === activeIndex;
                                    return (
                                        <div
                                            key={cmd.id}
                                            className={`pal-item ${isActive ? 'on' : ''}`}
                                            onClick={() => {
                                                cmd.run();
                                                onClose();
                                            }}
                                            onMouseEnter={() => setActiveIndex(index)}
                                        >
                                            <span className="pal-label">{cmd.label}</span>
                                            {cmd.hint && <span className="pal-sub">{cmd.hint}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        // Render Flat Sorted Search Results with Snippets
                        filteredCommands.map((cmd, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <div
                                    key={cmd.id}
                                    className={`pal-item ${isActive ? 'on' : ''}`}
                                    onClick={() => {
                                        cmd.run();
                                        onClose();
                                    }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className="pal-item-content">
                                        <span className="pal-label">
                                            {cmd.parts ? (
                                                cmd.parts.map((part, i) => (
                                                    part.highlight ? (
                                                        <mark key={i} className="pal-highlight">{part.text}</mark>
                                                    ) : (
                                                        <span key={i}>{part.text}</span>
                                                    )
                                                ))
                                            ) : (
                                                cmd.label
                                            )}
                                        </span>
                                        {cmd.snippet && (
                                            <span className="pal-snippet">
                                                {cmd.snippetParts ? (
                                                    cmd.snippetParts.map((part, i) => (
                                                        part.highlight ? (
                                                            <mark key={i} className="pal-highlight">{part.text}</mark>
                                                        ) : (
                                                            <span key={i}>{part.text}</span>
                                                        )
                                                    ))
                                                ) : (
                                                    cmd.snippet
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {cmd.hint && <span className="pal-sub">{cmd.hint}</span>}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="pal-foot">
                    <span>Monopaper command palette</span>
                    <div className="keys">
                        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
                        <span><kbd>↵</kbd> select</span>
                        <span><kbd>esc</kbd> close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
