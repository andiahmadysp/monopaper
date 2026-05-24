import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { NoteListItem } from '@/types';
import NotesLayout from '@/Layouts/NotesLayout';
import Sidebar from '@/Components/Sidebar/Sidebar';
import { Button } from '@/Components/ui/Button';

interface Props {
    notes: NoteListItem[];
}

export default function NotesIndex({ notes = [] }: Props) {
    const [creating, setCreating] = useState(false);

    function createNote() {
        if (creating) return;
        setCreating(true);
        router.post(
            route('notes.store'),
            { title: 'Untitled' },
            { onFinish: () => setCreating(false) },
        );
    }

    return (
        <>
            <Head title="Notes" />
            <div className="docs-shell">
                <Sidebar
                    notes={notes}
                    currentSlug=""
                    onNew={createNote}
                    creating={creating}
                    isOpen={true}
                />
                <div className="docs-main">
                    <div className="docs-topbar docs-topbar--empty" />
                    <div className="docs-empty">
                        <div className="docs-empty-title">No notes yet</div>
                        <div className="docs-empty-sub">
                            Create your first note to get started
                        </div>
                        <Button
                            variant="primary"
                            className="docs-empty-btn"
                            onClick={createNote}
                            disabled={creating}
                            loading={creating}
                        >
                            {creating ? 'Creating…' : 'New note'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

NotesIndex.layout = (page: React.ReactNode) => (
    <NotesLayout>{page}</NotesLayout>
);
