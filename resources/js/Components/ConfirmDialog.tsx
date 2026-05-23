import React, { useEffect, useRef } from 'react';

interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    onConfirm,
    onCancel,
}: Props) {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (open) {
            requestAnimationFrame(() => cancelRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            style={{ alignItems: 'center', paddingTop: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div
                className="modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                style={{ width: 360 }}
            >
                <div className="modal-h">
                    <div className="modal-title" id="confirm-title">{title}</div>
                </div>
                <div className="modal-body" style={{ paddingTop: 10 }}>
                    <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--fg-3)', lineHeight: 1.55 }}>
                        {message}
                    </p>
                </div>
                <div className="modal-foot">
                    <div />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button ref={cancelRef} className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                        <button className="btn btn-ghost btn-danger" onClick={onConfirm}>
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
