import type { FC } from 'react';
import type { Instrument } from '../../features/ui/uiSlice';
import {
  isInstrument,
  selectInstrument,
  selectLanguage,
  setInstrument,
  setLanguage,
} from '../../features/ui/uiSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { useMessages } from '../../hooks/useMessages';
import { LANGUAGES, LANGUAGE_NAMES, isLanguage } from '../../i18n/messages';
import SegmentedControl from '../SegmentedControl';
import styles from './Header.module.css';

const INSTRUMENT_ORDER: readonly Instrument[] = ['guitar', 'piano'];

const Header: FC = () => {
  const dispatch = useAppDispatch();
  const messages = useMessages();
  const instrument = useAppSelector(selectInstrument);
  const language = useAppSelector(selectLanguage);

  const handleInstrumentChange = (value: string) => {
    if (isInstrument(value)) dispatch(setInstrument(value));
  };

  const handleLanguageChange = (value: string) => {
    if (isLanguage(value)) dispatch(setLanguage(value));
  };

  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 className={styles.title}>{messages.appTitle}</h1>
        <p className={styles.subtitle}>{messages.subtitle}</p>
      </div>
      <div className={styles.controls}>
        <SegmentedControl
          label={messages.instrumentLabel}
          options={INSTRUMENT_ORDER.map((value) => ({
            value,
            label: messages.instruments[value],
          }))}
          value={instrument}
          onChange={handleInstrumentChange}
        />
        <SegmentedControl
          label={messages.languageLabel}
          options={LANGUAGES.map((value) => ({ value, label: LANGUAGE_NAMES[value] }))}
          value={language}
          onChange={handleLanguageChange}
          size="sm"
        />
      </div>
    </header>
  );
};

export default Header;
