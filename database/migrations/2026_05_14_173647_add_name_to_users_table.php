<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default('User')->after('id');
        });

        // Set names for existing users
        $users = DB::table('users')->orderBy('id')->get();
        if ($users->count() > 0) {
            DB::table('users')->where('id', $users[0]->id)->update(['name' => 'Andi']);
        }
        if ($users->count() > 1) {
            DB::table('users')->where('id', $users[1]->id)->update(['name' => 'Pacar']);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
        });
    }
};

