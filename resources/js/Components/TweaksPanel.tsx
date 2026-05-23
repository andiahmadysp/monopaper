import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Tweaks } from '@/types';
import { useUIStore } from '@/store/ui';

interface Props {
    tweaks: Tweaks;
    onTweak: (key: keyof Tweaks, value: unknown) => void;
}

const ACCENTS = [
    { label: 'Charcoal', value: '#1f1d1a' },
    { label: 'Indigo',   value: '#3b5bdb' },
    { label: 'Sage',     value: '#2f6b4f' },
    { label: 'Amber',    value: '#a8472a' },
    { label: 'Pink',     value: '#f472b6' },
    { label: 'Amethyst', value: '#7c3aed' },
];

const FONT_OPTS = [
    { key: 'sans',  name: 'Sans Serif', style: 'system-ui,-apple-system,sans-serif' },
    { key: 'serif', name: 'Serif',      style: 'Georgia,"Times New Roman",serif'    },
    { key: 'mono',  name: 'Monospace',  style: 'var(--font-mono)'                   },
] as const;

const SIZE_OPTS  = [{ label: 'S', value: 'sm' }, { label: 'M', value: 'md' }, { label: 'L', value: 'lg' }];
const LH_OPTS    = [{ label: 'Tight', value: 'tight' }, { label: 'Normal', value: 'normal' }, { label: 'Relaxed', value: 'relaxed' }];
const WIDTH_OPTS = [{ label: 'Narrow', value: 'narrow' }, { label: 'Standard', value: 'normal' }, { label: 'Wide', value: 'wide' }];

function Seg({ opts, value, onChange }: { opts: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="twk-segmented">
            {opts.map(o => (
                <button key={o.value} type="button"
                    className={`twk-segment-btn${value === o.value ? ' active' : ''}`}
                    onClick={() => onChange(o.value)}
                >{o.label}</button>
            ))}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="twk-switch">
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="twk-switch-slider" />
        </label>
    );
}

export default function TweaksPanel({ tweaks, onTweak }: Props) {
    const [open, setOpen] = useState(false);
    const appearance = useUIStore((s) => s.appearance);
    const setAppear  = useUIStore((s) => s.setAppear);

    useEffect(() => {
        const onMsg = (e: MessageEvent) => {
            if (e.data?.type === '__activate_edit_mode') setOpen(true);
            else if (e.data?.type === '__deactivate_edit_mode') setOpen(false);
        };
        window.addEventListener('message', onMsg);
        window.parent.postMessage({ type: '__edit_mode_available' }, '*');
        return () => window.removeEventListener('message', onMsg);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                setOpen(p => !p);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onEsc);
        return () => window.removeEventListener('keydown', onEsc);
    }, [open]);

    const dismiss = () => {
        setOpen(false);
        window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
    };

    if (!open) return null;

    const preset = tweaks.themePreset || 'charcoal';

    return (
        <>
            <div className="twk-panel-backdrop" onClick={dismiss} />
            <div className="twk-panel">
                <div className="twk-hd">
                    <span className="twk-hd-title">Preferences</span>
                    <button className="twk-x" onClick={dismiss} aria-label="Close">
                        <X size={14} strokeWidth={2} />
                    </button>
                </div>

                <div className="twk-body">
                    {/* ── Appearance ── */}
                    <div className="twk-switch-row">
                        <span className="twk-label">Dark mode</span>
                        <Toggle checked={!!tweaks.dark} onChange={v => onTweak('dark', v)} />
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Theme</span>
                        <Seg opts={[
                            { label: 'Default', value: 'charcoal' },
                            { label: 'Sepia',   value: 'sepia'    },
                            { label: 'Nord',    value: 'nord'     },
                        ]} value={preset} onChange={v => onTweak('themePreset', v)} />
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Accent</span>
                        <div className="twk-color-grid">
                            {ACCENTS.map(a => (
                                <button key={a.value} type="button"
                                    className={`twk-accent-btn${tweaks.accent === a.value ? ' active' : ''}`}
                                    style={{ backgroundColor: a.value }}
                                    title={a.label}
                                    onClick={() => onTweak('accent', a.value)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="twk-divider" />

                    {/* ── Layout ── */}
                    <div className="twk-row">
                        <span className="twk-label">Spacing</span>
                        <Seg opts={[
                            { label: 'Compact',     value: 'compact'     },
                            { label: 'Comfortable', value: 'comfortable' },
                            { label: 'Roomy',       value: 'roomy'       },
                        ]} value={tweaks.density} onChange={v => onTweak('density', v)} />
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Borders</span>
                        <Seg opts={[
                            { label: 'Hairline', value: 'hairline' },
                            { label: 'Subtle',   value: 'subtle'   },
                            { label: 'Crisp',    value: 'crisp'    },
                        ]} value={tweaks.borderSoftness} onChange={v => onTweak('borderSoftness', v)} />
                    </div>

                    <div className="twk-row">
                        <div className="twk-row-between">
                            <span className="twk-label">Font size</span>
                            <span className="twk-label-val">{tweaks.fontSize}px</span>
                        </div>
                        <input type="range" className="twk-slider"
                            min="12" max="20" step="1"
                            value={tweaks.fontSize}
                            onChange={e => onTweak('fontSize', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="twk-divider" />

                    {/* ── Typography ── */}
                    <div className="twk-row">
                        <span className="twk-label">Font</span>
                        <div className="twk-font-grid">
                            {FONT_OPTS.map(f => (
                                <button key={f.key} type="button"
                                    className={`twk-font-btn${appearance.font === f.key ? ' active' : ''}`}
                                    style={{ fontFamily: f.style }}
                                    onClick={() => setAppear('font', f.key)}
                                >{f.name}</button>
                            ))}
                        </div>
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Text size</span>
                        <Seg opts={SIZE_OPTS} value={appearance.size} onChange={v => setAppear('size', v as any)} />
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Line height</span>
                        <Seg opts={LH_OPTS} value={appearance.lh} onChange={v => setAppear('lh', v as any)} />
                    </div>

                    <div className="twk-row">
                        <span className="twk-label">Width</span>
                        <Seg opts={WIDTH_OPTS} value={appearance.width} onChange={v => setAppear('width', v as any)} />
                    </div>

                    <div className="twk-divider" />

                    {/* ── Editor controls ── */}
                    <div className="twk-switch-row">
                        <span className="twk-label">Focus mode</span>
                        <Toggle checked={!!tweaks.focusMode} onChange={v => onTweak('focusMode', v)} />
                    </div>

                    <div className="twk-switch-row">
                        <span className="twk-label">Spellcheck</span>
                        <Toggle checked={tweaks.spellCheck ?? true} onChange={v => onTweak('spellCheck', v)} />
                    </div>

                    <div className="twk-switch-row">
                        <span className="twk-label">Word count</span>
                        <Toggle checked={tweaks.wordCount ?? true} onChange={v => onTweak('wordCount', v)} />
                    </div>
                </div>
            </div>
        </>
    );
}
