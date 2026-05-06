import { useEffect, useRef, useState, useCallback } from 'react';
import { useHandTrackingContext } from '../contexts/HandTrackingContext';
import {
  GESTURE_HOVER_DURATION,
  GESTURE_COOLDOWN,
  GESTURE_HIT_PADDING,
} from '../config/constants';

/**
 * Detects when a finger hovers over a button element long enough to activate it.
 *
 * @param {React.RefObject} buttonRef - Ref to the button DOM element
 * @param {Function} onActivate - Callback fired when hover duration is reached
 * @param {Object} options
 * @param {number} options.duration  - ms to hold for activation (default: GESTURE_HOVER_DURATION)
 * @param {number} options.cooldown  - ms cooldown after activation (default: GESTURE_COOLDOWN)
 * @param {number} options.padding   - px hit area expansion (default: GESTURE_HIT_PADDING)
 * @returns {{ progress: number, isHovering: boolean, isBlockedRef: React.RefObject, reset: Function }}
 */
export default function useGestureHover(buttonRef, onActivate, options = {}) {
  const {
    duration = GESTURE_HOVER_DURATION,
    cooldown = GESTURE_COOLDOWN,
    padding = GESTURE_HIT_PADDING,
  } = options;

  const { fingerPositions } = useHandTrackingContext();
  const [progress, setProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const isBlockedRef = useRef(false);

  // Always call the latest version of onActivate without adding it to effect deps
  const onActivateRef = useRef(onActivate);
  useEffect(() => { onActivateRef.current = onActivate; });

  const reset = useCallback(() => {
    cancelAnimationFrame(animationFrameRef.current);
    setIsHovering(false);
    setProgress(0);
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (!buttonRef.current || isBlockedRef.current) return;

    if (fingerPositions.length > 0) {
      const rect = buttonRef.current.getBoundingClientRect();
      const isInside = fingerPositions.some(fp => {
        const fingerX = (1 - fp.x) * window.innerWidth;
        const fingerY = fp.y * window.innerHeight;
        return (
          fingerX >= rect.left - padding &&
          fingerX <= rect.right + padding &&
          fingerY >= rect.top - padding &&
          fingerY <= rect.bottom + padding
        );
      });

      if (isInside) {
        if (!isHovering) {
          setIsHovering(true);
          startTimeRef.current = performance.now();

          const animate = (time) => {
            const elapsed = time - startTimeRef.current;
            const newProgress = Math.min((elapsed / duration) * 100, 100);
            setProgress(newProgress);

            if (newProgress < 100) {
              animationFrameRef.current = requestAnimationFrame(animate);
            } else {
              isBlockedRef.current = true;
              onActivateRef.current();
              cooldownTimerRef.current = setTimeout(() => {
                isBlockedRef.current = false;
                setProgress(0);
                setIsHovering(false);
              }, cooldown);
            }
          };
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      } else {
        if (isHovering) reset();
      }
    } else {
      if (isHovering) reset();
    }
  }, [fingerPositions, isHovering, duration, cooldown, padding, buttonRef, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  return { progress, isHovering, isBlockedRef, reset };
}
