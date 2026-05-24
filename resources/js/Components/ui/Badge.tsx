import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
    variant?: BadgeVariant;
    className?: string;
    children: ReactNode;
}

const variantClass: Record<BadgeVariant, string> = {
    default: 'badge',
    success: 'badge badge--success',
    warning: 'badge badge--warning',
    danger:  'badge badge--danger',
    info:    'badge badge--info',
};

export function Badge({ variant = 'default', className, children }: BadgeProps) {
    return (
        <span className={cn(variantClass[variant], className)}>
            {children}
        </span>
    );
}
