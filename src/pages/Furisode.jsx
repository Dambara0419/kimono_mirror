// pages/Furisode.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import Camera from '../components/Camera';
import ShutterButton from '../components/ShutterButton/ShutterButton';
import HomeButton from '../components/HomeButton/HomeButton';
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

export default function Furisode() {
  const navigate = useNavigate();
  const [obiColor, setObiColor] = useState('red');
  const [backgroundStyle, setBackgroundStyle] = useState('style_studio');
  const [isCapturing, setIsCapturing] = useState(false);
  const [useAI] = useState(() => {
    const saved = localStorage.getItem('useMediaPipe');
    return saved !== null ? saved === 'true' : true;
  });
  const videoRef = useRef(null);
  const [preferredCameraId] = useState(() => localStorage.getItem('preferredCameraId') || '');
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const handleCapture = (photoData) => {
    if (isCapturing) return;
    setIsCapturing(true);
    sessionStorage.setItem('costumeMode', 'furisode');
    sessionStorage.setItem('originalPhoto', photoData);
    sessionStorage.setItem('targetPerson', 'woman');
    sessionStorage.setItem('obiColor', obiColor);
    sessionStorage.setItem('backgroundStyle', backgroundStyle);
    setTimeout(() => navigate('/preview'), 200);
  };

  return (
    <HandTrackingProvider videoRef={videoRef} isEnabled={useAI}>
      <div className={styles.container}>

        <div className={styles.cameraLayer}>
          <Camera videoRef={videoRef} deviceId={preferredCameraId || undefined} onFacingModeChange={setIsFrontCamera} />
        </div>

        <div className={styles.uiLayer}>

          <section className={styles.topSection}>
            <Guidance />
            <ShutterButton videoRef={videoRef} onCapture={handleCapture} position="top" isFrontCamera={isFrontCamera} />
          </section>

          <section className={styles.midSection}>
            {/* 左: 帯選択 */}
            <aside className={styles.panel}>
              <ObiColorSelector value={obiColor} onChange={setObiColor} />
            </aside>

            {/* 中央: 空間（被写体用） */}
            <div style={{ flex: 1, pointerEvents: 'none' }} />

            {/* 右: 背景選択のみ（振袖は女性固定のためPersonSelectorなし） */}
            <div className={styles.rightSideWrapper}>
              <aside className={styles.panel}>
                <BackgroundSelector value={backgroundStyle} onChange={setBackgroundStyle} />
              </aside>
            </div>
          </section>

          <section className={styles.bottomSection}>
            <ShutterButton videoRef={videoRef} onCapture={handleCapture} position="bottom" isFrontCamera={isFrontCamera} />
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
