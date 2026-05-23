import { SuggestionItem, createSuggestionItems } from 'novel';
import {
    AlignLeft,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code2,
    Minus,
    ImageIcon,
} from 'lucide-react';
import React from 'react';

export const slashItems: SuggestionItem[] = createSuggestionItems([
    {
        title: 'Paragraph',
        description: 'Normal text',
        searchTerms: ['text', 'paragraph', 'p'],
        icon: <AlignLeft size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
        title: 'Heading 1',
        description: 'Large section heading',
        searchTerms: ['h1', 'title'],
        icon: <Heading1 size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        searchTerms: ['h2', 'subtitle'],
        icon: <Heading2 size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        searchTerms: ['h3'],
        icon: <Heading3 size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
    },
    {
        title: 'Bullet List',
        description: 'Unordered list',
        searchTerms: ['ul', 'list', 'bullets'],
        icon: <List size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Ordered list',
        searchTerms: ['ol', 'ordered', 'numbers'],
        icon: <ListOrdered size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: 'Task List',
        description: 'Checklist with checkboxes',
        searchTerms: ['todo', 'tasks', 'check', 'checkbox'],
        icon: <CheckSquare size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
        title: 'Quote',
        description: 'Block quotation',
        searchTerms: ['blockquote', 'cite'],
        icon: <Quote size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        title: 'Code Block',
        description: 'Monospace code block',
        searchTerms: ['code', 'pre', 'snippet'],
        icon: <Code2 size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        title: 'Divider',
        description: 'Horizontal rule',
        searchTerms: ['hr', 'rule', 'separator', 'line'],
        icon: <Minus size={15} />,
        command: ({ editor, range }) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
        title: 'Image',
        description: 'Upload an image from your computer',
        searchTerms: ['photo', 'picture', 'media', 'img'],
        icon: <ImageIcon size={15} />,
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).run();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
                if (input.files?.length) {
                    const pos = editor.view.state.selection.from;
                    // The uploadFn is passed into the event context or resolved dynamically.
                    // We will import it or trigger upload.
                    import('./extensions').then(({ uploadFn }) => {
                        uploadFn(input.files![0], editor.view, pos);
                    });
                }
            };
            input.click();
        },
    },
]);
