<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Models\Note;
use App\Services\NoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    /**
     * Inject the NoteService.
     */
    public function __construct(
        protected NoteService $noteService
    ) {}

    /**
     * Handle asset uploading for images.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate(['image' => ['required', 'file', 'image', 'max:20480']]);

        $path = $request->file('image')->store('note-images', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }

    /**
     * Search notes by title or content.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');

        $results = $this->noteService->searchNotes($query, auth()->id());

        return response()->json($results);
    }

    /**
     * Display a listing of the notes.
     */
    public function index(): Response|RedirectResponse
    {
        $first = auth()->user()->notes()
            ->whereNull('parent_id')
            ->orderBy('position')
            ->first(['slug']);

        if ($first) {
            return redirect()->route('notes.show', ['note' => $first->slug]);
        }

        return Inertia::render('Notes/Index', [
            'notes' => $this->noteService->getSidebarNotes(auth()->id()),
        ]);
    }

    /**
     * Display the specified note.
     */
    public function show(Note $note): Response
    {
        abort_unless($note->user_id === auth()->id(), 403);

        $note->load('currentContent');
        $content = $note->currentContent ? $note->currentContent->content : null;

        unset($note->currentContent);
        $note->content = $content;

        return Inertia::render('Notes/Show', [
            'notes' => fn () => $this->noteService->getSidebarNotes(auth()->id()),
            'note'  => $note,
        ]);
    }

    /**
     * Store a newly created note in storage.
     */
    public function store(StoreNoteRequest $request): RedirectResponse|JsonResponse
    {
        $note = $this->noteService->createNote(
            $request->validated(),
            auth()->id()
        );

        if ($request->wantsJson()) {
            return response()->json([
                'id'         => $note->id,
                'parent_id'  => $note->parent_id,
                'position'   => $note->position,
                'title'      => $note->title,
                'slug'       => $note->slug,
                'updated_at' => $note->updated_at->toISOString(),
                'created_at' => $note->created_at->toISOString(),
                'content'    => null,
            ]);
        }

        return redirect()->route('notes.show', ['note' => $note->slug]);
    }

    /**
     * Update the specified note in storage.
     */
    public function update(UpdateNoteRequest $request, Note $note): RedirectResponse
    {
        abort_unless($note->user_id === auth()->id(), 403);

        $this->noteService->updateNote(
            $note,
            $request->only(['title', 'content']),
            auth()->id()
        );

        return back();
    }

    /**
     * Reorder a note inside the hierarchy tree.
     */
    public function reorder(Request $request, Note $note): RedirectResponse
    {
        abort_unless($note->user_id === auth()->id(), 403);

        if ($request->input('parent_id') === '') {
            $request->merge(['parent_id' => null]);
        }

        $validated = $request->validate([
            'parent_id' => ['nullable', 'integer'],
            'position'  => ['required', 'integer', 'min:0'],
        ]);

        $this->noteService->reorderNote(
            $note,
            $validated['parent_id'],
            $validated['position'],
            auth()->id()
        );

        return back();
    }

    /**
     * Remove the specified note from storage.
     */
    public function destroy(Note $note): RedirectResponse
    {
        abort_unless($note->user_id === auth()->id(), 403);

        $nextSlug = $this->noteService->deleteNote($note, auth()->id());

        return $nextSlug
            ? redirect()->route('notes.show', ['note' => $nextSlug])
            : redirect()->route('notes.index');
    }
}
