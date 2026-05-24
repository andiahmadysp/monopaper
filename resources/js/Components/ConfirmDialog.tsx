import React, { useEffect, useRef } from 'react';
import { Modal } from '@/Components/ui/Modal';
import { Button } from '@/Components/ui/Button';

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
        if (open) requestAnimationFrame(() => cancelRef.current?.focus());
    }, [open]);

    return (
        <Modal
            open={open}
            title={title}
            size="sm"
            centered
            onClose={onCancel}
            footer={
                <div className="modal-foot-actions">
                    <Button ref={cancelRef} variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            }
        >
            <p className="modal-text">{message}</p>
        </Modal>
    );
}
