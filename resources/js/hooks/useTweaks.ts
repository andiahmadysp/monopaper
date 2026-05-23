import { useUIStore } from '@/store/ui';
import type { Tweaks } from '@/types';

export function useTweaks(): [Tweaks, (key: keyof Tweaks, value: unknown) => void] {
    const tweaks = useUIStore((s) => s.tweaks);
    const setTweak = useUIStore((s) => s.setTweak);
    return [tweaks, setTweak];
}
