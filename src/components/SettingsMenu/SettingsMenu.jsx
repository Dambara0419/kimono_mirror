// components/SettingsMenu/SettingsMenu.jsx
import { useState, useEffect } from 'react';
import CameraSettings from './CameraSettings';
import styles from './SettingsMenu.module.css';

export default function SettingsMenu({ onClose }) {
  // 🌟 AI操作のON/OFFステート（デフォルトはON）
  const [useAI, setUseAI] = useState(true);

  useEffect(() => {
    // 保存されているAI設定の読み込み
    const savedAI = localStorage.getItem('useMediaPipe');
    if (savedAI !== null) {
      setUseAI(savedAI === 'true'); // 文字列をbooleanに変換
    }
  }, []);

  // AI設定がトグルされた時の処理
  const handleAIToggle = () => {
    const nextValue = !useAI;
    setUseAI(nextValue);
    localStorage.setItem('useMediaPipe', String(nextValue));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      
      {/* modalの中をクリックした時は、overlayのonClick(閉じる処理)を発動させない */}
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>⚙️ 設定</h2>
        
        <div className={styles.settingsContainer}>
          
          {/* 🌟 カメラ設定コンポーネントを読み込み */}
          <CameraSettings />

          {/* 🌟 AI操作のトグルスイッチ */}
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>✨ 非接触 AI操作</div>
              <div className={styles.settingDescription}>空中で手をかざして操作します</div>
            </div>
            
            <div 
              className={`${styles.toggleSwitch} ${useAI ? styles.active : ''}`} 
              onClick={handleAIToggle}
            >
              <div className={styles.toggleCircle} />
            </div>
          </div>

        </div>

        <button className={styles.closeButton} onClick={onClose}>
          完了
        </button>
      </div>
      
    </div>
  );
}