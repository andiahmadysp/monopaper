<?php

use App\Http\Controllers\NoteController;
use App\Http\Controllers\LoginController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/', function () {
        return redirect()->route('notes.index');
    });
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::post('/notes/images', [NoteController::class, 'uploadImage'])->name('notes.images.upload');
    Route::get('/notes/search', [NoteController::class, 'search'])->name('notes.search');
    Route::get('/notes', [NoteController::class, 'index'])->name('notes.index');
    Route::post('/notes', [NoteController::class, 'store'])->name('notes.store');
    Route::get('/notes/{note:slug}', [NoteController::class, 'show'])->name('notes.show');
    Route::patch('/notes/{note:slug}', [NoteController::class, 'update'])->name('notes.update');
    Route::patch('/notes/{note:slug}/reorder', [NoteController::class, 'reorder'])->name('notes.reorder');
    Route::delete('/notes/{note:slug}', [NoteController::class, 'destroy'])->name('notes.destroy');
});
