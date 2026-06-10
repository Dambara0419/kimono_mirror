import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';

const HandTrackingContext = createContext(null);

export const HandTrackingProvider = ({ children, videoRef, isEnabled = true }) => {
  const [fingerPositions, setFingerPositions] = useState([]);
  const handsRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastProcessedTime = useRef(0);

  useEffect(() => {
    let isComponentMounted = true;

    if (!isEnabled) {
      setFingerPositions([]);
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      return;
    }

    // MediaPipe Handsの初期化
    const initMediaPipe = () => {
      if (!window.Hands) return;

      handsRef.current = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      handsRef.current.onResults((results) => {
        if (!isComponentMounted) return;
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const positions = results.multiHandLandmarks.map(landmarks => ({
            x: landmarks[8].x,
            y: landmarks[8].y,
          }));
          setFingerPositions(positions);
        } else {
          setFingerPositions([]);
        }
      });

      // 🌟 自前でカメラを起動せず、videoRefの映像をループで解析する
      const processVideo = async () => {
        const now = Date.now();
        if (now - lastProcessedTime.current >= 66) {
          lastProcessedTime.current = now;
          if (handsRef.current && videoRef.current && videoRef.current.readyState >= 2) {
            try {
              await handsRef.current.send({ image: videoRef.current });
            } catch (e) {
              console.error("MediaPipe Analysis Error:", e);
            }
          }
        }
        if (isComponentMounted && isEnabled) {
          animationFrameRef.current = requestAnimationFrame(processVideo);
        }
      };

      processVideo();
    };

    // 準備ができ次第開始
    let checkTimerId = null;
    const checkReady = () => {
      if (!isComponentMounted) return;
      if (window.Hands && videoRef.current) {
        initMediaPipe();
      } else {
        checkTimerId = setTimeout(checkReady, 500);
      }
    };

    checkReady();

    return () => {
      isComponentMounted = false;
      if (checkTimerId) clearTimeout(checkTimerId);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
  }, [isEnabled, videoRef]);

  // MediaPipeの正規化座標(0-1)をobject-fit:coverのクロップを考慮した画面ピクセルに変換
  const toScreenCoords = useCallback((fp) => {
    const W_c = window.innerWidth;
    const H_c = window.innerHeight;
    const W_v = videoRef.current?.videoWidth;
    const H_v = videoRef.current?.videoHeight;

    if (!W_v || !H_v) {
      return { x: (1 - fp.x) * W_c, y: fp.y * H_c };
    }

    const scale = Math.max(W_c / W_v, H_c / H_v);
    const renderedW = W_v * scale;
    const renderedH = H_v * scale;
    const offsetX = (renderedW - W_c) / 2;
    const offsetY = (renderedH - H_c) / 2;

    return {
      x: (1 - fp.x) * renderedW - offsetX,
      y: fp.y * renderedH - offsetY,
    };
  }, [videoRef]);

  return (
    <HandTrackingContext.Provider value={{ fingerPositions, isEnabled, toScreenCoords }}>
      {children}
    </HandTrackingContext.Provider>
  );
};

export const useHandTrackingContext = () => {
  const context = useContext(HandTrackingContext);
  if (!context) {
    throw new Error('useHandTrackingContext must be used within a HandTrackingProvider');
  }
  return context;
};
