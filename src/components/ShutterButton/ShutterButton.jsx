// components/ShutterButton/ShutterButton.jsx
import { useRef, useEffect, useState, useCallback } from 'react';
import useGestureHover from '../../hooks/useGestureHover';
import styles from './ShutterButton.module.css';

export default function ShutterButton({ videoRef, onCapture, position = 'bottom', isFrontCamera = true, isShootingRef: externalShootingRef }) {
  const canvasRef = useRef(null);
  const buttonRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const internalShootingRef = useRef(false);
  const isShootingRef = externalShootingRef ?? internalShootingRef;

  const takePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const W_v = video.videoWidth;
      const H_v = video.videoHeight;
      const W_c = window.innerWidth;
      const H_c = window.innerHeight;

      // object-fit: cover と同じクロップ範囲を計算（画面に見えている領域）
      const coverScale = Math.max(W_c / W_v, H_c / H_v);
      const cropX = (W_v - W_c / coverScale) / 2;
      const cropY = (H_v - H_c / coverScale) / 2;
      const cropW = W_c / coverScale;
      const cropH = H_c / coverScale;

      // 出力サイズ（長辺1280px以内に収める）
      const MAX_SIZE = 1280;
      const outputScale = Math.min(1, MAX_SIZE / Math.max(cropW, cropH));
      canvas.width = Math.round(cropW * outputScale);
      canvas.height = Math.round(cropH * outputScale);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isFrontCamera) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg', 0.85));
      }
    }
  }, [isFrontCamera, onCapture, videoRef]);

  const triggerShutter = useCallback(() => {
    if (isShootingRef.current) return;
    isShootingRef.current = true;
    setCountdown(3);
  }, [isShootingRef]);

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
  }, [countdown, takePhoto, isShootingRef]);

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
