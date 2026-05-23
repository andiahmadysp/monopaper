import React, { useState, useEffect, useRef } from 'react';
import type { Tweaks } from '@/types';
import { X, Sliders, Moon, Sun, Feather, Eye } from 'lucide-react';
import { useUIStore } from '@/store/ui';

interface TweaksPanelProps {
    tweaks: Tweaks;
    onTweak: (key: keyof Tweaks, value: any) => void;
}

export default function TweaksPanel({ tweaks, onTweak }: TweaksPanelProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'style' | 'editor' | 'preferences'>('style');
    const panelRef = useRef<HTMLDivElement>(null);

    const appearance = useUIStore((s) => s.appearance);
    const setAppear = useUIStore((s) => s.setAppear);

    // Listen to message to open tweaks panel
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data?.type === '__activate_edit_mode') {
                setOpen(true);
            } else if (e.data?.type === '__deactivate_edit_mode') {
                setOpen(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // Listen to keyboard shortcut Ctrl+Shift+A / Cmd+Shift+A
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close panel on ESC
    useEffect(() => {
        if (!open) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open]);

    if (!open) return null;

    const accents = [
        { label: 'Charcoal', value: '#1f1d1a' },
        { label: 'Indigo', value: '#4f46e5' },
        { label: 'Sage', value: '#2e7d32' },
        { label: 'Amber', value: '#d97706' },
        { label: 'Crimson', value: '#be123c' },
        { label: 'Amethyst', value: '#7c3aed' },
    ];

    const presets = [
        { label: 'Charcoal', value: 'charcoal' as const },
        { label: 'Warm Sepia', value: 'sepia' as const },
        { label: 'Polar Nord', value: 'nord' as const },
    ];

    const toggleDark = () => {
        onTweak('dark', !tweaks.dark);
    };

    return (
        <>
            {/* Backdrop for closing */}
            <div className="twk-panel-backdrop" onClick={() => setOpen(false)} />

            <div ref={panelRef} className="twk-panel">
                {/* Header */}
                <div className="twk-hd">
                    <span className="twk-hd-title">
                        <Sliders size={16} strokeWidth={2.5} style={{ color: 'var(--accent)' }} />
                        <span>Preferences</span>
                    </span>
                    <button
                        className="twk-x"
                        onClick={() => setOpen(false)}
                        aria-label="Close preferences"
                    >
                        <X size={15} strokeWidth={2} />
                    </button>
                </div>

                {/* Tabs Selector */}
                <div className="twk-tabs-header">
                    <button
                        type="button"
                        className={`twk-tab-header-btn ${activeTab === 'style' ? 'active' : ''}`}
                        onClick={() => setActiveTab('style')}
                    >
                        Style
                    </button>
                    <button
                        type="button"
                        className={`twk-tab-header-btn ${activeTab === 'editor' ? 'active' : ''}`}
                        onClick={() => setActiveTab('editor')}
                    >
                        Typography
                    </button>
                    <button
                        type="button"
                        className={`twk-tab-header-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preferences')}
                    >
                        Controls
                    </button>
                </div>

                {/* Body Content */}
                <div className="twk-body">
                    {activeTab === 'style' && (
                        <>
                            <div className="twk-sect">Theme & Colors</div>

                            {/* Dark Mode Switch */}
                            <div className="twk-switch-row">
                                <span className="twk-label">Dark Mode</span>
                                <label className="twk-switch">
                                    <input
                                        type="checkbox"
                                        checked={!!tweaks.dark}
                                        onChange={toggleDark}
                                    />
                                    <span className="twk-switch-slider"></span>
                                </label>
                            </div>

                            {/* Preset Theme Selection */}
                            <div className="twk-row">
                                <span className="twk-label">Aesthetic Theme</span>
                                <div className="twk-segmented">
                                    {presets.map((p) => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                (tweaks.themePreset || 'charcoal') === p.value ? 'active' : ''
                                            }`}
                                            onClick={() => onTweak('themePreset', p.value)}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accent Color Circle Grid */}
                            <div className="twk-row">
                                <span className="twk-label">Accent Color</span>
                                <div className="twk-color-grid">
                                    {accents.map((acc) => (
                                        <button
                                            key={acc.value}
                                            type="button"
                                            className={`twk-accent-btn ${
                                                tweaks.accent === acc.value ? 'active' : ''
                                            }`}
                                            style={{ backgroundColor: acc.value }}
                                            title={acc.label}
                                            onClick={() => onTweak('accent', acc.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="twk-sect">UI Comfort</div>

                            {/* Density Segmented */}
                            <div className="twk-row">
                                <span className="twk-label">Sidebar Spacing</span>
                                <div className="twk-segmented">
                                    {(['compact', 'comfortable', 'roomy'] as const).map((density) => (
                                        <button
                                            key={density}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                tweaks.density === density ? 'active' : ''
                                            }`}
                                            onClick={() => onTweak('density', density)}
                                        >
                                            {density.charAt(0).toUpperCase() + density.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Border Softness Segmented */}
                            <div className="twk-row">
                                <span className="twk-label">Borders Thickness</span>
                                <div className="twk-segmented">
                                    {(['hairline', 'subtle', 'crisp'] as const).map((border) => (
                                        <button
                                            key={border}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                tweaks.borderSoftness === border ? 'active' : ''
                                            }`}
                                            onClick={() => onTweak('borderSoftness', border)}
                                        >
                                            {border.charAt(0).toUpperCase() + border.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'editor' && (
                        <>
                            <div className="twk-sect">Typography Styles</div>

                            {/* Font Selection with visual previews */}
                            <div className="twk-row">
                                <span className="twk-label">Font Family</span>
                                <div className="twk-font-grid">
                                    <button
                                        type="button"
                                        className={`twk-font-btn ${appearance.font === 'sans' ? 'active' : ''}`}
                                        style={{ fontFamily: 'var(--font-sans)' }}
                                        onClick={() => setAppear('font', 'sans')}
                                    >
                                        <span className="twk-font-name">Sans Serif</span>
                                        <span className="twk-font-preview">Outfit</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`twk-font-btn ${appearance.font === 'serif' ? 'active' : ''}`}
                                        style={{ fontFamily: 'Georgia, serif' }}
                                        onClick={() => setAppear('font', 'serif')}
                                    >
                                        <span className="twk-font-name">Serif</span>
                                        <span className="twk-font-preview">Georgia</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`twk-font-btn ${appearance.font === 'mono' ? 'active' : ''}`}
                                        style={{ fontFamily: 'var(--font-mono)' }}
                                        onClick={() => setAppear('font', 'mono')}
                                    >
                                        <span className="twk-font-name">Monospace</span>
                                        <span className="twk-font-preview">Geist</span>
                                    </button>
                                </div>
                            </div>

                            {/* Global Base Font Size Slider */}
                            <div className="twk-row">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="twk-label">Interface Font Size</span>
                                    <span className="text-xs opacity-60 font-mono">{tweaks.fontSize}px</span>
                                </div>
                                <div className="twk-slider-container">
                                    <input
                                        type="range"
                                        className="twk-slider"
                                        min="12"
                                        max="20"
                                        step="1"
                                        value={tweaks.fontSize}
                                        onChange={(e) => onTweak('fontSize', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="twk-sect">Editor Format</div>

                            {/* Editor font size (sm, md, lg) */}
                            <div className="twk-row">
                                <span className="twk-label">Writing Size</span>
                                <div className="twk-segmented">
                                    {(['sm', 'md', 'lg'] as const).map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                appearance.size === size ? 'active' : ''
                                            }`}
                                            onClick={() => setAppear('size', size)}
                                        >
                                            {size.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Line Height Selector */}
                            <div className="twk-row">
                                <span className="twk-label">Line Spacing</span>
                                <div className="twk-segmented">
                                    {([
                                        { label: 'Tight', value: 'tight' as const },
                                        { label: 'Normal', value: 'normal' as const },
                                        { label: 'Relaxed', value: 'relaxed' as const },
                                    ]).map((lh) => (
                                        <button
                                            key={lh.value}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                appearance.lh === lh.value ? 'active' : ''
                                            }`}
                                            onClick={() => setAppear('lh', lh.value)}
                                        >
                                            {lh.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content max-width */}
                            <div className="twk-row">
                                <span className="twk-label">Content Width</span>
                                <div className="twk-segmented">
                                    {([
                                        { label: 'Narrow', value: 'narrow' as const },
                                        { label: 'Standard', value: 'normal' as const },
                                        { label: 'Wide', value: 'wide' as const },
                                    ]).map((width) => (
                                        <button
                                            key={width.value}
                                            type="button"
                                            className={`twk-segment-btn ${
                                                appearance.width === width.value ? 'active' : ''
                                            }`}
                                            onClick={() => setAppear('width', width.value)}
                                        >
                                            {width.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'preferences' && (
                        <>
                            <div className="twk-sect">Writing Controls</div>

                            {/* Focus Mode (distraction free toggle) */}
                            <div className="twk-switch-row">
                                <div className="flex flex-col gap-0.5">
                                    <span className="twk-label">Focus Mode</span>
                                    <span style={{ fontSize: '10px', color: 'var(--fg-3)' }}>
                                        Hide sidebar & topbar for distraction-free writing
                                    </span>
                                </div>
                                <label className="twk-switch">
                                    <input
                                        type="checkbox"
                                        checked={!!tweaks.focusMode}
                                        onChange={(e) => onTweak('focusMode', e.target.checked)}
                                    />
                                    <span className="twk-switch-slider"></span>
                                </label>
                            </div>

                            {/* Spellcheck Toggle */}
                            <div className="twk-switch-row">
                                <div className="flex flex-col gap-0.5">
                                    <span className="twk-label">Spellcheck</span>
                                    <span style={{ fontSize: '10px', color: 'var(--fg-3)' }}>
                                        Browser dictionary spellcheck highlighting
                                    </span>
                                </div>
                                <label className="twk-switch">
                                    <input
                                        type="checkbox"
                                        checked={tweaks.spellCheck ?? true}
                                        onChange={(e) => onTweak('spellCheck', e.target.checked)}
                                    />
                                    <span className="twk-switch-slider"></span>
                                </label>
                            </div>

                            {/* Word Count Display Toggle */}
                            <div className="twk-switch-row">
                                <div className="flex flex-col gap-0.5">
                                    <span className="twk-label">Word Counter</span>
                                    <span style={{ fontSize: '10px', color: 'var(--fg-3)' }}>
                                        Display word count and reading time footer
                                    </span>
                                </div>
                                <label className="twk-switch">
                                    <input
                                        type="checkbox"
                                        checked={tweaks.wordCount ?? true}
                                        onChange={(e) => onTweak('wordCount', e.target.checked)}
                                    />
                                    <span className="twk-switch-slider"></span>
                                </label>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
