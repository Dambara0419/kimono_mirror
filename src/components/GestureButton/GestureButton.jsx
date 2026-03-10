// components/GestureButton/GestureButton.jsx
import { useRef } from 'react';
import useGestureHover from '../../hooks/useGestureHover';
import styles from './GestureButton.module.css';

export default function GestureButton({
  children,
  onClick,
  variant = 'panel', // 'panel' | 'chip' | 'circle'
  active = false,
  themeColor = null,
}) {
  const buttonRef = useRef(null);
  const { progress, isHovering, isBlockedRef, reset } = useGestureHover(buttonRef, onClick);

  const handlePhysicalClick = () => {
    reset();
    if (!isBlockedRef.current) {
      isBlockedRef.current = true;
      onClick();
      setTimeout(() => { isBlockedRef.current = false; }, 1500);
    }
  };

  const baseClass = variant === 'chip' ? styles.chip : styles.panel;
  const activeClass = active ? styles.active : '';
  const hoverClass = isHovering ? styles.hovering : '';

  // Circle circumference for SVG progress ring (radius 24px)
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <button
      ref={buttonRef}
      className={`${baseClass} ${activeClass} ${hoverClass}`}
      style={themeColor ? { '--theme-color': themeColor } : {}}
      onClick={handlePhysicalClick}
    >
      {isHovering && !isBlockedRef.current && (
        <div className={styles.progressRing}>
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle
              className={styles.progressCircleBg}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="4"
              fill="transparent"
              r={radius}
              cx="30"
              cy="30"
            />
            <circle
              className={styles.progressCircle}
              stroke="var(--color-secondary)"
              strokeWidth="4"
              fill="transparent"
              r={radius}
              cx="30"
              cy="30"
              style={{
                strokeDasharray: `${circumference} ${circumference}`,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </button>
  );
}
