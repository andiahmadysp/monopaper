import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children: ReactNode;
}

const variantClass: Record<Variant, string> = {
    primary:   'btn btn-primary',
    secondary: 'btn',
    ghost:     'btn btn-ghost',
    danger:    'btn btn-danger',
};

const sizeClass: Record<Size, string> = {
    sm: 'btn--sm',
    md: '',
    lg: 'btn--lg',
};

export function Button({
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={cn(variantClass[variant], sizeClass[size], className)}
        >
            {children}
        </button>
    );
}
