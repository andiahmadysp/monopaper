import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

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
    danger:    'btn btn-ghost btn-danger',
};

const sizeClass: Record<Size, string> = {
    sm: 'btn--sm',
    md: '',
    lg: 'btn--lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'secondary', size = 'md', loading = false, disabled, className, children, ...props },
    ref,
) {
    return (
        <button
            ref={ref}
            {...props}
            disabled={disabled || loading}
            className={cn(variantClass[variant], sizeClass[size], className)}
        >
            {children}
        </button>
    );
});
