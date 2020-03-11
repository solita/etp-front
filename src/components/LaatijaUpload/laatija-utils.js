import * as R from 'ramda';
import * as validation from '@Utility/validation';

export const dataFields = [
  'toteaja',
  'etunimi',
  'sukunimi',
  'henkilotunnus',
  'osoite',
  'postinumero',
  'postitoimipaikka',
  'sahkopostiosoite',
  'puhelinnumero',
  'vaativuusluokka',
  'toteamispaivamaara'
];

export const parse = {
  toteaja: R.trim,
  etunimi: R.trim,
  sukunimi: R.trim,
  henkilotunnus: R.trim,
  osoite: R.trim,
  postinumero: R.trim,
  postitoimipaikka: R.trim,
  sahkopostiosoite: R.trim,
  puhelinnumero: R.trim,
  vaativuusluokka: R.trim,
  toteamispaivamaara: R.trim
};

export const validate = {
  toteaja: validation.isLaatijanToteaja,
  etunimi: validation.isFilled,
  sukunimi: validation.isFilled,
  henkilotunnus: validation.isValidHenkilotunnus,
  osoite: validation.isFilled,
  postinumero: validation.isPostinumero,
  postitoimipaikka: validation.isFilled,
  sahkopostiosoite: validation.isValidSahkoposti,
  puhelinnumero: validation.isPuhelinnumero,
  vaativuusluokka: validation.isVaativuusluokka,
  toteamispaivamaara: validation.isPaivamaara
};

export const readRow = R.ifElse(
  R.compose(R.equals(R.length(dataFields)), R.length, R.split(';')),
  R.compose(R.zipObj(dataFields), R.split(';')),
  R.always(null)
);

export const readData = R.when(
  R.compose(R.equals('String'), R.type),
  R.compose(
    R.filter(R.complement(R.isNil)),
    R.map(readRow),
    R.split(/\r?\n/g),
    R.trim
  )
);

export const rowValid = R.compose(
  R.reduce(R.and, true),
  R.values,
  R.evolve(validate),
  R.evolve(parse)
);

export const dataValid = R.ifElse(
  R.allPass([R.complement(R.isEmpty), R.compose(R.equals('Array'), R.type)]),
  R.compose(R.reduce(R.and, true), R.map(rowValid)),
  R.always(false)
);
