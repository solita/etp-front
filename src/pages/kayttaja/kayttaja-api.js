import * as R from 'ramda';

import * as Future from '@Utility/future-utils';
import * as Fetch from '@Utility/fetch-utils';
import * as Maybe from '@Utility/maybe-utils';
import * as Either from '@Utility/either-utils';
import * as Kayttajat from '@Utility/kayttajat';
import * as Parsers from '@Utility/parsers';

const parseValidISODate = R.compose(
  R.chain(Either.toMaybe),
  R.map(Parsers.parseISODate),
  Maybe.fromNull
);

export const deserialize = R.compose(
  R.assoc('api-key', Maybe.None()),
  R.evolve({
    login: parseValidISODate,
    verifytime: parseValidISODate,
    cognitoid: Maybe.fromNull,
    henkilotunnus: Maybe.fromNull,
    virtu: Maybe.fromNull
  })
);

export const deserializeHistory = R.evolve({
  cognitoid: Maybe.fromNull,
  henkilotunnus: Maybe.fromNull,
  virtu: Maybe.fromNull,
  maa: Either.Right,
  toimintaalue: Maybe.fromNull,
  wwwosoite: Maybe.fromNull,
  toteamispaivamaara: R.compose(Either.right, Parsers.parseISODate),
  modifytime: R.compose(Either.right, Parsers.parseISODate)
});

export const deserializeLaatija = R.evolve({
  'vastaanottajan-tarkenne': Maybe.fromNull,
  maa: Either.Right,
  toimintaalue: Maybe.fromNull,
  wwwosoite: Maybe.fromNull,

  // we assume that these dates are always valid from backend
  toteamispaivamaara: R.compose(Either.right, Parsers.parseISODate),
  'voimassaolo-paattymisaika': R.compose(Either.right, Parsers.parseISODate)
});

export const url = {
  all: 'api/private/kayttajat',
  id: id => `${url.all}/${id}`,
  history: id => `${url.id(id)}/history`,
  laatija: id => `${url.id(id)}/laatija`,
  aineistot: 'api/private/aineistot',
  kayttajaAineistot: id => `${url.id(id)}/aineistot`,
  whoami: '/api/private/whoami'
};

export const whoami = Future.cache(
  R.map(deserialize, Fetch.getJson(fetch, url.whoami))
);

export const getKayttajaHistory = R.compose(
  R.map(R.map(deserializeHistory)),
  Fetch.responseAsJson,
  Future.encaseP(Fetch.getFetch(fetch)),
  url.history
);

export const getKayttajaById = R.compose(
  R.map(deserialize),
  Fetch.responseAsJson,
  Future.encaseP(Fetch.getFetch(fetch)),
  url.id
);

export const kayttajat = R.map(
  R.map(deserialize),
  Fetch.getJson(fetch, url.all)
);

export const getLaatijaById = R.curry((fetch, id) =>
  R.compose(
    R.map(deserializeLaatija),
    Fetch.responseAsJson,
    Future.encaseP(Fetch.getFetch(fetch)),
    url.laatija
  )(id)
);

const deserializeKayttajaAineisto = R.evolve({
  'valid-until': R.compose(Either.right, Parsers.parseISODate)
});

export const getAineistotByKayttajaId = R.curry((fetch, id) =>
  R.compose(
    R.map(R.map(deserializeKayttajaAineisto)),
    Fetch.responseAsJson,
    Future.encaseP(Fetch.getFetch(fetch)),
    url.kayttajaAineistot
  )(id)
);

export const getAineistot = fetch =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.getFetch(fetch))
  )(url.aineistot);

export const serialize = R.compose(
  R.evolve({
    henkilotunnus: Maybe.orSome(null),
    virtu: Maybe.orSome(null),
    'api-key': Maybe.orSome(null)
  }),
  R.omit(['id', 'login', 'cognitoid', 'verifytime'])
);

export const serializeForNonAdmin = R.compose(
  R.omit(['rooli', 'passivoitu', 'valvoja', 'henkilotunnus', 'virtu']),
  serialize
);

export const putKayttajaById = R.curry((rooli, fetch, id, kayttaja) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'put', url.id(id))),
    R.ifElse(
      Kayttajat.isPaakayttajaRole,
      R.always(serialize),
      R.always(serializeForNonAdmin)
    )(rooli)
  )(kayttaja)
);

export const postKayttaja = R.compose(
  Fetch.responseAsJson,
  Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.all)),
  serialize
);

export const roolit = Fetch.cached(fetch, '/roolit');
export const aineistot = Fetch.cached(fetch, '/aineistot');
