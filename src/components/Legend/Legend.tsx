import clsx from 'clsx';
import type { FC } from 'react';
import { useMessages } from '../../hooks/useMessages';
import styles from './Legend.module.css';

const Legend: FC = () => {
  const messages = useMessages();

  return (
    <ul className={styles.legend} aria-label={messages.legendLabel}>
      <li>
        <span className={clsx(styles.swatch, styles.major)} aria-hidden="true" />
        {messages.legend.major}
      </li>
      <li>
        <span className={clsx(styles.swatch, styles.minor)} aria-hidden="true" />
        {messages.legend.minor}
      </li>
      <li>
        <span className={clsx(styles.swatch, styles.diminished)} aria-hidden="true" />
        {messages.legend.diminished}
      </li>
      <li>
        <span className={styles.star} aria-hidden="true">
          ★
        </span>
        {messages.legend.easy}
      </li>
    </ul>
  );
};

export default Legend;
