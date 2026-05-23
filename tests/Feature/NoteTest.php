<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_unauthenticated_user_cannot_access_notes(): void
    {
        $response = $this->get('/notes');
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_notes_index(): void
    {
        $response = $this->actingAs($this->user)->get('/notes');
        $response->assertStatus(200);
    }

    public function test_user_can_create_a_note(): void
    {
        $response = $this->actingAs($this->user)->postJson('/notes', [
            'title' => 'New Test Note',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'id', 'parent_id', 'position', 'title', 'slug', 'updated_at', 'created_at', 'content'
        ]);

        $this->assertDatabaseHas('notes', [
            'title' => 'New Test Note',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_user_can_update_a_note_title(): void
    {
        $note = Note::create([
            'user_id' => $this->user->id,
            'title' => 'Old Title',
            'slug' => 'old-title',
            'position' => 0,
        ]);

        $response = $this->actingAs($this->user)->from("/notes/{$note->slug}")->patch("/notes/{$note->slug}", [
            'title' => 'Updated Title',
        ]);

        $response->assertRedirect("/notes/{$note->slug}");
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_user_can_delete_a_note(): void
    {
        $note = Note::create([
            'user_id' => $this->user->id,
            'title' => 'To Delete',
            'slug' => 'to-delete',
            'position' => 0,
        ]);

        $response = $this->actingAs($this->user)->delete("/notes/{$note->slug}");

        $response->assertRedirect('/notes');
        $this->assertDatabaseMissing('notes', [
            'id' => $note->id,
        ]);
    }

    public function test_user_can_search_notes_by_title_or_content(): void
    {
        $note1 = Note::create([
            'user_id' => $this->user->id,
            'title' => 'Laravel documentation guide',
            'slug' => 'laravel-doc',
            'position' => 0,
        ]);

        $content = $note1->contents()->create([
            'content' => '<p>This is dynamic content with secret search queries inside.</p>',
            'version_number' => 1,
        ]);
        $note1->update(['current_version_id' => $content->id]);

        $note2 = Note::create([
            'user_id' => $this->user->id,
            'title' => 'Other unrelated notes',
            'slug' => 'other-unrelated',
            'position' => 1,
        ]);

        // Search by title match
        $response = $this->actingAs($this->user)->getJson('/notes/search?q=Laravel');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'slug' => 'laravel-doc',
            'title' => 'Laravel documentation guide',
        ]);

        // Search by content match
        $response = $this->actingAs($this->user)->getJson('/notes/search?q=secret');
        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment([
            'slug' => 'laravel-doc',
        ]);
    }
}
