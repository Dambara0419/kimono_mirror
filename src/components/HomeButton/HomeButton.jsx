// components/HomeButton/HomeButton.jsx
import { useEffect, useState, useRef } from 'react';
import { useHandTrackingContext } from '../../contexts/HandTrackingContext';
import styles from './HomeButton.module.css';

export default function HomeButton({ onClick }) {
  const { fingerPosition } = useHandTrackingContext();
  const [isHovering, setIsHovering] = useState(false);
  const hoverTimerRef = useRef(null);
  const isClickedRef = useRef(false);

  // AIの当たり判定（画面の右上エリア）
  useEffect(() => {
    if (fingerPosition && !isClickedRef.current) {
      const btnX_min = 0.0; 
      const btnX_max = 0.3; // 右から30%の範囲
      const btnY_min = 0.0; 
      const btnY_max = 0.2; // 上から20%の範囲

      const isInside = 
        fingerPosition.x > btnX_min && fingerPosition.x < btnX_max &&
        fingerPosition.y > btnY_min && fingerPosition.y < btnY_max;

      if (isInside) {
        if (!hoverTimerRef.current) {
          setIsHovering(true);
          // 3秒指を止めたらホームに戻る
          hoverTimerRef.current = setTimeout(() => {
            isClickedRef.current = true;
            onClick();
          }, 2500);
        }
      } else {
        // エリア外に出たらタイマーをリセット
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = null;
          setIsHovering(false);
        }
      }
    } else {
      // 指が消えた時もリセット
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
        setIsHovering(false);
      }
    }
  }, [fingerPosition, onClick]);

  return (
    <button 
      // 🌟 isHovering の時は、CSSの .hovering クラスを追加する
      className={`${styles.button} ${isHovering ? styles.hovering : ''}`} 
      onClick={() => { if(!isClickedRef.current) onClick(); }}
    >
      <span style={{ fontSize: '1.2em' }}>🏠</span>
      <span>ホームに戻る</span>
    </button>
  );
}