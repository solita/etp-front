import * as R from 'ramda';
import * as dfns from 'date-fns';

export const OPERATOR_TYPES = Object.freeze({
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  DATE: 'DATE',
  BOOLEAN: 'BOOLEAN'
});

const eq = {
  browserCommand: '=',
  serverCommand: '=',
  format: R.identity
};
const gt = {
  browserCommand: '>',
  serverCommand: '>',
  format: R.identity
};
const gte = {
  browserCommand: '>=',
  serverCommand: '>=',
  format: R.identity
};
const lt = {
  browserCommand: '<',
  serverCommand: '<',
  format: R.identity
};
const lte = {
  browserCommand: '<=',
  serverCommand: '<=',
  format: R.identity
};

const contains = {
  browserCommand: 'sisaltaa',
  serverCommand: 'like',
  format: arg => `%${arg}%`
};

const between = {
  browserCommand: 'valissa',
  serverCommand: 'between',
  format: R.identity
};

const singleNumberOperation = R.curry((operation, key) => ({
  operation,
  key,
  argumentNumber: 1,
  defaultValues: () => [0],
  type: OPERATOR_TYPES.NUMBER
}));

const numberEquals = singleNumberOperation(eq);

const numberGreaterThan = singleNumberOperation(gt);

const numberGreaterThanOrEqual = singleNumberOperation(gte);

const numberLessThan = singleNumberOperation(lt);

const numberLessThanOrEqual = singleNumberOperation(lte);

const stringContains = key => ({
  operation: contains,
  key,
  argumentNumber: 1,
  defaultValues: () => [''],
  type: OPERATOR_TYPES.STRING
});

const singleDateOperation = R.curry((dateGenerator, operation, key) => ({
  operation,
  key,
  argumentNumber: 1,
  defaultValues: () => [dateGenerator()],
  type: OPERATOR_TYPES.DATE
}));

const dateEquals = singleDateOperation(
  () => dfns.format(new Date(), 'd.M.yyyy'),
  eq
);

const dateGreaterThan = singleDateOperation(
  () => dfns.format(new Date(), 'd.M.yyyy'),
  gt
);

const dateGreaterThanOrEqual = singleDateOperation(
  () => dfns.format(new Date(), 'd.M.yyyy'),
  gte
);

const dateLessThan = singleDateOperation(
  () => dfns.format(new Date(), 'd.M.yyyy'),
  lt
);

const dateLessThanOrEqual = singleDateOperation(
  () => dfns.format(new Date(), 'd.M.yyyy'),
  lte
);

const numberComparisons = [
  numberEquals,
  numberGreaterThan,
  numberGreaterThanOrEqual,
  numberLessThan,
  numberLessThanOrEqual
];

const dateComparisons = [
  dateEquals,
  dateGreaterThan,
  dateGreaterThanOrEqual,
  dateLessThan,
  dateLessThanOrEqual
];

const schema = {
  id: R.map(R.applyTo('id'), numberComparisons),
  allekirjoitusaika: R.map(R.applyTo('allekirjoitusaika'), dateComparisons),
  'korvattu-energiatodistus-id': [stringContains('korvattu-energiatodistus-id')]
  // R.map(
  //   R.applyTo('korvattu-energiatodistus-id'),
  //   numberComparisons
  // )
};

export const laatijaSchema = R.pick(
  ['id', 'allekirjoitusaika', 'korvattu-energiatodistus-id'],
  schema
);
