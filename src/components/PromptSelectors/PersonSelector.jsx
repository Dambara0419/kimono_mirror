// components/PromptSelectors/PersonSelector.jsx
import GestureButton from '../GestureButton/GestureButton';
import styles from './PromptSelectors.module.css';

export default function PersonSelector({ value, onChange }) {
  const options = [
    { id: 'woman', label: '女性', icon: '👘' },
    { id: 'man', label: '男性', icon: '🥋' },
    { id: 'child', label: '子供', icon: '🍡' }
  ];

  return (
    <div className={styles.selectorContainer}>
      <span className={styles.settingLabel}>モデル選択</span>
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
