<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Note extends Model
{
    protected $fillable = ['user_id', 'parent_id', 'position', 'title', 'slug', 'current_version_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Note::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Note::class, 'parent_id')->orderBy('position');
    }

    public function contents(): HasMany
    {
        return $this->hasMany(NoteContent::class);
    }

    public function currentContent(): BelongsTo
    {
        return $this->belongsTo(NoteContent::class, 'current_version_id');
    }
}
