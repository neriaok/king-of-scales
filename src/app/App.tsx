import type { FC } from 'react';
import ChordPopover from '../components/ChordPopover';
import ChordTable from '../components/ChordTable';
import Header from '../components/Header';
import Legend from '../components/Legend';
import SequenceInput from '../components/SequenceInput';
import { useDocumentLanguage } from '../hooks/useDocumentLanguage';
import styles from './App.module.css';

const App: FC = () => {
  useDocumentLanguage();

  return (
    <div className={styles.app}>
      <div className={styles.wrap}>
        <Header />
        <main className={styles.main}>
          <SequenceInput />
          <ChordTable />
          <Legend />
        </main>
      </div>
      <ChordPopover />
    </div>
  );
};

export default App;
