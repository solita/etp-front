import { writable } from 'svelte/store';
import * as R from 'ramda';
import * as Either from '@Utility/either-utils';

export const currentUserStore = writable();
export const errorStore = writable();
export const countryStore = writable(Either.Left('Not initialized'));
export const breadcrumbStore = writable([]);

const createFlashMessageStore = () => {
  const { subscribe, set, update } = writable([]);

  return {
    subscribe,
    add: R.curry((module, type, text) =>
      update(
        R.compose(R.uniq, R.append({ module, type, text, persist: false }))
      )
    ),
    addPersist: R.curry((module, type, text) =>
      update(R.compose(R.uniq, R.append({ module, type, text, persist: true })))
    ),
    remove: message => update(R.reject(R.equals(message))),
    flush: module =>
      update(
        R.compose(
          R.map(
            R.when(
              R.compose(R.equals(module), R.prop('module')),
              R.assoc('persist', false)
            )
          ),
          R.reject(
            R.allPass([
              R.compose(R.equals(module), R.prop('module')),
              R.compose(R.not, R.prop('persist'))
            ])
          )
        )
      )
  };
};

export const flashMessageStore = createFlashMessageStore();
