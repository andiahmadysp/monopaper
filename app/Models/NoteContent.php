<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteContent extends Model
{
    protected $fillable = ['note_id', 'content', 'version_number'];

    protected function casts(): array
    {
        return ['content' => 'array'];
    }

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }
}
