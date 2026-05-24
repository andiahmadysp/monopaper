import { cn } from '@/lib/utils';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
    open: boolean;
    title?: string;
    size?: 'sm' | 'md';
    centered?: boolean;
    onClose?: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

export function Modal({ open, title, size, centered, onClose, children, footer }: ModalProps) {
    useEffect(() => {
        if (!open || !onClose) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose!();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className={cn('modal-backdrop', centered && 'modal-backdrop--centered')}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div
                className={cn('modal', size === 'sm' && 'modal--sm')}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {title && (
                    <div className="modal-h">
                        <div className="modal-title" id="modal-title">{title}</div>
                    </div>
                )}
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-foot">{footer}</div>}
            </div>
        </div>
    );
}
