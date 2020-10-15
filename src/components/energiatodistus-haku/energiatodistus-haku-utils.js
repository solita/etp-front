import * as R from 'ramda';
import * as Maybe from '@Utility/maybe-utils';
import * as parsers from '@Utility/parsers';
import * as Either from '@Utility/either-utils';

export const OPERATOR_TYPES = Object.freeze({
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  DATESINGLE: 'DATESINGLE',
  BOOLEAN: 'BOOLEAN'
});

const gt = {
  operation: '>',
  command: R.curry((first, second) => ['>', first, second])
};
const gte = {
  operation: '>=',
  command: R.curry((first, second) => ['>=', first, second])
};
const lt = {
  operation: '<',
  command: R.curry((first, second) => ['<', first, second])
};
const lte = {
  operation: '<=',
  command: R.curry((first, second) => ['<=', first, second])
};
const eq = {
  operation: '=',
  command: R.curry((first, second) => ['=', first, second])
};

const contains = {
  operation: 'sisaltaa',
  command: R.curry((first, second) => ['like', first, `%${second}%`])
};

const allComparisons = [eq, gt, gte, lt, lte];

const operations = [...allComparisons, contains];

const kriteeri = (key, operators, defaultOperator, defaultValues, type) => ({
  key,
  operators: R.map(R.over(R.lensProp('command'), R.applyTo(key)), operators),
  defaultOperator: R.over(
    R.lensProp('command'),
    R.applyTo(key),
    defaultOperator
  ),
  defaultValues,
  type
});

const korvattuEnergiatodistusIdKriteeri = kriteeri(
  'korvattu-energiatodistus-id',
  allComparisons,
  eq,
  [''],
  OPERATOR_TYPES.STRING
);

export const idKriteeri = kriteeri(
  'id',
  allComparisons,
  eq,
  [''],
  OPERATOR_TYPES.NUMBER
);

const allekirjoitusaikaKriteeri = kriteeri(
  'allekirjoitusaika',
  allComparisons,
  eq,
  [''],
  OPERATOR_TYPES.DATESINGLE
);

// const viimeinenvoimassaoloKriteeri = kriteeri('viimeinenvoimassaolo', []);

export const perustiedot = () => ({
  nimi: kriteeri(
    'perustiedot.nimi',
    [eq, contains],
    eq,
    '',
    OPERATOR_TYPES.STRING
  ),
  rakennustunnus: kriteeri(
    'perustiedot.rakennustunnus',
    allComparisons,
    eq,
    [''],
    OPERATOR_TYPES.STRING
  ),
  kiinteistotunnus: kriteeri(
    'perustiedot.kiinteistotunnus',
    allComparisons,
    eq,
    [''],
    OPERATOR_TYPES.STRING
  ),
  // 'katuosoite-fi': kriteeri('perustiedot.katuosoite-fi', []),
  // 'katuosoite-sv': kriteeri('perustiedot.katuosoite-sv', []),
  postinumero: kriteeri(
    'perustiedot.postinumero',
    allComparisons,
    eq,
    [''],
    OPERATOR_TYPES.STRING
  ),
  'julkinen-rakennus': kriteeri(
    'perustiedot.julkinen-rakennus',
    [eq],
    eq,
    'true',
    OPERATOR_TYPES.BOOLEAN
  ),
  uudisrakennus: kriteeri(
    'perustiedot.uudisrakennus',
    [eq],
    eq,
    [''],
    OPERATOR_TYPES.STRING
  )
  // laatimisvaihe: kriteeri('perustiedot.laatimisvaihe', []),
  // havainnointikaynti: kriteeri('perustiedot.havainnointikaynti', []),
  // valmistumisvuosi: kriteeri('perustiedot.valmistumisvuosi', []),
  // rakennusluokka: kriteeri('rakennusluokka', []),
  // 'rakennuksen-kayttotarkoitusluokka': kriteeri(
  //   'rakennuksen-kayttotarkoitusluokka',
  //   []
  // )
});

export const defaultKriteeriQueryItem = () => ({
  conjunction: Maybe.None(),
  block: ['=', 'id', 0]
});

export const defaultWhere = () => [[['=', 'id', 0]]];

export const laatijaKriteerit = () => [
  idKriteeri,
  allekirjoitusaikaKriteeri,
  ...R.values(perustiedot())
];

export const findOperation = operation =>
  R.compose(
    Maybe.fromNull,
    R.find(R.compose(R.equals(operation), R.prop('operation')))
  )(operations);

export const blockToQueryParameter = ([operation, key, ...values]) =>
  R.compose(
    R.map(op => R.apply(op.command, [key, ...values])),
    findOperation
  )(operation);

export const convertWhereToQuery = R.compose(
  R.filter(R.length),
  R.map(
    R.compose(
      R.map(Maybe.get),
      R.filter(Maybe.isSome),
      R.map(blockToQueryParameter)
    )
  )
);

export const deserializeConjuntionBlockPair = ([conjunction, block]) => ({
  conjunction,
  block
});

export const deserializeAndBlocks = R.converge(R.concat, [
  R.compose(Array.of, R.pair(Maybe.Some('or')), R.head),
  R.compose(R.map(R.pair(Maybe.Some('and'))), R.tail)
]);

export const deserializeWhere = R.compose(
  R.map(deserializeConjuntionBlockPair),
  R.set(R.compose(R.lensIndex(0), R.lensIndex(0)), Maybe.None()),
  R.unnest,
  R.map(deserializeAndBlocks)
);

export const serializeWhere = R.reduce(
  (acc, { conjunction, block }) => {
    if (Maybe.exists(R.equals('or'), conjunction)) {
      return R.append([block], acc);
    }

    const lastLens = R.lensIndex(R.length(acc) - 1);

    return R.over(lastLens, R.append(block), acc);
  },
  [[]]
);

export const removeQueryItem = R.curry((index, queryItems) =>
  R.compose(
    R.set(R.compose(R.lensIndex(0), R.lensProp('conjunction')), Maybe.None()),
    R.remove(index, 1)
  )(queryItems)
);

export const appendDefaultQueryItem = R.append(
  R.assoc('conjunction', Maybe.Some('and'), defaultKriteeriQueryItem())
);

export const findFromKriteeritByKey = R.curry((kriteerit, key) =>
  R.compose(Maybe.fromNull, R.find(R.propEq('key', key)))(kriteerit)
);

export const operationFromBlock = R.curry((operations, block) =>
  R.compose(
    Maybe.orSome(R.head(operations)),
    Maybe.fromNull,
    R.find(R.pathEq(['operation', 'browserCommand'], R.head(block)))
  )(operations)
);

export const blockFromOperation = R.curry((op, values) => [
  op.operation.browserCommand,
  op.key,
  ...values
]);

export const valuesFromBlock = R.curry((operation, block) => {
  const values = R.drop(2, block);
  const defaultValues = R.drop(R.length(values), operation.defaultValues);

  return R.concat(values, defaultValues);
});

export const parseValueByType = R.curry((type, value) => {
  console.log(value);
  switch (type) {
    case OPERATOR_TYPES.NUMBER:
      return parsers.parseNumber(value);
    case OPERATOR_TYPES.BOOLEAN:
      return Either.Right(value === 'true');
    default:
      return Either.Right(value);
  }
});

export const formObject = form => {
  const fd = new FormData(form);
  const ds = {};
  fd.forEach((value, key) => (ds[key] = value));
  return ds;
};

export const groupHakuForm = R.compose(
  R.map(R.map(R.tail)),
  R.values,
  R.groupBy(R.head),
  R.map(R.compose(R.flatten, R.over(R.lensIndex(0), R.split('_')))),
  R.toPairs
);

export const findValueByMatchingHead = R.curry((value, arr) =>
  R.compose(
    R.map(R.last),
    Maybe.fromNull,
    R.find(R.compose(R.equals(value), R.head))
  )(arr)
);

export const hakuCriteriaFromGroupedInput = inputs => {
  const type = Maybe.orSome('', findValueByMatchingHead('type', inputs));
  const conjunction = findValueByMatchingHead('conjunction', inputs);
  const key = findValueByMatchingHead('key', inputs);
  const operation = findValueByMatchingHead('operation', inputs);
  const values = R.compose(
    R.map(R.compose(parseValueByType(type), R.last)),
    R.sortBy(R.nth(1)),
    R.filter(R.compose(R.equals('value'), R.head))
  )(inputs);

  return {
    conjunction: Maybe.orSome('and', conjunction),
    block: R.all(Either.isRight)
      ? [Maybe.get(operation), Maybe.get(key), ...R.map(Either.right, values)]
      : []
  };
};

export const parseHakuForm = form => {
  const formdata = formObject(form);
  const groupedInputs = groupHakuForm(formdata);

  const searchItems = R.map(hakuCriteriaFromGroupedInput, groupedInputs);

  return searchItems;
};

export const searchString = searchItems =>
  JSON.stringify(
    R.reduce(
      (acc, item) => {
        if (item.length === 0) return acc;
        if (item.conjunction === 'and') {
          return R.over(R.lensIndex(acc.length - 1), R.append(item.block), acc);
        }

        return R.append([item.block], acc);
      },
      [[]],
      searchItems
    )
  );
