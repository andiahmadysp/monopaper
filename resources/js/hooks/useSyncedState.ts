import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

/**
 * Like useState(init) but also syncs from Inertia props whenever they change —
 * EXCEPT while a router request is in-flight, so optimistic updates aren't
 * clobbered by a stale prop value when the user navigates away mid-request.
 */
export function useSyncedState<T>(initValue: T | undefined, fallback: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(initValue !== undefined ? initValue : fallback);
    const inflightRef = useRef(false);

    // Track Inertia request lifecycle at module mount
    useEffect(() => {
        const offStart  = router.on('start',  () => { inflightRef.current = true; });
        const offFinish = router.on('finish', () => { inflightRef.current = false; });
        return () => { offStart(); offFinish(); };
    }, []);

    // Sync from props only when no request is in-flight and value is defined
    useEffect(() => {
        if (!inflightRef.current && initValue !== undefined) {
            setState(initValue);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initValue]);

    return [state, setState];
}
