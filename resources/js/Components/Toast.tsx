import React, { useEffect, useState } from 'react';
import type { ToastItem, ToastType } from '@/types';

interface ToastProps {
    item: ToastItem;
    onDismiss: (id: number) => void;
}

function Toast({ item, onDismiss }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 10);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={`toast toast-${item.type} ${visible ? 'toast-in' : ''}`}
            onClick={() => onDismiss(item.id)}
            title="Dismiss"
        >
            <span className="toast-msg">{item.message}</span>
        </div>
    );
}

interface ToasterProps {
    toasts: ToastItem[];
    dismiss: (id: number) => void;
}

export function Toaster({ toasts, dismiss }: ToasterProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="toaster">
            {toasts.map((item) => (
                <Toast key={item.id} item={item} onDismiss={dismiss} />
            ))}
        </div>
    );
}
