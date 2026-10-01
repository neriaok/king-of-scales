import { useEffect } from 'react';
import { LANGUAGE_DIR, MESSAGES } from '../i18n/messages';
import { selectLanguage } from '../features/ui/uiSlice';
import { useAppSelector } from './useAppDispatch';

/** Keeps <html lang dir> and the document title in sync with the chosen language. */
export const useDocumentLanguage = (): void => {
  const language = useAppSelector(selectLanguage);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = LANGUAGE_DIR[language];
    document.title = MESSAGES[language].appTitle;
  }, [language]);
};
