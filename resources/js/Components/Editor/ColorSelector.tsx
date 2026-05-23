import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useEditor, EditorBubbleItem } from 'novel';
import { ChevronDown, Check } from 'lucide-react';

const TEXT_COLORS = [
    { name: 'Default', color: 'var(--fg)' },
    { name: 'Purple',  color: '#9333EA' },
    { name: 'Red',     color: '#E00000' },
    { name: 'Yellow',  color: '#EAB308' },
    { name: 'Blue',    color: '#2563EB' },
    { name: 'Green',   color: '#008A00' },
    { name: 'Orange',  color: '#FFA500' },
    { name: 'Pink',    color: '#BA4081' },
    { name: 'Gray',    color: '#A8A29E' },
];

const HIGHLIGHT_COLORS = [
    { name: 'Default', color: 'transparent' },
    { name: 'Purple',  color: '#DDD6FE' },
    { name: 'Red',     color: '#FECACA' },
    { name: 'Yellow',  color: '#FEF08A' },
    { name: 'Blue',    color: '#BFDBFE' },
    { name: 'Green',   color: '#BBF7D0' },
    { name: 'Orange',  color: '#FED7AA' },
    { name: 'Pink',    color: '#FBCFE8' },
    { name: 'Gray',    color: '#E5E7EB' },
];

interface ColorSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ColorSelector({ open, onOpenChange }: ColorSelectorProps) {
    const { editor } = useEditor();
    if (!editor) return null;

    const activeColor = TEXT_COLORS.find(({ color }) => editor.isActive('textStyle', { color }));
    const activeHighlight = HIGHLIGHT_COLORS.find(({ color }) => editor.isActive('highlight', { color }));

    return (
        <Popover.Root modal open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button className="docs-color-btn" title="Text color">
                    <span
                        className="docs-color-preview"
                        style={{
                            color: activeColor?.color,
                            background: activeHighlight && activeHighlight.name !== 'Default'
                                ? activeHighlight.color
                                : undefined,
                        }}
                    >
                        A
                    </span>
                    <ChevronDown size={11} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={6}
                    className="docs-color-popover"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="docs-color-section-title">Color</div>
                    {TEXT_COLORS.map(({ name, color }) => (
                        <EditorBubbleItem
                            key={name}
                            onSelect={() => {
                                editor.commands.unsetColor();
                                if (name !== 'Default') editor.chain().focus().setColor(color).run();
                                onOpenChange(false);
                            }}
                            className="docs-color-item"
                        >
                            <span className="docs-color-swatch" style={{ color }}>A</span>
                            <span>{name}</span>
                            {activeColor?.name === name && <Check size={11} />}
                        </EditorBubbleItem>
                    ))}
                    <div className="docs-color-divider" />
                    <div className="docs-color-section-title">Highlight</div>
                    {HIGHLIGHT_COLORS.map(({ name, color }) => (
                        <EditorBubbleItem
                            key={name}
                            onSelect={() => {
                                editor.commands.unsetHighlight();
                                if (name !== 'Default') editor.chain().focus().setHighlight({ color }).run();
                                onOpenChange(false);
                            }}
                            className="docs-color-item"
                        >
                            <span
                                className="docs-color-swatch"
                                style={{ background: color, border: name === 'Default' ? '1px solid var(--border-2)' : undefined }}
                            >
                                A
                            </span>
                            <span>{name}</span>
                            {activeHighlight?.name === name && name !== 'Default' && <Check size={11} />}
                        </EditorBubbleItem>
                    ))}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
