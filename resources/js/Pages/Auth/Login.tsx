import { Head, useForm } from '@inertiajs/react';
import { useApplyTweaks } from '@/hooks/useApplyTweaks';
import { useTweaks } from '@/hooks/useTweaks';
import { Button } from '@/Components/ui/Button';
import { Input } from '@/Components/ui/Input';
import { FileText } from 'lucide-react';
import type { FormEventHandler } from 'react';

export default function Login() {
    const [t] = useTweaks();
    useApplyTweaks(t);

    const { data, setData, post, processing, errors } = useForm({ password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => setData('password', '') });
    };

    return (
        <>
            <Head title="Sign in" />
            <div className="auth-screen">
                <div className="auth-card">
                    <div className="modal">
                        <div className="auth-body">
                            <div className="auth-brand">
                                <div className="auth-brand-icon">
                                    <FileText size={20} strokeWidth={2.2} />
                                </div>
                                <h1 className="auth-brand-title">Monopaper</h1>
                                <p className="auth-brand-subtitle">Enter your password to continue</p>
                            </div>

                            <form onSubmit={submit} className="auth-form">
                                <Input
                                    id="password"
                                    type="password"
                                    label="PASSWORD"
                                    error={errors.password}
                                    className="auth-input"
                                    autoFocus
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={processing}
                                    className="auth-submit"
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
