import React, { useEffect, useState, useRef } from 'react';
import { useHandTrackingContext } from '../../contexts/HandTrackingContext';
import styles from './HandPointer.module.css';

export default function HandPointer() {
  const { fingerPositions, isEnabled } = useHandTrackingContext();
  const [trails, setTrails] = useState([]);
  const prevPositionsRef = useRef([]);
  const frameCountRef = useRef(0);
  const trailTimerIdsRef = useRef([]);

  useEffect(() => {
    if (!isEnabled || fingerPositions.length === 0) {
      if (trails.length > 0) setTrails([]);
      prevPositionsRef.current = [];
      return;
    }

    // 2フレームに1回だけトレイルを生成
    frameCountRef.current++;
    if (frameCountRef.current % 2 !== 0) return;

    const newTrails = [];
    fingerPositions.forEach((pos, i) => {
      const prev = prevPositionsRef.current[i];
      if (prev) {
        const dx = pos.x - prev.x;
        const dy = pos.y - prev.y;
        if (Math.sqrt(dx * dx + dy * dy) > 0.02) {
          newTrails.push({ id: `${i}-${performance.now()}`, x: pos.x, y: pos.y });
        }
      }
    });
    prevPositionsRef.current = fingerPositions.slice();

    if (newTrails.length > 0) {
      setTrails(prev => [...prev.slice(-10), ...newTrails]);
      newTrails.forEach(trail => {
        const timerId = setTimeout(() => {
          setTrails(prev => prev.filter(t => t.id !== trail.id));
          trailTimerIdsRef.current = trailTimerIdsRef.current.filter(id => id !== timerId);
        }, 400);
        trailTimerIdsRef.current.push(timerId);
      });
    }
  }, [fingerPositions, isEnabled]);

  // アンマウント時にトレイル削除タイマーをすべてキャンセル
  useEffect(() => {
    return () => { trailTimerIdsRef.current.forEach(clearTimeout); };
  }, []);

  if (!isEnabled || fingerPositions.length === 0) return null;

  return (
    <>
      {trails.map(trail => (
        <div
          key={trail.id}
          className={styles.trail}
          style={{
            left: `${(1 - trail.x) * 100}%`,
            top: `${trail.y * 100}%`,
          }}
        />
      ))}

      {fingerPositions.map((pos, i) => (
        <div
          key={i}
          className={styles.pointer}
          style={{
            left: `${(1 - pos.x) * 100}%`,
            top: `${pos.y * 100}%`,
          }}
        />
      ))}
    </>
  );
}
