// components/SettingsMenu/CameraSettings.jsx
import { useState, useEffect } from 'react';
import styles from './SettingsMenu.module.css';

export default function CameraSettings() {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const loadCameras = async () => {
    try {
      // 🌟 一旦カメラを開いて権限を確定させる
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // デバイス一覧を取得
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // 重複を除去（一部ブラウザ対策）
      const uniqueDevices = videoDevices.filter((device, index, self) =>
        index === self.findIndex((t) => t.deviceId === device.deviceId)
      );

      setCameras(uniqueDevices);

      // ストリームを止める
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("カメラリスト取得エラー:", error);
    }
  };

  useEffect(() => {
    loadCameras();
    const savedId = localStorage.getItem('preferredCameraId');
    if (savedId) setSelectedCameraId(savedId);
  }, []);

  const handleCameraChange = (e) => {
    const newId = e.target.value;
    console.log("Saving new camera ID:", newId);
    setSelectedCameraId(newId);
    localStorage.setItem('preferredCameraId', newId);
    
    // 🌟 即座に反映させるためのリロード
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className={styles.settingRow}>
      <div>
        <div className={styles.settingLabel}>📸 カメラを選択</div>
        <div className={styles.settingDescription}>
          {cameras.length > 0 ? `${cameras.length}台のカメラを検出` : "カメラを読み込み中..."}
        </div>
      </div>
      
      <select 
        className={styles.selectBox} 
        value={selectedCameraId} 
        onChange={handleCameraChange}
      >
        <option value="">デフォルト（自動）</option>
        {cameras.map(camera => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || `カメラ (${camera.deviceId.substring(0, 5)})`}
          </option>
        ))}
      </select>
    </div>
  );
}
