import React, { useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useEditor } from 'novel';
import { Link, Trash, Check } from 'lucide-react';

function getUrlFromString(str: string): string | null {
    try { new URL(str); return str; } catch {}
    try {
        if (str.includes('.') && !str.includes(' '))
            return new URL(`https://${str}`).toString();
    } catch {}
    return null;
}

interface LinkSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LinkSelector({ open, onOpenChange }: LinkSelectorProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { editor } = useEditor();

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    if (!editor) return null;

    const href: string = editor.getAttributes('link').href ?? '';

    return (
        <Popover.Root modal open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button
                    className={`docs-bubble-item${editor.isActive('link') ? ' active' : ''}`}
                    title="Link"
                >
                    <Link size={13} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={10}
                    className="docs-link-popover"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const url = getUrlFromString(inputRef.current?.value ?? '');
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                            }
                            onOpenChange(false);
                        }}
                        className="flex items-center gap-1"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Paste a link…"
                            defaultValue={href}
                            className="docs-link-input"
                        />
                        {href ? (
                            <button
                                type="button"
                                className="docs-link-btn docs-link-btn--danger"
                                onClick={() => {
                                    editor.chain().focus().unsetLink().run();
                                    onOpenChange(false);
                                }}
                            >
                                <Trash size={12} />
                            </button>
                        ) : (
                            <button type="submit" className="docs-link-btn">
                                <Check size={12} />
                            </button>
                        )}
                    </form>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
