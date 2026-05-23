<?php

namespace App\Services;

use App\Models\Note;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NoteService
{
    /**
     * Get the cache key for a user's sidebar notes.
     */
    public function sidebarCacheKey(int $userId): string
    {
        return 'notes:sidebar:' . $userId;
    }

    /**
     * Retrieve notes for the sidebar, cached for performance.
     */
    public function getSidebarNotes(int $userId): array
    {
        return Cache::remember($this->sidebarCacheKey($userId), 300, function () use ($userId) {
            return Note::where('user_id', $userId)
                ->orderBy('position')
                ->get(['id', 'parent_id', 'position', 'title', 'slug', 'updated_at'])
                ->toArray();
        });
    }

    /**
     * Bust the sidebar notes cache.
     */
    public function bustSidebarCache(int $userId): void
    {
        Cache::forget($this->sidebarCacheKey($userId));
    }

    /**
     * Search notes by title or content.
     */
    public function searchNotes(string $query, int $userId): array
    {
        if (trim($query) === '') {
            return [];
        }

        // Fetch candidates matching the title or raw content string from the DB
        $notes = Note::where('notes.user_id', $userId)
            ->leftJoin('note_contents', 'notes.current_version_id', '=', 'note_contents.id')
            ->where(function ($q) use ($query) {
                $q->where('notes.title', 'like', '%' . $query . '%')
                  ->orWhere('note_contents.content', 'like', '%' . $query . '%');
            })
            ->select('notes.id', 'notes.title', 'notes.slug', 'note_contents.content')
            ->get();

        $results = [];
        $queryLower = mb_strtolower($query);

        foreach ($notes as $note) {
            $title = $note->title ?: 'Untitled';
            
            // Extract clean plain text from TipTap JSON format
            $plainContent = '';
            if ($note->content) {
                $decoded = json_decode($note->content, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $plainContent = $this->extractTextFromNode($decoded);
                } else {
                    $plainContent = strip_tags($note->content);
                }
            }

            // Decode HTML entities and normalize text spacing
            $plainContent = html_entity_decode($plainContent, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $plainContentLower = mb_strtolower($plainContent);
            $titleLower = mb_strtolower($title);

            // Double check if query actually matches title or the plain text content
            $titlePos = mb_strpos($titleLower, $queryLower);
            $contentPos = mb_strpos($plainContentLower, $queryLower);

            // Filter out false positives (e.g. queries matching structure keys inside the raw JSON)
            if ($titlePos === false && $contentPos === false) {
                continue;
            }

            $snippet = '';
            if ($contentPos !== false) {
                // Found in content, extract snippet centered around match
                $start = max(0, $contentPos - 40);
                $length = mb_strlen($query) + 80;
                $excerpt = mb_substr($plainContent, $start, $length);
                
                $prefix = $start > 0 ? '…' : '';
                $suffix = ($start + $length) < mb_strlen($plainContent) ? '…' : '';
                $snippet = $prefix . trim(preg_replace('/\s+/', ' ', $excerpt)) . $suffix;
            } else {
                // Not found in content (matched title), show beginning of note text
                $snippet = mb_substr(trim(preg_replace('/\s+/', ' ', $plainContent)), 0, 90);
                if (mb_strlen($plainContent) > 90) {
                    $snippet .= '…';
                }
            }

            $results[] = [
                'id'      => $note->id,
                'title'   => $title,
                'slug'    => $note->slug,
                'snippet' => $snippet,
            ];

            // Limit results for frontend performance
            if (count($results) >= 15) {
                break;
            }
        }

        return $results;
    }

    /**
     * Recursively extract plain text from TipTap JSON structure.
     */
    private function extractTextFromNode(array $node): string
    {
        $text = '';

        if (isset($node['type']) && $node['type'] === 'text' && isset($node['text'])) {
            $text .= $node['text'];
        }

        if (isset($node['content']) && is_array($node['content'])) {
            foreach ($node['content'] as $childNode) {
                if (is_array($childNode)) {
                    $text .= $this->extractTextFromNode($childNode) . ' ';
                }
            }
        }

        return $text;
    }

    /**
     * Create a new note.
     */
    public function createNote(array $data, int $userId): Note
    {
        return DB::transaction(function () use ($data, $userId) {
            $parentId = $data['parent_id'] ?? null;

            if ($parentId) {
                Note::where('id', $parentId)->where('user_id', $userId)->firstOrFail();
            }

            $position = Note::where('user_id', $userId)
                ->where('parent_id', $parentId)
                ->max('position') + 1;

            do {
                $slug = Str::lower(Str::random(10));
            } while (Note::where('slug', $slug)->exists());

            $note = Note::create([
                'user_id'            => $userId,
                'parent_id'          => $parentId,
                'position'           => $position,
                'title'              => $data['title'] ?? 'Untitled',
                'slug'               => $slug,
                'current_version_id' => null,
            ]);

            $this->bustSidebarCache($userId);

            return $note;
        });
    }

    /**
     * Update an existing note's title and/or content.
     */
    public function updateNote(Note $note, array $data, int $userId): Note
    {
        return DB::transaction(function () use ($note, $data, $userId) {
            if (isset($data['title'])) {
                $note->update(['title' => $data['title']]);
                $this->bustSidebarCache($userId);
            }

            if (isset($data['content'])) {
                if ($note->current_version_id) {
                    $currentContent = $note->currentContent()->first();
                    if ($currentContent) {
                        $currentContent->update(['content' => $data['content']]);
                    } else {
                        $currentContent = $note->contents()->create([
                            'content'        => $data['content'],
                            'version_number' => 1,
                        ]);
                        $note->update(['current_version_id' => $currentContent->id]);
                    }
                } else {
                    $currentContent = $note->contents()->create([
                        'content'        => $data['content'],
                        'version_number' => 1,
                    ]);
                    $note->update(['current_version_id' => $currentContent->id]);
                }
            }

            return $note;
        });
    }

    /**
     * Reorder notes tree and hierarchy.
     */
    public function reorderNote(Note $note, ?int $newParentId, int $newPosition, int $userId): void
    {
        DB::transaction(function () use ($note, $newParentId, $newPosition, $userId) {
            if ($newParentId !== null) {
                Note::where('id', $newParentId)->where('user_id', $userId)->firstOrFail();
            }

            // Decrement position of old siblings positioned after this note
            Note::where('user_id', $userId)
                ->where('parent_id', $note->parent_id)
                ->where('position', '>', $note->position)
                ->where('id', '!=', $note->id)
                ->decrement('position');

            // Increment position of new siblings positioned after or at the new position
            Note::where('user_id', $userId)
                ->where('parent_id', $newParentId)
                ->where('position', '>=', $newPosition)
                ->where('id', '!=', $note->id)
                ->increment('position');

            $note->update([
                'parent_id' => $newParentId,
                'position'  => $newPosition,
            ]);

            $this->bustSidebarCache($userId);
        });
    }

    /**
     * Delete a note and return the next active note's slug if available.
     */
    public function deleteNote(Note $note, int $userId): ?string
    {
        return DB::transaction(function () use ($note, $userId) {
            $note->delete();
            $this->bustSidebarCache($userId);

            $next = Note::where('user_id', $userId)
                ->orderBy('position')
                ->first(['slug']);

            return $next ? $next->slug : null;
        });
    }
}
