import GestureButton from '../GestureButton/GestureButton';
import styles from './ObiColorSelector.module.css';

export default function ObiColorSelector({ value, onChange }) {
  const options = [
    { id: 'white', label: 'White', sub: 'Shiro', color: '#fff' },
    { id: 'red', label: 'Red', sub: 'Hiiro', color: '#b33e5c' },
    { id: 'blue', label: 'Blue', sub: 'Ruri', color: '#1e50a2' },
    { id: 'yellow', label: 'Yellow', sub: 'Kogane', color: '#d4af37' },
    { id: 'black', label: 'Black', sub: 'Sumiiro', color: '#2b2b2b' }
  ];

  return (
    <div className={styles.container}>
      <span className={styles.label}>Obi Color</span>
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
