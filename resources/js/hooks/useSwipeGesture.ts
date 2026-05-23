import { useEffect, useRef } from 'react';

interface SwipeOptions {
    /** Minimum horizontal px to count as a swipe (default: 60) */
    threshold?: number;
    /** Maximum vertical px allowed before gesture is cancelled (default: 80) */
    verticalTolerance?: number;
    /** If set, only trigger when touch starts within this many px from the left edge */
    edgeLeft?: number;
    /** If set, only trigger when touch starts within this many px from the right edge */
    edgeRight?: number;
    /** If set (0–100), only trigger when touch starts in the bottom N% of the screen */
    bottomPercent?: number;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    /** Element ref to attach listeners to. Defaults to window. */
    targetRef?: React.RefObject<HTMLElement | null>;
    /** Disable the gesture entirely */
    disabled?: boolean;
}

export function useSwipeGesture({
    threshold = 60,
    verticalTolerance = 80,
    edgeLeft,
    edgeRight,
    bottomPercent,
    onSwipeLeft,
    onSwipeRight,
    targetRef,
    disabled = false,
}: SwipeOptions) {
    const startX = useRef(0);
    const startY = useRef(0);
    const active = useRef(false);

    useEffect(() => {
        if (disabled) return;

        const el: Window | HTMLElement = targetRef?.current ?? window;

        function onTouchStart(e: Event) {
            const te = e as TouchEvent;
            const touch = te.touches[0];
            startX.current = touch.clientX;
            startY.current = touch.clientY;

            // Edge constraint checks
            if (edgeLeft !== undefined && touch.clientX > edgeLeft) {
                active.current = false;
                return;
            }
            if (edgeRight !== undefined && touch.clientX < window.innerWidth - edgeRight) {
                active.current = false;
                return;
            }
            if (bottomPercent !== undefined && touch.clientY < window.innerHeight * (1 - bottomPercent / 100)) {
                active.current = false;
                return;
            }

            active.current = true;
        }

        function onTouchEnd(e: Event) {
            if (!active.current) return;
            active.current = false;

            const te = e as TouchEvent;
            const touch = te.changedTouches[0];
            const dx = touch.clientX - startX.current;
            const dy = Math.abs(touch.clientY - startY.current);

            // Ignore if vertical movement dominates
            if (dy > verticalTolerance) return;

            if (dx < -threshold && onSwipeLeft) {
                onSwipeLeft();
            } else if (dx > threshold && onSwipeRight) {
                onSwipeRight();
            }
        }

        el.addEventListener('touchstart', onTouchStart as EventListener, {
            passive: true,
        });
        el.addEventListener('touchend', onTouchEnd as EventListener, {
            passive: true,
        });

        return () => {
            el.removeEventListener('touchstart', onTouchStart as EventListener);
            el.removeEventListener('touchend', onTouchEnd as EventListener);
        };
    }, [
        disabled,
        threshold,
        verticalTolerance,
        edgeLeft,
        edgeRight,
        bottomPercent,
        onSwipeLeft,
        onSwipeRight,
        targetRef,
    ]);
}
