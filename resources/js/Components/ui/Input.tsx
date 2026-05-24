import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

export function Input({ error, label, id, className, ...props }: InputProps) {
    return (
        <div className="field">
            {label && (
                <label htmlFor={id} className="auth-field-label">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={cn('input', className)}
                {...props}
            />
            {error && <span className="auth-field-error">{error}</span>}
        </div>
    );
}
