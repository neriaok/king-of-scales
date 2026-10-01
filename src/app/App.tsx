import type { FC } from 'react';
import { useDocumentLanguage } from '../hooks/useDocumentLanguage';
import { useMessages } from '../hooks/useMessages';
import styles from './App.module.css';

const App: FC = () => {
  useDocumentLanguage();
  const messages = useMessages();

  return (
    <main className={styles.app}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>{messages.appTitle}</h1>
      </div>
    </main>
  );
};

export default App;
