import type { FC } from 'react';
import ChordPopover from '../components/ChordPopover';
import ChordTable from '../components/ChordTable';
import DegreePicker from '../components/DegreePicker';
import Header from '../components/Header';
import Legend from '../components/Legend';
import { useDocumentLanguage } from '../hooks/useDocumentLanguage';
import { useOpenFirstChordOnLoad } from '../hooks/useOpenFirstChordOnLoad';
import styles from './App.module.css';

const App: FC = () => {
  useDocumentLanguage();
  useOpenFirstChordOnLoad();

  return (
    <div className={styles.app}>
      <div className={styles.wrap}>
        <Header />
        <main className={styles.main}>
          <DegreePicker />
          <ChordTable />
          <Legend />
        </main>
      </div>
      <ChordPopover />
    </div>
  );
};

export default App;
