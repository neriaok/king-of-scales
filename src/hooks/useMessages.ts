import type { Messages } from '../i18n/messages';
import { MESSAGES } from '../i18n/messages';
import { selectLanguage } from '../features/ui/uiSlice';
import { useAppSelector } from './useAppDispatch';

/** The UI strings for the current language. */
export const useMessages = (): Messages => MESSAGES[useAppSelector(selectLanguage)];
