<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $users = User::all();
        $authenticatedUser = null;

        foreach ($users as $user) {
            if (Hash::check($request->password, $user->password)) {
                $authenticatedUser = $user;
                break;
            }
        }

        if (! $authenticatedUser) {
            return back()->withErrors(['password' => 'Incorrect password.']);
        }

        Auth::login($authenticatedUser, remember: true);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
