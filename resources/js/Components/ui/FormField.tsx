import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface FormFieldProps {
    label?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}

export function FormField({ label, error, hint, children, className }: FormFieldProps) {
    return (
        <div className={cn('field', className)}>
            {label && <label className="field-label">{label}</label>}
            {children}
            {hint && !error && <p className="field-hint">{hint}</p>}
            {error && <p className="field-error">{error}</p>}
        </div>
    );
}
