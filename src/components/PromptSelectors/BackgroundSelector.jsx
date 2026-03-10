import GestureButton from '../GestureButton/GestureButton';
import styles from './PromptSelectors.module.css';

export default function BackgroundSelector({ value, onChange }) {
  const options = [
    { id: 'style_studio', label: 'フォトスタジオ', icon: '🏛️' },
    { id: 'style_matsuri', label: '夏祭り', icon: '🏮' },
    { id: 'style_shrine', label: '神社・参道', icon: '⛩️' }
  ];

  return (
    <div className={styles.selectorContainer}>
      <span className={styles.settingLabel}>背景・シチュエーション</span>
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
