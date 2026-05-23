import { Node, Extension, mergeAttributes } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import { PluginKey, NodeSelection } from '@tiptap/pm/state';

export interface WikiNote {
    slug: string;
    title: string;
}

const SuggestionPluginKey = new PluginKey('wikiLinkSuggestion');

// ── Popup ─────────────────────────────────────────────────────────────────────

function buildPopup(
    container: HTMLElement,
    items: WikiNote[],
    activeIdx: number,
    onSelect: (note: WikiNote) => void,
) {
    container.innerHTML = '';

    if (items.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'wl-popup-empty';
        empty.textContent = 'No matching notes';
        container.appendChild(empty);
        return;
    }

    items.forEach((note, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `wl-popup-item${i === activeIdx ? ' active' : ''}`;
        btn.textContent = note.title;
        btn.addEventListener('mousedown', (e) => { e.preventDefault(); onSelect(note); });
        container.appendChild(btn);
    });
}

// ── Atom node: stores slug + title, cannot enter cursor inside ────────────────

export const WikiLinkNode = Node.create({
    name: 'wikiLink',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            slug:  { default: null },
            title: { default: '' },
        };
    },

    parseHTML() {
        return [{
            tag: 'span[data-wiki-link]',
            getAttrs: (el) => ({
                slug:  (el as HTMLElement).dataset.slug ?? null,
                title: (el as HTMLElement).textContent ?? '',
            }),
        }];
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-wiki-link': '',
                'data-slug':      node.attrs.slug,
                class:            'docs-wikilink',
                title:            'Click to follow link',
            }),
            node.attrs.title as string,
        ];
    },

    addKeyboardShortcuts() {
        return {
            ArrowRight: () => {
                const { selection } = this.editor.state;
                if (selection instanceof NodeSelection && selection.node.type === this.type) {
                    return this.editor.commands.setTextSelection(selection.to);
                }
                return false;
            },
            ArrowLeft: () => {
                const { selection } = this.editor.state;
                if (selection instanceof NodeSelection && selection.node.type === this.type) {
                    return this.editor.commands.setTextSelection(selection.from);
                }
                return false;
            },
        };
    },
});

// ── Suggestion extension: handles [[ trigger ──────────────────────────────────

export function createWikiLinkSuggestion(notes: WikiNote[]) {
    return Extension.create({
        name: 'wikiLinkSuggestion',

        addProseMirrorPlugins() {
            const notesList = notes;

            return [
                Suggestion<WikiNote, WikiNote>({
                    pluginKey:       SuggestionPluginKey,
                    editor:          this.editor,
                    char:            '[[',
                    allowSpaces:     true,
                    allowedPrefixes: null,

                    items: ({ query }) => {
                        if (!query) return notesList.slice(0, 8);
                        const q = query.toLowerCase();
                        return notesList.filter((n) => n.title.toLowerCase().includes(q)).slice(0, 8);
                    },

                    command: ({ editor, range, props }) => {
                        editor
                            .chain()
                            .focus()
                            .deleteRange(range)
                            .insertContentAt(range.from, {
                                type:  'wikiLink',
                                attrs: { slug: props.slug, title: props.title },
                            })
                            .run();
                    },

                    render: () => {
                        let popup:     any        = null;
                        let container: HTMLElement;
                        let items:     WikiNote[] = [];
                        let idx        = 0;
                        let cmdFn:     ((note: WikiNote) => void) | null = null;

                        const rebuild = () =>
                            buildPopup(container, items, idx, (note) => cmdFn?.(note));

                        return {
                            onStart(props) {
                                cmdFn     = props.command;
                                items     = props.items;
                                idx       = 0;
                                container = document.createElement('div');
                                container.className = 'wl-popup';
                                rebuild();

                                import('tippy.js').then(({ default: tippy }) => {
                                    popup = tippy('body', {
                                        getReferenceClientRect: () =>
                                            props.clientRect?.() ?? document.body.getBoundingClientRect(),
                                        appendTo:     () => document.body,
                                        content:      container,
                                        showOnCreate: true,
                                        interactive:  true,
                                        trigger:      'manual',
                                        placement:    'bottom-start',
                                        arrow:        false,
                                        offset:       [0, 6] as [number, number],
                                        theme:        'wl',
                                    });
                                });
                            },

                            onUpdate(props) {
                                cmdFn = props.command;
                                items = props.items;
                                idx   = 0;
                                rebuild();
                                popup?.[0]?.setProps({
                                    getReferenceClientRect: () =>
                                        props.clientRect?.() ?? document.body.getBoundingClientRect(),
                                });
                            },

                            onKeyDown(props) {
                                const { key } = props.event;
                                if (key === 'Escape') { popup?.[0]?.hide(); return true; }
                                if (key === 'ArrowDown') {
                                    idx = (idx + 1) % Math.max(items.length, 1);
                                    rebuild(); return true;
                                }
                                if (key === 'ArrowUp') {
                                    idx = (idx - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
                                    rebuild(); return true;
                                }
                                if (key === 'Enter') {
                                    if (items[idx]) cmdFn?.(items[idx]);
                                    return true;
                                }
                                return false;
                            },

                            onExit() {
                                popup?.[0]?.destroy();
                                popup = null;
                            },
                        };
                    },
                }),
            ];
        },
    });
}
