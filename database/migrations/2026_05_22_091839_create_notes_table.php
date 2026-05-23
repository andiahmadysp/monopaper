<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('notes')->cascadeOnDelete();
            $table->integer('position')->default(0);
            $table->string('title');
            $table->string('slug')->unique();
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'parent_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
