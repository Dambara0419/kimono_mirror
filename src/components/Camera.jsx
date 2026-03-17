import { useEffect, useState } from 'react';

function Camera({ deviceId, videoRef, onFacingModeChange }) {
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  useEffect(() => {
    let currentStream = null;

    const startCamera = async () => {
      // 🌟 既存のトラックを物理的に全て停止
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject;
        oldStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      // iOS Safari等のリソース解放待ち
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        const videoConstraints = deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'user' };

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            ...videoConstraints,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false 
        });
        
        currentStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          const track = stream.getVideoTracks()[0];
          const settings = track.getSettings();
          const label = track.label.toLowerCase();
          
          // 反転判定
          const isBack = settings.facingMode === 'environment' || 
                         label.includes('back') || 
                         label.includes('rear') || 
                         label.includes('environment');
          
          setIsFrontCamera(!isBack);
          onFacingModeChange?.(!isBack);
        }
      } catch (error) {
        console.error("Camera start error:", error);
        // ID指定で失敗した場合は、最低限のカメラを起動
        if (deviceId) {
          try {
            const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
            currentStream = fallback;
            if (videoRef.current) videoRef.current.srcObject = fallback;
          } catch (e) {}
        }
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId, videoRef]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'absolute', 
      inset: 0,
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          transform: isFrontCamera ? 'scaleX(-1)' : 'none'
        }} 
      />
    </div>
  );
}

export default Camera
