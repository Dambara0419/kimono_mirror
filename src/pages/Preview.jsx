// pages/Preview.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Camera from '../components/Camera';
import Print from '../components/Print';
import GestureButton from '../components/GestureButton/GestureButton';
import { HandTrackingProvider } from '../contexts/HandTrackingContext';
import HandPointer from '../components/HandPointer/HandPointer';
import { buildYukataPrompt } from '../config/yukataPrompt';
import { buildFurisodePrompt } from '../config/furisodePrompt';
import styles from './Preview.module.css';

export default function Preview() {
  const navigate = useNavigate();
  const hasRequested = useRef(false);

  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [shareUrl, setShareUrl] = useState(null);

  const [useAI] = useState(() => {
    const saved = localStorage.getItem('useMediaPipe');
    return saved !== null ? saved === 'true' : true;
  });
  const [targetCameraId] = useState(() => localStorage.getItem('preferredCameraId') || undefined);

  const videoRef = useRef(null);

  useEffect(() => {
    if (hasRequested.current) return;
    hasRequested.current = true;

    const savedPhoto = sessionStorage.getItem('originalPhoto');
    const costumeMode = sessionStorage.getItem('costumeMode') || 'yukata';
    const captureRoute = `/${costumeMode}`;
    const gender = sessionStorage.getItem('targetPerson') || 'woman';
    const obiColor = sessionStorage.getItem('obiColor') || 'auto';
    const background = sessionStorage.getItem('backgroundStyle') || 'style_studio';

    if (!savedPhoto) {
      navigate(captureRoute);
      return;
    }

    const generateYukata = async () => {
      try {
        const promptText = costumeMode === 'furisode'
          ? buildFurisodePrompt({ obiColor, background })
          : buildYukataPrompt({ gender, obiColor, background });

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: savedPhoto, promptText }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'サーバーエラー');
        }

        const data = await response.json();
        setGeneratedImage(`data:image/jpeg;base64,${data.newImage}`);
        setIsGenerating(false);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: data.newImage }),
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            setShareUrl(uploadData.url);
          }
        } catch (uploadError) {
          console.error('アップロードエラー:', uploadError);
        }
      } catch (error) {
        console.error('生成エラー:', error);
        setIsGenerating(false);
        alert(`処理が失敗しました。/ Generation failed.\n詳細 / Detail: ${error.message}`);
        hasRequested.current = false;
        navigate(captureRoute);
      }
    };

    generateYukata();
  }, [navigate]);

  const handleRetake = () => {
    const costumeMode = sessionStorage.getItem('costumeMode') || 'yukata';
    sessionStorage.removeItem('originalPhoto');
    hasRequested.current = false;
    navigate(`/${costumeMode}`);
  };

  return (
    <HandTrackingProvider videoRef={videoRef} isEnabled={useAI && !isGenerating}>
      <div className={styles.container}>
        <div className={styles.cameraBackground}>
          {useAI && <Camera deviceId={targetCameraId} videoRef={videoRef} />}
        </div>
        <div className={styles.splitLayout}>
          <div className={styles.imageArea}>
            {isGenerating ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner}></div>
                <h2 className={styles.loadingTitle}>AIが着付けをしております...<br />AI is dressing you up...</h2>
                <p className={styles.loadingSubtitle}>しばらくお待ちください<br />Please wait a moment</p>
              </div>
            ) : generatedImage ? (
              <img src={generatedImage} alt="Generated Yukata" className={styles.generatedImage} />
            ) : null}
          </div>
          <div className={styles.controlArea}>
            {shareUrl && (
              <div className={styles.qrArea}>
                <QRCodeSVG value={shareUrl} size={120} />
                <p className={styles.qrLabel}>スキャンして保存 / Scan to save</p>
              </div>
            )}
            <GestureButton variant="panel" onClick={handleRetake}>
              <span style={{ fontSize: '24px' }}>📸</span>
              <span>もう一度撮影 / Retake</span>
            </GestureButton>
            {/* <Print generatedImage={generatedImage} /> */}
          </div>
        </div>
        <HandPointer />
      </div>
    </HandTrackingProvider>
  );
}
