// pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsMenu from '../components/SettingsMenu/SettingsMenu';
import styles from './Home.module.css';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const startFitting = () => {
    navigate('/yukata')
  }

  return (
    <div className={styles.container}>
      
      {/* ギアアイコン */}
      <button 
        className={styles.settingsButton} 
        onClick={() => setIsSettingsOpen(true)}
        title="設定"
      >
        ⚙️
      </button>

      {/* メインコンテンツ */}
      <div className={styles.mainContent}>
        <div className={styles.logoMark}>👘</div>
        <h1 className={styles.title}>Kimono Mirror</h1>
        <p className={styles.subtitle}>
          — AIで体験する、未来の試着 —<br/>
          <span style={{ fontSize: '0.8em', opacity: 0.8, marginTop: '10px', display: 'block' }}>
            画面の前に立って、手をかざしてください
          </span>
        </p>

        <button className={styles.startButton} onClick={startFitting}>
          体験をはじめる
        </button>
      </div>

      {isSettingsOpen && (
        <SettingsMenu onClose={() => setIsSettingsOpen(false)} />
      )}
      
    </div>
  );
}
