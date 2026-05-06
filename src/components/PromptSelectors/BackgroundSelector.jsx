import GestureButton from '../GestureButton/GestureButton';
import styles from './PromptSelectors.module.css';

export default function BackgroundSelector({ value, onChange }) {
  const options = [
    { id: 'style_studio', label: 'Studio', icon: '🏛️' },
    { id: 'style_matsuri', label: 'Festival', icon: '🏮' },
    { id: 'style_shrine', label: 'Shrine', icon: '⛩️' }
  ];

  return (
    <div className={styles.selectorContainer}>
      <span className={styles.settingLabel}>Background</span>
      <div className={styles.chipGroup}>
        {options.map(opt => (
          <GestureButton 
            key={opt.id}
            variant="panel" 
            active={value === opt.id} 
            onClick={() => onChange(opt.id)}
          >
            <div className={styles.personOption}>
              <span className={styles.personIcon}>{opt.icon}</span>
              <span className={styles.personLabel}>{opt.label}</span>
            </div>
          </GestureButton>
        ))}
      </div>
    </div>
  );
}
