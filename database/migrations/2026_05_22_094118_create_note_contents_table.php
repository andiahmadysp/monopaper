<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('note_id')->constrained()->cascadeOnDelete();
            $table->longText('content')->nullable();
            $table->integer('version_number')->default(1);
            $table->timestamps();

            $table->index(['note_id', 'version_number']);
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->foreign('current_version_id')->references('id')->on('note_contents')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });
        Schema::dropIfExists('note_contents');
    }
};
