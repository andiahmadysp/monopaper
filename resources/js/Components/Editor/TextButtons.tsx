import React from 'react';
import { useEditor, EditorBubbleItem } from 'novel';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

export function TextButtons() {
    const { editor } = useEditor();
    if (!editor) return null;

    const buttons = [
        { title: 'Bold',      icon: <Bold size={13} />,          isActive: () => editor.isActive('bold'),      onSelect: () => editor.chain().focus().toggleBold().run() },
        { title: 'Italic',    icon: <Italic size={13} />,        isActive: () => editor.isActive('italic'),    onSelect: () => editor.chain().focus().toggleItalic().run() },
        { title: 'Underline', icon: <Underline size={13} />,     isActive: () => editor.isActive('underline'), onSelect: () => editor.chain().focus().toggleUnderline().run() },
        { title: 'Strike',    icon: <Strikethrough size={13} />, isActive: () => editor.isActive('strike'),    onSelect: () => editor.chain().focus().toggleStrike().run() },
        { title: 'Code',      icon: <Code size={13} />,          isActive: () => editor.isActive('code'),      onSelect: () => editor.chain().focus().toggleCode().run() },
    ];

    return (
        <>
            {buttons.map((btn) => (
                <EditorBubbleItem
                    key={btn.title}
                    onSelect={btn.onSelect}
                    className={`docs-bubble-item${btn.isActive() ? ' active' : ''}`}
                >
                    {btn.icon}
                </EditorBubbleItem>
            ))}
        </>
    );
}
