// pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsMenu from '../components/SettingsMenu/SettingsMenu';
import styles from './Home.module.css';

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const startFitting = (mode) => {
    navigate(`/${mode}`);
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

        <p className={styles.modeLabel}>モードを選んでください</p>
        <div className={styles.modeButtons}>
          <button className={styles.modeButton} onClick={() => startFitting('yukata')}>
            <span className={styles.modeIcon}>👘</span>
            <span className={styles.modeName}>浴衣</span>
          </button>
          <button className={styles.modeButton} onClick={() => startFitting('furisode')}>
            <span className={styles.modeIcon}>🎎</span>
            <span className={styles.modeName}>振袖</span>
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsMenu onClose={() => setIsSettingsOpen(false)} />
      )}
      
    </div>
  );
}
