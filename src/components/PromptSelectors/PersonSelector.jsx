// components/PromptSelectors/PersonSelector.jsx
import GestureButton from '../GestureButton/GestureButton';
import styles from './PromptSelectors.module.css';

export default function PersonSelector({ value, onChange }) {
  const options = [
    { id: 'woman', label: 'Woman', icon: '👘' },
    { id: 'man', label: 'Man', icon: '🥋' },
    { id: 'child', label: 'Child', icon: '🍡' }
  ];

  return (
    <div className={styles.selectorContainer}>
      <span className={styles.settingLabel}>Model</span>
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
