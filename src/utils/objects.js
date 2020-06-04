import * as R from 'ramda';

export const mapKeys = R.curry((fn, object) => R.compose(
  R.fromPairs,
  R.map(R.over(R.lensIndex(0), fn)),
  R.toPairs
)(object));