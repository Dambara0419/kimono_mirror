// components/ShutterButton/ShutterButton.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import useGestureHover from '../../hooks/useGestureHover';
import styles from './ShutterButton.module.css';

export default function ShutterButton({ videoRef, onCapture, position = 'bottom', isFrontCamera = true }) {
  const canvasRef = useRef(null);
  const buttonRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const isShootingRef = useRef(false);

  const triggerShutter = useCallback(() => {
    if (isShootingRef.current) return;
    isShootingRef.current = true;
    setCountdown(3);
  }, []);

  const { progress: hoverProgress } = useGestureHover(buttonRef, triggerShutter, {
    padding: 0,
  });

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      takePhoto();
      setCountdown(null);
      setTimeout(() => { isShootingRef.current = false; }, 1000);
    }
  }, [countdown]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_WIDTH = 1280;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isFrontCamera) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.85));
      }
    }
  };

  return (
    <>
      <div className={styles.shutterWrapper}>
        <button
          ref={buttonRef}
          className={styles.shutterButton}
          onClick={triggerShutter}
        >
          <div className={styles.innerCircle}>
            {hoverProgress > 0 && (
              <div className={styles.progressFill} style={{ height: `${hoverProgress}%` }} />
            )}
          </div>
        </button>
      </div>

      {countdown !== null && (
        <div className={styles.countdownOverlay}>
          <div className={styles.countdownNumber}>{countdown > 0 ? countdown : ''}</div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
