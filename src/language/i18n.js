import {
  init,
  locale,
  _,
  locales,
  addMessages,
  getLocaleFromNavigator
} from 'svelte-i18n';

import fi from './fi.json';
import sv from './sv.json';

const setupI18n = () => {
  addMessages('fi-FI', fi);
  addMessages('fi', fi);
  addMessages('sv-FI', sv);
  addMessages('sv', sv);

  init({
    fallbackLocale: 'fi-FI',
    initialLocale: localStorage.getItem('locale') || getLocaleFromNavigator()
  });
};

/**
 * @global
 * @name Translate
 * @sig String -> String
 *
 * @description Translates the given string according to locale
 */

/**
 * @global
 * @name Locale
 * @sig () -> String
 *
 * @description Returns the current locale
 */

export { setupI18n, _, locale, locales };
