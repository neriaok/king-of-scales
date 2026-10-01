import type { FC } from 'react';
import ChordConverter from '../ChordConverter';
import SequenceInput from '../SequenceInput';
import styles from './ProgressionPanel.module.css';

/** Choose the table's columns by typing degree numbers, or convert chords into numbers. */
const ProgressionPanel: FC = () => {
  return (
    <section className={styles.panel}>
      <div className={styles.card}>
        <SequenceInput />
      </div>
      <div className={styles.card}>
        <ChordConverter />
      </div>
    </section>
  );
};

export default ProgressionPanel;
