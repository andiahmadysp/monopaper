import { useUIStore } from '@/store/ui';

export function useToast() {
    const toasts = useUIStore((s) => s.toasts);
    const toast = useUIStore((s) => s.toast);
    const dismiss = useUIStore((s) => s.dismissToast);
    return { toasts, toast, dismiss };
}
