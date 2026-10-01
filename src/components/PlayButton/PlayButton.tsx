import type { FC } from 'react';
import styles from './PlayButton.module.css';

interface PlayButtonProps {
  label: string;
  onPlay: () => void;
}

/** Starts audio from a real click, which is what browsers require before playing sound. */
const PlayButton: FC<PlayButtonProps> = ({ label, onPlay }) => {
  return (
    <button type="button" className={styles.play} onClick={onPlay}>
      {label}
    </button>
  );
};

export default PlayButton;
