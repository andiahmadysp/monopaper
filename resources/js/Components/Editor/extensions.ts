import {
    StarterKit,
    Placeholder,
    TaskItem,
    TaskList,
    TiptapLink,
    TiptapImage,
    UpdatedImage,
    UploadImagesPlugin,
    createImageUpload,
    TiptapUnderline,
    TextStyle,
    Color,
    HighlightExtension,
    GlobalDragHandle,
    Command,
    renderItems,
} from 'novel';
import { slashItems } from './slash-items';

// ─── Image compression (canvas) ──────────────────────────────────────────────
async function compressImage(file: File, maxWidth = 1920, quality = 0.85): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob((blob) => resolve(blob ?? file), mime, quality);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
        img.src = url;
    });
}

async function onUpload(file: File): Promise<string> {
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('image', compressed, file.name);
    const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const res = await fetch('/docs/images', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrf },
        body: fd,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const { url } = await res.json() as { url: string };
    return url;
}

export const uploadFn = createImageUpload({
    onUpload,
    validateFn: (file) => {
        if (!file.type.startsWith('image/')) return false;
        if (file.size / 1024 / 1024 > 20) return false;
        return true;
    },
});

export const getExtensions = () => [
    StarterKit.configure({
        dropcursor: { color: 'var(--accent)', width: 2 },
    }),
    Placeholder.configure({
        placeholder: ({ node, editor, pos }) => {
            if (node.type.name !== 'paragraph') return '';
            try {
                const $pos = editor.state.doc.resolve(pos);
                for (let d = $pos.depth; d > 0; d--) {
                    const n = $pos.node(d).type.name;
                    if (['listItem', 'taskItem'].includes(n)) return '';
                }
            } catch {}
            return "Press '/' for commands…";
        },
        includeChildren: true,
    }),
    TaskItem.extend({
        addKeyboardShortcuts() {
            return {
                ...this.parent?.(),
                Backspace: () => {
                    const { selection } = this.editor.state;
                    const { empty, $anchor } = selection;

                    if (!empty || $anchor.parentOffset !== 0) return false;

                    const depth = $anchor.depth;
                    if (depth < 2) return false;
                    if ($anchor.node(depth - 1).type.name !== this.name) return false;
                    if ($anchor.parent.content.size > 0) return false;

                    return this.editor
                        .chain()
                        .command(({ tr, state: s, dispatch }) => {
                            if (!dispatch) return true;
                            const { $from } = s.selection;
                            const d = $from.depth;
                            const taskItemPos  = $from.before(d - 1);
                            const taskItemNode = $from.node(d - 1);
                            const taskListNode = $from.node(d - 2);

                            if (taskListNode.childCount === 1) {
                                const taskListPos = $from.before(d - 2);
                                tr.delete(taskListPos, taskListPos + taskListNode.nodeSize);
                            } else {
                                tr.delete(taskItemPos, taskItemPos + taskItemNode.nodeSize);
                            }
                            dispatch(tr);
                            return true;
                        })
                        .run();
                },
            };
        },
    }).configure({ nested: true }),
    TaskList,
    TiptapLink.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: true,
        HTMLAttributes: {
            class: 'docs-link',
            rel: 'noopener noreferrer',
            target: '_blank',
        },
    }),
    TiptapImage.extend({
        addProseMirrorPlugins() {
            return [
                UploadImagesPlugin({
                    imageClass: 'docs-image-uploading',
                }),
            ];
        },
    }).configure({
        allowBase64: true,
        HTMLAttributes: { class: 'docs-image' },
    }),
    UpdatedImage.configure({
        HTMLAttributes: { class: 'docs-image' },
    }),
    TiptapUnderline,
    TextStyle,
    Color,
    HighlightExtension.configure({ multicolor: true }),
    GlobalDragHandle.configure({ dragHandleWidth: 20 }),
    Command.configure({
        suggestion: {
            items: ({ query }: { query: string }) =>
                slashItems.filter(
                    (item) =>
                        !query.length ||
                        item.title.toLowerCase().includes(query.toLowerCase()) ||
                        (item.searchTerms || []).some((t) =>
                            t.toLowerCase().includes(query.toLowerCase()),
                        ),
                ),
            render: renderItems,
        },
    }),
];
