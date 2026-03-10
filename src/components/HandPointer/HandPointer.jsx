import React, { useEffect, useState, useRef } from 'react';
import { useHandTrackingContext } from '../../contexts/HandTrackingContext';
import styles from './HandPointer.module.css';

export default function HandPointer() {
  const { fingerPosition, isEnabled } = useHandTrackingContext();
  const [trails, setTrails] = useState([]);
  const prevPosRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!isEnabled || !fingerPosition) {
      if (trails.length > 0) setTrails([]);
      return;
    }

    // 🌟 パフォーマンス最適化: 2フレームに1回だけトレイルを生成
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;

    if (prevPosRef.current) {
      const dx = fingerPosition.x - prevPosRef.current.x;
      const dy = fingerPosition.y - prevPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0.02) { 
        const newTrail = {
          id: performance.now(),
          x: fingerPosition.x,
          y: fingerPosition.y
        };
        // 🌟 最大数を6個に制限して描画負荷を最小化
        setTrails(prev => [...prev.slice(-5), newTrail]);
        
        setTimeout(() => {
          setTrails(prev => prev.filter(t => t.id !== newTrail.id));
        }, 400);
      }
    }
    prevPosRef.current = fingerPosition;

  }, [fingerPosition, isEnabled]);

  if (!isEnabled || !fingerPosition) return null;

  return (
    <>
      {trails.map(trail => (
        <div
          key={trail.id}
          className={styles.trail}
          style={{ 
            left: `${(1 - trail.x) * 100}%`, 
            top: `${trail.y * 100}%` 
          }}
        />
      ))}

      <div
        className={styles.pointer}
        style={{ 
          left: `${(1 - fingerPosition.x) * 100}%`, 
          top: `${fingerPosition.y * 100}%` 
        }}
      />
    </>
  );
}
