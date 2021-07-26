import * as R from 'ramda';
import * as Objects from '@Utility/objects';
import * as Fetch from '@Utility/fetch-utils';
import * as Future from '@Utility/future-utils';
import * as Maybe from '@Utility/maybe-utils';
import * as Parsers from '@Utility/parsers';
import * as EM from '@Utility/either-maybe';
import * as Query from '@Utility/query';
import * as dfns from 'date-fns';

import * as Toimenpiteet from './toimenpiteet';
import * as EtApi from '@Component/Energiatodistus/energiatodistus-api';

import * as EtApi from '@Pages/energiatodistus/energiatodistus-api';

export const url = {
  valvonnat: 'api/private/valvonta/kaytto',
  valvonta: id => `${url.valvonnat}/${id}`,
  henkilot: kohdeId => `${url.valvonta(kohdeId)}/henkilot`,
  henkilo: (id, kohdeId) => `${url.henkilot(kohdeId)}/${id}`,
  toimenpiteet: id => `${url.valvonta(id)}/toimenpiteet`,
  preview: id => `${url.valvonta(id)}/toimenpiteet/preview`,
  toimenpide: (id, toimenpideId) => `${url.toimenpiteet(id)}/${toimenpideId}`,
  document: (id, toimenpideId, filename) =>
    `${url.toimenpide(id, toimenpideId)}/document/${filename}`,
  liitteet: id => `${url.valvonta(id)}/liitteet`,
  notes: id => `${url.valvonta(id)}/notes`
};

export const deserializeToimenpide = R.evolve({
  'create-time': dfns.parseJSON,
  'publish-time': R.compose(R.map(dfns.parseJSON), Maybe.fromNull),
  'deadline-date': R.compose(
    Parsers.toEitherMaybe,
    R.map(Parsers.parseISODate),
    Maybe.fromNull
  ),
  diaarinumero: Maybe.fromNull,
  description: Maybe.fromNull,
  'template-id': Maybe.fromNull
});

export const deserializeValvontaStatus = R.compose(
  R.evolve({
    lastToimenpide: R.compose(R.map(deserializeToimenpide), Maybe.fromNull)
  }),
  Objects.renameKeys({ 'last-toimenpide': 'lastToimenpide' })
);

export const deserializeValvonta = R.evolve({
  'valvoja-id': Maybe.fromNull
});

export const serializeValvonta = R.omit(['id']);

export const serializeToimenpide = R.compose(
  R.evolve({
    'template-id': Maybe.orSome(null),
    'severity-id': Maybe.orSome(null),
    description: Maybe.orSome(null),
    'deadline-date': EM.fold(null, date =>
      dfns.formatISO(date, { representation: 'date' })
    )
  }),
  R.pick(['type-id', 'deadline-date', 'description', 'template-id'])
);

export const serializeKaytto = R.compose(
  R.evolve({
    'valvoja-id': Maybe.orSome(null),
    'ilmoituspaikka-id': Maybe.orSome(null),
    havaintopaiva: EM.fold(null, date =>
      dfns.formatISO(date, { representation: 'date' })
    )
  })
);
export const deserializeKaytto = R.evolve({
  'ilmoituspaikka-id': Maybe.fromNull,
  'valvoja-id': Maybe.fromNull,
  havaintopaiva: R.compose(
    Parsers.toEitherMaybe,
    R.map(Parsers.parseISODate),
    Maybe.fromNull
  )
});

export const serializeHenkilo = R.compose(
  R.evolve({
    'rooli-id': Maybe.orSome(null),
    maa: Maybe.orSome(null),
    'toimitustapa-id': Maybe.orSome(null)
  })
);
export const deserializeHenkilo = R.evolve({
  'rooli-id': Maybe.fromNull,
  maa: Maybe.fromNull,
  'toimitustapa-id': Maybe.fromNull
});

export const getKaytto = R.compose(
  R.map(deserializeKaytto),
  Fetch.responseAsJson,
  Future.encaseP(Fetch.getFetch(fetch)),
  url.valvonta
);

export const postKaytto = R.curry((fetch, kaytto) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.valvonnat)),
    serializeKaytto
  )(kaytto)
);

export const putKaytto = R.curry((fetch, id, kaytto) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'put', url.valvonta(id))),
    serializeKaytto
  )(kaytto)
);

export const deleteKaytto = R.curry((fetch, id) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'delete', url.valvonta(id)))
  )
);

export const getHenkilo = R.compose(
  R.map(deserializeHenkilo),
  Fetch.responseAsJson,
  Future.encaseP(Fetch.getFetch(fetch)),
  url.henkilo
);

export const postHenkilo = R.curry((fetch, kohdeId, henkilo) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.henkilot(kohdeId))),
    serializeHenkilo
  )(henkilo)
);

export const putHenkilo = R.curry((fetch, id, kohdeId, henkilo) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(
      Fetch.fetchWithMethod(fetch, 'put', url.henkilo(id, kohdeId))
    ),
    serializeHenkilo
  )(henkilo)
);

export const deleteHenkilo = R.curry((fetch, id, kohdeId) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(
      Fetch.fetchWithMethod(fetch, 'delete', url.henkilo(id, kohdeId))
    )
  )
);

export const valvonnat = R.compose(
  R.map(R.map(deserializeValvontaStatus)),
  Fetch.getJson(fetch),
  R.concat(url.valvonnat),
  Query.toQueryString
);

export const valvontaCount = R.compose(
  Fetch.getJson(fetch),
  R.concat(`${url.valvonnat}/count`),
  Query.toQueryString
);

export const toimenpidetyypit = Fetch.cached(
  fetch,
  '/valvonta/kaytto/toimenpidetyypit'
);

export const ilmoituspaikat = Fetch.cached(
  fetch,
  '/valvonta/kaytto/ilmoituspaikat'
);
export const toimitustavat = Fetch.cached(
  fetch,
  '/valvonta/kaytto/toimitustavat'
);
export const roolit = Fetch.cached(fetch, '/valvonta/kaytto/roolit');

export const templatesByType = R.compose(
  Future.cache,
  R.map(R.groupBy(R.prop('toimenpidetype-id'))),
  Fetch.getJson(fetch)
)(url.valvonnat + '/templates');

export const toimenpiteet = R.compose(
  R.map(R.sortBy(Toimenpiteet.time)),
  R.map(R.map(deserializeToimenpide)),
  Fetch.getJson(fetch),
  url.toimenpiteet
);

export const toimenpide = R.compose(
  R.map(deserializeToimenpide),
  Fetch.getJson(fetch),
  url.toimenpide
);

export const valvonta = R.compose(
  R.map(deserializeValvonta),
  Fetch.getJson(fetch),
  url.valvonta
);

export const valvojat = Fetch.getJson(fetch, 'api/private/valvonta/valvojat');

export const postToimenpide = R.curry((id, toimenpide) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.toimenpiteet(id))),
    serializeToimenpide
  )(toimenpide)
);

export const putToimenpide = R.curry((id, toimenpideId, toimenpide) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(
      Fetch.fetchWithMethod(fetch, 'put', url.toimenpide(id, toimenpideId))
    ),
    R.dissoc('type-id'),
    serializeToimenpide
  )(toimenpide)
);

export const getValvonta = id =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.getFetch(fetch)),
    url.valvonta
  )(id);

export const putValvonta = R.curry((id, body) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'put', url.valvonta(id))),
    serializeValvonta
  )(body)
);

export const previewToimenpide = R.curry((id, toimenpide) =>
  R.compose(
    Fetch.responseAsBlob,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.preview(id))),
    serializeToimenpide
  )(toimenpide)
);

export const getKayttoLiitteet = id =>
  R.compose(
    R.map(R.map(EtApi.deserializeLiite)),
    Fetch.getJson(fetch),
    url.liitteet
  )(id);

export const postKayttoLiitteetFiles = R.curry((id, files) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(files =>
      fetch(url.liitteet(id) + '/files', {
        method: 'POST',
        body: EtApi.toFormData('files', files)
      })
    )
  )(files)
);

export const postKayttoLiitteetLink = R.curry((id, link) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(
      Fetch.fetchWithMethod(fetch, 'post', url.liitteet(id) + '/link')
    )
  )(link)
);

export const deleteKayttoLiite = R.curry((id, liiteId) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(liiteId =>
      Fetch.deleteRequest(fetch, url.liitteet(id) + '/' + liiteId)
    )
  )(liiteId)
);

export const getLiitteet = R.curry((id, toimenpideId) =>
  R.compose(
    R.map(R.map(EtApi.deserializeLiite)),
    Fetch.getJson(fetch),
    url.liitteet
  )(id, toimenpideId)
);

export const postLiitteetFiles = R.curry((id, toimenpideId, files) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(files =>
      fetch(url.liitteet(id, toimenpideId) + '/files', {
        method: 'POST',
        body: EtApi.toFormData('files', files)
      })
    )
  )(files)
);

export const postLiitteetLink = R.curry((id, toimenpideId, link) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(
      Fetch.fetchWithMethod(
        fetch,
        'post',
        url.liitteet(id, toimenpideId) + '/link'
      )
    )
  )(link)
);

export const deleteLiite = R.curry((id, toimenpideId, liiteId) =>
  R.compose(
    R.chain(Fetch.rejectWithInvalidResponse),
    Future.encaseP(liiteId =>
      Fetch.deleteRequest(fetch, url.liitteet(id, toimenpideId) + '/' + liiteId)
    )
  )(liiteId)
);

export const postNote = R.curry((id, note) =>
  R.compose(
    Fetch.responseAsJson,
    Future.encaseP(Fetch.fetchWithMethod(fetch, 'post', url.notes(id))),
    R.prop('description')
  )(note)
);

export const deserializeNote = R.evolve({
  'create-time': dfns.parseJSON
});

export const notes = R.compose(
  R.map(R.map(deserializeNote)),
  Fetch.getJson(fetch),
  url.notes
);
