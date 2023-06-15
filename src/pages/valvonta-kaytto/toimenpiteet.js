import * as R from 'ramda';
import * as Deep from '@Utility/deep-objects';
import * as Maybe from '@Utility/maybe-utils';
import * as dfns from 'date-fns';
import * as Either from '@Utility/either-utils';

export const type = {
  case: 0,
  rfi: {
    // tietopyyntö
    request: 1,
    order: 2,
    warning: 3
  },
  decision: {
    // päätökset
    order: 4 // käskypäätös
  },
  closed: 5,
  'decision-order': {
    'hearing-letter': 7
  }
};

const types = R.invertObj(Deep.treeFlat('-', R.F, type));

export const typeKey = id => types[id];

export const isType = R.propEq('type-id');

const isDeadlineType = R.includes(R.__, [1, 2, 3, 4, 7]);
export const hasDeadline = R.propSatisfies(isDeadlineType, 'type-id');

export const isCloseCase = isType(type.closed);
export const isAuditCase = R.complement(isType(type.closed));
export const isAuditCaseToimenpideType = R.propSatisfies(
  R.includes(R.__, R.range(1, 22)),
  'id'
);

const defaultDeadlineForTypeId = typeId => {
  switch (typeId) {
    case 7:
      return Maybe.Some(dfns.addWeeks(new Date(), 2));
    default:
      return Maybe.Some(dfns.addMonths(new Date(), 1));
  }
};

export const defaultDeadline = typeId =>
  isDeadlineType(typeId) ? defaultDeadlineForTypeId(typeId) : Maybe.None();

export const i18nKey = (toimenpide, key) =>
  R.join('.', [
    'valvonta.kaytto.toimenpide',
    typeKey(toimenpide['type-id']),
    key
  ]);

const defaultTemplateId = (typeId, templatesByType) => {
  const templates = R.defaultTo([], templatesByType[typeId]);
  return R.length(templates) === 1
    ? Maybe.Some(R.head(templates).id)
    : Maybe.None();
};

export const emptyToimenpide = (typeId, templatesByType) => {
  const toimenpide = {
    'type-id': typeId,
    'publish-time': Maybe.None(),
    'deadline-date': Either.Right(defaultDeadline(typeId)),
    'template-id': defaultTemplateId(typeId, templatesByType),
    description: Maybe.None()
  };

  switch (typeId) {
    case 7:
      return R.assoc('fine', Maybe.Some(800), toimenpide);

    default:
      return toimenpide;
  }
};

export const isDraft = R.compose(Maybe.isNone, R.prop('publish-time'));

export const hasTemplate = R.compose(Maybe.isSome, R.prop('template-id'));

export const templates = templatesByType =>
  R.compose(R.defaultTo([]), R.prop(R.__, templatesByType), R.prop('type-id'));

export const time = R.converge(Maybe.orSome, [
  R.prop('create-time'),
  R.prop('publish-time')
]);

export const sendTiedoksi = isType(type.rfi.request);

/**
 *
 * Takes an array of toimenpidetype IDs and a toimenpide object
 * and checks if its type id is in the array
 * @param {number[]} toimenPideTypeIds
 * @param {Object} toimenpide
 * @returns {boolean} is toimenpidetype of the given toimenpide one in the array
 */
export const isToimenpideOfGivenTypes = R.curry(
  (toimenpideTypeIds, toimenpide) =>
    R.compose(
      R.includes(R.__, toimenpideTypeIds),
      R.prop('type-id')
    )(toimenpide)
);

/**
 * Given a key, return a function that takes an array of objects
 * and returns an array of ids of objects where the given key has value true
 * @param {string} key
 * @return {Function}
 */
const findIdsOfObjectsWhereGivenKeyHasValueTrue = key =>
  R.compose(R.map(R.prop('id')), R.filter(R.propEq(key, true)));

/**
 * Given an array of toimenpidetype objects of form {id: Number, 'manually-deliverable: Boolean},
 * return an array of toimenpidetype IDs of the manually deliverable toimenpidetypes
 * @param {Object[]} toimenpideTypes
 * @returns {number[]} Toimenpide type IDs of manuallly deliverable types
 */
export const manuallyDeliverableToimenpideTypes =
  findIdsOfObjectsWhereGivenKeyHasValueTrue('manually-deliverable');

/**
 * Given an array of toimenpidetype objects of form {id: Number, 'allow-comments: Boolean},
 * return an array of toimenpidetype IDs of the toimenpidetypes that allow comments
 * @param {Object[]} toimenpideTypes
 * @returns {number[]} Toimenpide type IDs of types that allow comments
 */
export const toimenpideTypesThatAllowComments =
  findIdsOfObjectsWhereGivenKeyHasValueTrue('allow-comments');

export const hasFine = toimenpide => R.has('fine', toimenpide);
