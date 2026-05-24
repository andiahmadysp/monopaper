import React, { useCallback, useState, useMemo } from 'react';
import { TextSelection } from '@tiptap/pm/state';
import {
    EditorRoot,
    EditorContent,
    EditorBubble,
    EditorCommand,
    EditorCommandList,
    EditorCommandItem,
    EditorCommandEmpty,
    ImageResizer,
    handleCommandNavigation,
    handleImagePaste,
    handleImageDrop,
    type JSONContent,
} from 'novel';
import { getExtensions, uploadFn } from './extensions';
import { createWikiLinkSuggestion, type WikiNote } from './WikiLinkExtension';
import { slashItems } from './slash-items';
import { NodeSelector } from './NodeSelector';
import { TextButtons } from './TextButtons';
import { LinkSelector } from './LinkSelector';
import { ColorSelector } from './ColorSelector';
import { useUIStore } from '@/store/ui';

interface Props {
    initialContent: JSONContent | null;
    onChange: (json: JSONContent) => void;
    docKey: number | string;
    allNotes?: WikiNote[];
}

export default function Editor({ initialContent, onChange, docKey, allNotes = [] }: Props) {
    const [openNode, setOpenNode] = useState(false);
    const [openLink, setOpenLink] = useState(false);
    const [openColor, setOpenColor] = useState(false);

    const spellCheck = useUIStore((s) => s.tweaks.spellCheck ?? true);

    const handleUpdate = useCallback(
        ({ editor }: { editor: { getJSON: () => JSONContent } }) => {
            onChange(editor.getJSON());
        },
        [onChange]
    );

    const extensions = useMemo(
        () => [...getExtensions(), createWikiLinkSuggestion(allNotes)],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [docKey],
    );

    return (
        <EditorRoot>
            <EditorContent
                key={String(docKey)}
                initialContent={initialContent ?? undefined}
                extensions={extensions}
                onUpdate={handleUpdate}
                editorProps={{
                    attributes: {
                        spellcheck: spellCheck ? 'true' : 'false',
                    },
                    handleKeyDown: (_view, event) => handleCommandNavigation(event) ?? false,
                    handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
                    handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
                    handleDOMEvents: {
                        blur: (view) => {
                            if (view.state.selection && 'node' in view.state.selection) {
                                const { tr } = view.state;
                                const pos = view.state.selection.from;
                                const sel = TextSelection.create(view.state.doc, pos);
                                view.dispatch(tr.setSelection(sel));
                            }
                            return false;
                        },
                    },
                }}
                className="novel-editor-wrapper"
                slotAfter={<ImageResizer />}
            >
                <EditorCommand className="docs-slash-cmd">
                    <EditorCommandEmpty className="docs-slash-empty">No results</EditorCommandEmpty>
                    <EditorCommandList>
                        {slashItems.map((item) => (
                            <EditorCommandItem
                                key={item.title}
                                value={item.title}
                                onCommand={item.command!}
                                className="docs-slash-item"
                            >
                                <span className="docs-slash-icon">{item.icon}</span>
                                <span className="docs-slash-meta">
                                    <span className="docs-slash-title">{item.title}</span>
                                    <span className="docs-slash-desc">{item.description}</span>
                                </span>
                            </EditorCommandItem>
                        ))}
                    </EditorCommandList>
                </EditorCommand>

                <EditorBubble
                    className="docs-bubble"
                    tippyOptions={{ duration: 80 }}
                >
                    <NodeSelector
                        open={openNode}
                        onOpenChange={(v) => {
                            setOpenNode(v);
                            if (v) {
                                setOpenLink(false);
                                setOpenColor(false);
                            }
                        }}
                    />
                    <div className="docs-bubble-sep" />
                    <TextButtons />
                    <div className="docs-bubble-sep" />
                    <LinkSelector
                        open={openLink}
                        onOpenChange={(v) => {
                            setOpenLink(v);
                            if (v) {
                                setOpenNode(false);
                                setOpenColor(false);
                            }
                        }}
                    />
                    <div className="docs-bubble-sep" />
                    <ColorSelector
                        open={openColor}
                        onOpenChange={(v) => {
                            setOpenColor(v);
                            if (v) {
                                setOpenNode(false);
                                setOpenLink(false);
                            }
                        }}
                    />
                </EditorBubble>
            </EditorContent>
        </EditorRoot>
    );
}
