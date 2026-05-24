import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    'aria-label': string;
    children: ReactNode;
    className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function IconButton({ children, className, type = 'button', ...props }, ref) {
        return (
            <button ref={ref} type={type} className={cn('icon-btn', className)} {...props}>
                {children}
            </button>
        );
    },
);
