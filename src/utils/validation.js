import * as R from 'ramda';

export const ytunnusChecksum = R.compose(
  R.unless(R.equals(0), R.subtract(11)),
  R.modulo(R.__, 11),
  R.reduce(R.add, 0),
  R.zipWith(R.multiply, [7, 9, 10, 5, 8, 4, 2]),
  R.map(parseInt),
  R.slice(0, 7)
);

export const isValidYtunnus = R.allPass([
  R.test(/^\d{7}-\d$/),
  R.converge(R.equals, [ytunnusChecksum, R.compose(parseInt, R.nth(8))])
]);

export const isFilled = R.complement(R.isEmpty);

export const isUrl = R.test(
  /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
);

export const isPostinumero = R.test(/^\d{5}$/);

export const henkilotunnusChecksum = R.compose(
  R.nth(R.__, '0123456789abcdefhjklmnprstuvwxy'),
  R.modulo(R.__, 31),
  parseInt,
  R.join(''),
  R.filter(Number.isInteger),
  R.map(parseInt),
  R.slice(0, 10)
);

export const isValidHenkilotunnus = R.allPass([
  R.compose(
    R.test(
      /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])([5-9]\d\+|\d\d-|[01]\dA)\d{3}[\dA-Z]$/
    ),
    R.toUpper
  ),
  R.converge(R.equals, [
    henkilotunnusChecksum,
    R.compose(R.takeLast(1), R.toLower)
  ])
]);

export const isLaatijanToteaja = R.test(/^(FISE|KIINKO)$/);

export const isValidSahkoposti = R.test(
  /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/
);

export const isPuhelinnumero = R.test(
  /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/
);

export const isVaativuusluokka = R.test(/^(1|2)$/);

// TODO: improve to check invalid dates
export const isPaivamaara = R.test(/^\d{1,2}\.\d{1,2}.\d{4}$/);
