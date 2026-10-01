import type { FC } from 'react';
import styles from './App.module.css';

const App: FC = () => {
  return (
    <main className={styles.app}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>מלך הסולמות</h1>
      </div>
    </main>
  );
};

export default App;
