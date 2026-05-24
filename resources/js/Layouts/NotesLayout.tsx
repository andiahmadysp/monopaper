import { useApplyTweaks } from '@/hooks/useApplyTweaks';
import { useTweaks } from '@/hooks/useTweaks';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function NotesLayout({ children }: Props) {
    const [t] = useTweaks();
    useApplyTweaks(t);

    return <>{children}</>;
}
