// pages/Yukata.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Camera from '../components/Camera';
import ShutterButton from '../components/ShutterButton/ShutterButton';
import HomeButton from '../components/HomeButton/HomeButton';
import PersonSelector from '../components/PromptSelectors/PersonSelector';
import ObiColorSelector from '../components/ObiColorSelector/ObiColorSelector';
import BackgroundSelector from '../components/PromptSelectors/BackgroundSelector';
import { HandTrackingProvider, useHandTrackingContext } from '../contexts/HandTrackingContext';
import HandPointer from '../components/HandPointer/HandPointer';
import styles from './Yukata.module.css';

function Guidance() {
  const { fingerPosition } = useHandTrackingContext();
  return (
    <div className={styles.guidance}>
      {fingerPosition ? "設定を選び、シャッターへ手をかざしてください" : "画面の前に立ってください"}
    </div>
  );
}

export default function Yukata() {
  const navigate = useNavigate();
  const [targetPerson, setTargetPerson] = useState('woman');
  const [obiColor, setObiColor] = useState('auto');
  const [backgroundStyle, setBackgroundStyle] = useState('style_studio');
  const [isCapturing, setIsCapturing] = useState(false);
  const [useAI] = useState(() => {
    const saved = localStorage.getItem('useMediaPipe');
    return saved !== null ? saved === 'true' : true;
  });
  const videoRef = useRef(null);

  const handleCapture = (photoData) => {
    if (isCapturing) return;
    setIsCapturing(true); 
    sessionStorage.setItem('originalPhoto', photoData);
    sessionStorage.setItem('targetPerson', targetPerson);
    sessionStorage.setItem('obiColor', obiColor);
    sessionStorage.setItem('backgroundStyle', backgroundStyle);
    setTimeout(() => navigate('/preview'), 200);
  };

  return (
    <HandTrackingProvider videoRef={videoRef} isEnabled={useAI}>
      <div className={styles.container}>
        
        <div className={styles.cameraLayer}>
          <Camera videoRef={videoRef} />
        </div>

        <div className={styles.uiLayer}>
          
          <section className={styles.topSection}>
            <Guidance />
            <ShutterButton videoRef={videoRef} onCapture={handleCapture} position="top" />
          </section>

          <section className={styles.midSection}>
            {/* 左: 帯選択 */}
            <aside className={styles.panel}>
              <ObiColorSelector value={obiColor} onChange={setObiColor} />
            </aside>

            {/* 中央: 空間（被写体用） */}
            <div style={{ flex: 1, pointerEvents: 'none' }} />

            {/* 右: 人物と背景を独立したコンテナに入れる */}
            <div className={styles.rightSideWrapper}>
              <aside className={styles.panel}>
                <PersonSelector value={targetPerson} onChange={setTargetPerson} />
              </aside>
              <aside className={styles.panel}>
                <BackgroundSelector value={backgroundStyle} onChange={setBackgroundStyle} />
              </aside>
            </div>
          </section>

          <section className={styles.bottomSection}>
            <ShutterButton videoRef={videoRef} onCapture={handleCapture} position="bottom" />
          </section>

        </div>

        <div className={styles.homeBtn}>
          <HomeButton onClick={() => navigate('/')} />
        </div>

        {isCapturing && <div className={styles.flash} />}
        <HandPointer />
      </div>
    </HandTrackingProvider>
  );
}
