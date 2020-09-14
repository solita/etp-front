import * as laatimisvaiheet from '@Component/Energiatodistus/laatimisvaiheet';
import * as kielisyys from '@Component/Energiatodistus/kielisyys';
import * as R from 'ramda';
import * as Maybe from '@Utility/maybe-utils';
import * as Either from '@Utility/either-utils';

export const isIlmanvaihtoKuvausRequired = R.compose(
  Maybe.exists(R.equals(6)),
  R.path(['lahtotiedot', 'ilmanvaihto', 'tyyppi-id']));

export const isLammitysmuoto1KuvausRequired = R.compose(
  Maybe.exists(R.equals(9)),
  R.path(['lahtotiedot', 'lammitys', 'lammitysmuoto-1', 'id']));

export const isLammitysmuoto2KuvausRequired = R.compose(
  Maybe.exists(R.equals(9)),
  R.path(['lahtotiedot', 'lammitys', 'lammitysmuoto-2', 'id']));

export const isLammonjakoKuvausRequired = R.compose(
  Maybe.exists(R.equals(12)),
  R.path(['lahtotiedot', 'lammitys', 'lammonjako', 'id']));

const requiredCondition = {
  "perustiedot.havainnointikaynti": laatimisvaiheet.isOlemassaOlevaRakennus,
  "perustiedot.rakennustunnus": R.complement(laatimisvaiheet.isRakennuslupa),
  "perustiedot.keskeiset-suositukset-fi": laatimisvaiheet.isOlemassaOlevaRakennus,
  "perustiedot.keskeiset-suositukset-sv": laatimisvaiheet.isOlemassaOlevaRakennus,

  "lahtotiedot.ilmanvaihto.kuvaus-fi": isIlmanvaihtoKuvausRequired,
  "lahtotiedot.ilmanvaihto.kuvaus-sv": isIlmanvaihtoKuvausRequired,

  "lahtotiedot.lammitys.lammitysmuoto-1.kuvaus-fi": isLammitysmuoto1KuvausRequired,
  "lahtotiedot.lammitys.lammitysmuoto-1.kuvaus-sv": isLammitysmuoto1KuvausRequired,

  "lahtotiedot.lammitys.lammitysmuoto-2.kuvaus-fi": isLammitysmuoto2KuvausRequired,
  "lahtotiedot.lammitys.lammitysmuoto-2.kuvaus-sv": isLammitysmuoto2KuvausRequired,

  "lahtotiedot.lammitys.lammonjako.kuvaus-fi": isLammonjakoKuvausRequired,
  "lahtotiedot.lammitys.lammonjako.kuvaus-sv": isLammonjakoKuvausRequired
};

const predicate = R.compose(
  R.ifElse(R.isEmpty, R.always(R.T), R.allPass),
  R.filter(R.complement(R.isNil)),
  R.juxt([
    R.prop(R.__, requiredCondition),
    property => R.endsWith("-fi", property) ? kielisyys.fi : null,
    property => R.endsWith("-sv", property) ? kielisyys.sv : null,
    property => R.endsWith(".U", property) || R.endsWith(".g-ks", property) ?
      R.pathSatisfies(
        R.compose(
          Either.orSome(false),
          R.map(R.lt(0)),
          R.chain(Maybe.toEither(false)),
          Either.fromValueOrEither),
        R.update(-1, 'ala', R.split('.', property))) : null
]));

const requiredConstraints = R.map(R.juxt([predicate, R.identity]));

const assertValue = R.curry((property, value) => {
  if (R.isNil(value) || !Maybe.isMaybe(value)) {
    throw "Required property: " + property +
      " value: " + value +
      " must be in monad Maybe[A] or Either[Maybe[A]].";
  }
});

const isValueMissing = (property, energiatodistus) => R.compose(
  Maybe.isNone,
  R.tap(assertValue(property)),
  R.when(Either.isEither, Either.orSome(Maybe.None())),
  R.path(R.__, energiatodistus),
  R.split('.')
)(property);

export const missingProperties = (requiredProperties, energiatodistus) =>
  R.compose(
    R.map(R.nth(1)),
    R.filter(([predicate, property]) =>
      isValueMissing(property, energiatodistus) &&
      predicate(energiatodistus))
  )(requiredConstraints(requiredProperties))