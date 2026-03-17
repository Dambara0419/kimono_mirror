import GestureButton from '../GestureButton/GestureButton';
import styles from './ObiColorSelector.module.css';

export default function ObiColorSelector({ value, onChange }) {
  const options = [
    // { id: 'auto', label: 'おまかせ', sub: '御任せ', color: '#8e8e93' }, 
    { id: 'red', label: '赤系', sub: '緋色 (Hiiro)', color: '#b33e5c' },
    { id: 'blue', label: '青系', sub: '瑠璃色 (Ruri)', color: '#1e50a2' },
    { id: 'yellow', label: '黄系', sub: '黄金 (Kogane)', color: '#d4af37' },
    { id: 'black', label: '黒系', sub: '墨色 (Sumiiro)', color: '#2b2b2b' }
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>帯の色・色彩</span>
      <div className={styles.group}>
        {options.map(opt => (
          <GestureButton 
            key={opt.id}
            variant="panel" 
            active={value === opt.id} 
            onClick={() => onChange(opt.id)}
          >
            <div className={styles.colorCard}>
              <div 
                className={styles.swatch} 
                style={{ backgroundColor: opt.color }} 
              />
              <div className={styles.colorInfo}>
                <span className={styles.japaneseName}>{opt.sub}</span>
                <span className={styles.mainName}>{opt.label}</span>
              </div>
            </div>
          </GestureButton>
        ))}
      </div>
    </div>
  );
}
