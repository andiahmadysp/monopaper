<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'     => ['sometimes', 'string', 'max:255'],
            'content'   => ['nullable', 'array'],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:notes,id'],
            'position'  => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
