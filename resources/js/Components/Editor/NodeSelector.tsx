import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
    useEditor,
    EditorBubbleItem,
    type EditorInstance,
} from 'novel';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code2,
    ChevronDown,
    TextIcon,
    Check,
} from 'lucide-react';

type NodeItem = {
    name: string;
    icon: React.ReactNode;
    command: (editor: EditorInstance) => void;
    isActive: (editor: EditorInstance) => boolean;
};

const NODE_ITEMS: NodeItem[] = [
    {
        name: 'Text',
        icon: <TextIcon size={12} />,
        command: (e) => e.chain().focus().clearNodes().run(),
        isActive: (e) => e.isActive('paragraph') && !e.isActive('bulletList') && !e.isActive('orderedList'),
    },
    {
        name: 'Heading 1',
        icon: <Heading1 size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleHeading({ level: 1 }).run(),
        isActive: (e) => e.isActive('heading', { level: 1 }),
    },
    {
        name: 'Heading 2',
        icon: <Heading2 size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleHeading({ level: 2 }).run(),
        isActive: (e) => e.isActive('heading', { level: 2 }),
    },
    {
        name: 'Heading 3',
        icon: <Heading3 size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleHeading({ level: 3 }).run(),
        isActive: (e) => e.isActive('heading', { level: 3 }),
    },
    {
        name: 'Bullet List',
        icon: <List size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleBulletList().run(),
        isActive: (e) => e.isActive('bulletList'),
    },
    {
        name: 'Numbered List',
        icon: <ListOrdered size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleOrderedList().run(),
        isActive: (e) => e.isActive('orderedList'),
    },
    {
        name: 'To-do List',
        icon: <CheckSquare size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleTaskList().run(),
        isActive: (e) => e.isActive('taskItem'),
    },
    {
        name: 'Quote',
        icon: <Quote size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleBlockquote().run(),
        isActive: (e) => e.isActive('blockquote'),
    },
    {
        name: 'Code Block',
        icon: <Code2 size={12} />,
        command: (e) => e.chain().focus().clearNodes().toggleCodeBlock().run(),
        isActive: (e) => e.isActive('codeBlock'),
    },
];

interface NodeSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NodeSelector({ open, onOpenChange }: NodeSelectorProps) {
    const { editor } = useEditor();
    if (!editor) return null;

    const active = NODE_ITEMS.filter((i) => i.isActive(editor)).pop() ?? { name: 'Multiple' };

    return (
        <Popover.Root modal open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                <button className="docs-node-btn" title="Block type">
                    <span>{active.name}</span>
                    <ChevronDown size={11} />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={6}
                    className="docs-node-popover"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {NODE_ITEMS.map((item) => (
                        <EditorBubbleItem
                            key={item.name}
                            onSelect={(ed) => { item.command(ed); onOpenChange(false); }}
                            className="docs-node-item"
                        >
                            <span className="docs-node-item-icon">{item.icon}</span>
                            <span>{item.name}</span>
                            {active.name === item.name && <Check size={12} className="docs-node-item-check" />}
                        </EditorBubbleItem>
                    ))}
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
