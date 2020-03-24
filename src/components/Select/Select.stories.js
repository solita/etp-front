import * as R from 'ramda';
import Select from './Select';

export default { title: 'Select' };

export const withItems = () => ({
  Component: Select,
  props: {
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
    model: { selected: null },
    lens: R.lensProp('selected'),
    format: R.identity,
    parse: R.identity
  }
});

export const withSelected = () => ({
  Component: Select,
  props: {
    items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 0],
    model: { selected: 1 },
    lens: R.lensProp('selected'),
    format: R.identity,
    parse: R.identity
  }
});

export const withObjects = () => ({
  Component: Select,
  props: {
    items: [
      { id: 1, label: 'yksi' },
      { id: 2, label: 'kaksi' },
      { id: 3, label: 'kolme' },
      { id: 4, label: 'neljä' },
      { id: 5, label: 'viisi' }
    ],
    model: { selected: null },
    lens: R.lensProp('selected'),
    format: R.prop('label'),
    parse: R.identity
  }
});
