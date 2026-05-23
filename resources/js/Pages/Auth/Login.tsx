import { Head, useForm } from '@inertiajs/react';
import React, { FormEventHandler, useEffect } from 'react';
import { useTweaks } from '@/hooks/useTweaks';
import { FileText } from 'lucide-react';

export default function Login() {
    const [t] = useTweaks();

    // Enforce clean white (light mode) or clean charcoal (dark mode) on the login screen
    useEffect(() => {
        document.documentElement.classList.toggle('dark', !!t.dark);
        document.documentElement.classList.remove('theme-sepia', 'theme-nord');
    }, [t.dark]);

    const { data, setData, post, processing, errors } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => setData('password', '') });
    };

    return (
        <>
            <Head title="Sign in" />
            <div style={{
                height: '100vh',
                background: 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                fontFamily: 'var(--font-sans)',
            }}>
                <div 
                    className="modal" 
                    style={{ 
                        width: '100%', 
                        maxWidth: '340px',
                        animation: 'none', // Disable pop scale animation to prevent layout shifts
                    }}
                >
                    <div style={{ padding: '40px 32px 32px 32px' }}>
                        <div style={{ marginBottom: 28, textAlign: 'center' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 44,
                                height: 44,
                                borderRadius: 'var(--r-md)',
                                background: 'var(--hover)',
                                color: 'var(--accent)',
                                marginBottom: 16,
                                border: 'var(--border-w) solid var(--border)',
                            }}>
                                <FileText size={20} strokeWidth={2.2} />
                            </div>
                            <h1 style={{
                                fontSize: '22px',
                                fontWeight: 600,
                                letterSpacing: '-0.02em',
                                color: 'var(--fg)',
                                lineHeight: 1.15,
                                margin: 0,
                            }}>
                                monopaper
                            </h1>
                            <p style={{ 
                                fontSize: '13px', 
                                color: 'var(--fg-3)', 
                                marginTop: 6,
                                marginInline: 0,
                                marginBottom: 0,
                            }}>
                                Enter your password to continue
                            </p>
                        </div>

                        <form onSubmit={submit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="field">
                                    <label 
                                        htmlFor="password"
                                        style={{
                                            fontSize: '10.5px',
                                            fontWeight: 600,
                                            color: 'var(--fg-3)',
                                            letterSpacing: '0.08em',
                                            marginBottom: '6px',
                                            display: 'block',
                                        }}
                                    >
                                        PASSWORD
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        className="input"
                                        autoFocus
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '38px',
                                        }}
                                    />
                                    {errors.password && (
                                        <span style={{ fontSize: '11px', color: '#b34638', marginTop: 6, display: 'block' }}>
                                            {errors.password}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={processing}
                                    style={{
                                        width: '100%',
                                        height: '38px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                    }}
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
