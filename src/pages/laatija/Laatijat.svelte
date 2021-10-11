<script>
  import { replace, location, querystring } from 'svelte-spa-router';
  import * as R from 'ramda';
  import * as qs from 'qs';
  import * as Maybe from '@Utility/maybe-utils';
  import * as Future from '@Utility/future-utils';
  import * as Formats from '@Utility/formats';
  import * as Kayttajat from '@Utility/kayttajat';
  import * as LocaleUtils from '@Language/locale-utils';
  import { locale, _ } from '@Language/i18n';
  import { flashMessageStore } from '@/stores';

  import Overlay from '@Component/Overlay/Overlay.svelte';
  import Spinner from '@Component/Spinner/Spinner.svelte';
  import H1 from '@Component/H/H1.svelte';
  import Input from '@Component/Input/Input';
  import PillInputWrapper from '@Component/Input/PillInputWrapper';
  import Select from '@Component/Select/Select';
  import Linkrow from '@Component/linkrow/linkrow';
  import Pagination from '@Component/Pagination/items-pagination';

  import * as laatijaApi from '@Pages/laatija/laatija-api';
  import * as yritysApi from '@Pages/yritys/yritys-api';
  import * as geoApi from '@Component/Geo/geo-api';
  import * as kayttajaApi from '@Pages/kayttaja/kayttaja-api';

  const i18n = $_;

  let resources = Maybe.None();
  let overlay = true;
  let cancel = () => {};

  const formatYritys = R.curry((yritykset, ids) =>
    R.compose(
      R.map(Maybe.get),
      R.filter(Maybe.isSome),
      R.map(
        R.compose(
          R.map(R.pick(['id', 'nimi'])),
          Maybe.findById(R.__, yritykset)
        )
      )
    )(ids)
  );

  const formatLocale = R.curry((localizations, id) =>
    R.compose(
      Maybe.orSome(id),
      R.map(LocaleUtils.label($locale)),
      Maybe.findById(id)
    )(localizations)
  );

  const formatToimintaalue = R.curry((toimintaalueet, toimintaalue) =>
    R.compose(
      Maybe.orSome('-'),
      R.map(formatLocale(toimintaalueet)),
      Maybe.fromNull
    )(toimintaalue)
  );

  const formatLaatija = R.curry(
    (patevyydet, yritykset, toimintaalueet, laatija) =>
      R.evolve(
        {
          login: Maybe.fromNull,
          patevyystaso: formatLocale(patevyydet),
          toimintaalue: R.compose(
            Maybe.orSome('-'),
            R.map(formatLocale(toimintaalueet)),
            Maybe.fromNull
          ),
          yritys: formatYritys(yritykset)
        },
        laatija
      )
  );

  const formatTila = R.compose(
    Maybe.orSome(i18n('validation.no-selection')),
    Maybe.map(state => i18n(`laatijahaku.tilat.` + state)),
    R.when(R.complement(Maybe.isMaybe), Maybe.of)
  );

  const matchSearch = R.curry((search, laatija) =>
    R.compose(
      R.any(R.includes(R.compose(R.toLower, R.trim)(search))),
      R.map(R.toLower),
      R.flatten,
      R.values,
      R.pick([
        'etunimi',
        'sukunimi',
        'henkilotunnus',
        'email',
        'yritys',
        'postinumero',
        'postitoimipaikka',
        'toimintaalue',
        'puhelin'
      ]),
      R.over(R.lensProp('yritys'), R.pluck('nimi'))
    )(laatija)
  );

  const matchTila = R.curry((state, laatija) =>
    R.cond([
      [
        R.equals(0),
        R.always(
          R.allPass([
            R.propEq('voimassa', true),
            R.propEq('laatimiskielto', false)
          ])(laatija)
        )
      ],
      [
        R.equals(1),
        R.always(
          R.propSatisfies(
            Maybe.isNone,
            'login',
            R.evolve(
              {
                login: Maybe.fromNull
              },
              laatija
            )
          )
        )
      ],
      [R.equals(2), R.always(R.propEq('laatimiskielto', true, laatija))],
      [R.equals(3), R.always(R.propEq('voimassa', false, laatija))],
      [R.T, R.always(true)]
    ])(state)
  );

  const matchPatevyys = R.curry((patevyys, laatija) =>
    R.ifElse(
      R.equals(Maybe.None(), patevyys),
      R.T,
      R.equals(patevyys, Maybe.Some(R.prop('patevyystaso')(laatija)))
    )(laatija)
  );

  const urlForPage = R.curry((query, page) =>
    R.compose(
      R.join('&'),
      R.map(R.join('=')),
      R.toPairs,
      R.mergeLeft({ page }),
      R.evolve({
        state: Maybe.orSome(''),
        search: Maybe.orSome(''),
        patevyystaso: Maybe.orSome(''),
        toimintaalue: Maybe.orSome('')
      })
    )(query)
  );

  $: model = R.compose(
    R.mergeRight({
      search: Maybe.None(),
      page: Maybe.Some(0),
      state: Maybe.None(),
      patevyystaso: Maybe.None(),
      toimintaalue: Maybe.None()
    }),
    R.evolve({
      search: Maybe.Some,
      page: R.compose(
        R.filter(i => !isNaN(i)),
        R.map(i => parseInt(i, 10)),
        Maybe.fromEmpty
      ),
      state: R.compose(
        R.filter(i => !isNaN(i)),
        R.map(i => parseInt(i, 10)),
        Maybe.fromEmpty
      ),
      patevyystaso: R.compose(
        R.filter(i => !isNaN(i)),
        R.map(i => parseInt(i, 10)),
        Maybe.fromEmpty
      ),
      toimintaalue: R.compose(
        R.filter(i => !isNaN(i)),
        R.map(i => parseInt(i, 10)),
        Maybe.fromEmpty
      )
    }),
    R.pick(['search', 'page', 'state', 'patevyystaso', 'toimintaalue'])
  )(qs.parse($querystring));

  $: R.compose(
    querystring => replace(`${$location}?${querystring}`),
    qs.stringify,
    R.evolve({
      search: Maybe.orSome(''),
      page: Maybe.orSome(0),
      state: Maybe.orSome(''),
      patevyystaso: Maybe.orSome(''),
      toimintaalue: Maybe.orSome('')
    })
  )(model);

  const getSearchResults = R.curry(
    (model, laatijat, patevyydet, yritykset, toimintaalueet) =>
      R.compose(
        Maybe.orSome([]),
        R.map(
          R.filter(
            R.allPass([
              matchTila(Maybe.orSome(-1, model.state)),
              matchPatevyys(model.patevyystaso)
              // matchSearch(
              //   Maybe.orSome('', model.search),
              //   formatLaatija(patevyydet, yritykset, toimintaalueet)
              // )
            ])
          )
        )
      )(laatijat)
  );

  $: {
    overlay = true;

    Future.fork(
      response => {
        overlay = false;
        const msg = Response.notFound(response)
          ? i18n('laatija.messages.not-found')
          : i18n(
              Maybe.orSome('laatija.messages.load-error'),
              Response.localizationKey(response)
            );
        flashMessageStore.add('Laatija', 'error', msg);
      },

      response => {
        overlay = false;
        resources = Maybe.Some(response);

        console.log(
          getSearchResults(
            model,
            Maybe.Some(response.laatijat),
            Maybe.Some(response.patevyydet),
            Maybe.Some(response.yritykset),
            Maybe.Some(response.toimintaalueet)
          )
        );
      },
      Future.parallelObject(5, {
        laatijat: laatijaApi.laatijat,
        yritykset: yritysApi.getAllYritykset,
        patevyydet: laatijaApi.patevyydet,
        toimintaalueet: geoApi.toimintaalueet,
        whoami: kayttajaApi.whoami
      })
    );

    console.log(model.patevyystaso);
    console.log(
      R.ifElse(R.propEq('patevyystaso', Maybe.None()), R.T, R.F)(model)
    );
  }
</script>

<Overlay {overlay}>
  <div slot="content" class="w-full mt-3">
    <H1 text={i18n('laatijahaku.title')} />
    {#each Maybe.toArray(resources) as { laatijat, yritykset, patevyydet, toimintaalueet, whoami }}
      <div class="flex flex-col my-4 space-y-4 ">
        <div
          class="flex lg:flex-row flex-col space-y-4 lg:space-y-0 lg:space-x-4 py-4">
          <div class="w-full">
            <Select
              label={i18n('laatijahaku.tila')}
              disabled={false}
              model={model.state}
              lens={R.identity}
              format={formatTila}
              parse={R.identity}
              inputValueParse={Maybe.orSome('')}
              noneLabel={'laatijahaku.kaikki'}
              items={R.map(Maybe.Some, [0, 1, 2, 3])}
              on:change={evt =>
                (model = R.mergeRight(model, {
                  state: Maybe.Some(evt.target.value),
                  page: Maybe.Some(0)
                }))} />
          </div>
          <div class="w-full">
            <Select
              label={i18n('laatija.patevyystaso')}
              disabled={false}
              model={model.patevyystaso}
              lens={R.identity}
              format={R.compose(
                Maybe.orSome(''),
                Maybe.map(LocaleUtils.label($locale)),
                Maybe.findById(R.__, patevyydet)
              )}
              parse={R.identity}
              noneLabel={'laatijahaku.kaikki'}
              items={R.pluck('id', patevyydet)}
              on:change={evt =>
                (model = R.mergeRight(model, {
                  patevyystaso: Maybe.Some(evt.target.value),
                  page: Maybe.Some(0)
                }))} />
          </div>
          <div class="w-full">
            <Select
              label={i18n('laatija.paatoimintaalue')}
              disabled={false}
              model={model.toimintaalue}
              lens={R.identity}
              format={R.compose(
                Maybe.orSome(''),
                Maybe.map(LocaleUtils.label($locale)),
                Maybe.findById(R.__, toimintaalueet)
              )}
              parse={Maybe.fromNull}
              inputValueParse={Maybe.orSome('')}
              noneLabel={'laatijahaku.kaikki'}
              items={R.pluck('id', toimintaalueet)}
              on:change={evt =>
                (model = R.mergeRight(model, {
                  toimintaalue: Maybe.Some(evt.target.value),
                  page: Maybe.Some(0)
                }))} />
          </div>
        </div>

        <div class="lg:w-2/3 w-full">
          <!-- <Checkbox
          disabled={false}
          label={i18n('laatijahaku.patevyyden-paattymisaika')}
          bind:model={model.datesactive}
          lens={R.identity}
          format={R.compose(R.not, Maybe.orSome(false))}
          parse={R.compose(Maybe.Some, R.not)} /> -->

          <div class="flex flex-col lg:flex-row w-full">
            <!-- <Datepicker
            label={i18n('laatijahaku.datestart')}
            bind:model={model.datestart}
            lens={R.identity}
            format={Maybe.fold('', formats.formatDateInstant)}
            parse={Parsers.optionalParser(Parsers.parseDate)}
            transform={EM.fromNull}
            validators={schema['deadline-date']}
            {i18n} />
          <Datepicker
            label={i18n('laatijahaku.dateend')}
            bind:model={model.dateend}
            lens={R.identity}
            format={Maybe.fold('', formats.formatDateInstant)}
            parse={Parsers.optionalParser(Parsers.parseDate)}
            transform={EM.fromNull}
            validators={schema['deadline-date']}
            {i18n} /> -->
          </div>
        </div>

        <div class="lg:w-2/3 w-full">
          <Input
            model={Maybe.orSome('', model.search)}
            inputComponentWrapper={PillInputWrapper}
            search={true}
            on:input={evt => {
              cancel = R.compose(
                Future.value(val => {
                  model = R.mergeRight(model, {
                    search: Maybe.Some(val),
                    page: Maybe.Some(0)
                  });
                }),
                Future.after(200),
                R.tap(cancel)
              )(evt.target.value);
            }} />
        </div>
      </div>

      <!-- {#each R.compose(Maybe.toArray, R.sequence(Maybe.of))([
      Maybe.Some(results),
      resources
    ]) as [results, { laatijat, yritykset, patevyydet, toimintaalueet, whoami }]} -->

      <div class="mt-10">
        <!-- <H1
          text={i18n('laatijahaku.results', {
            values: { count: R.length(getSearchResults(laatijat)) }
          })} /> -->
      </div>

      <Pagination
        items={laatijat}
        page={Maybe.orSome(0, model.page)}
        pageSize={5}
        urlFn={urlForPage(model)}
        baseUrl={'#/laatija/all?'}
        let:pageItems>
        <div class="overflow-x-auto">
          <table class="etp-table">
            <thead class="etp-table--thead">
              <th class="etp-table--th">{i18n('laatija.laatija')}</th>
              <th class="etp-table--th">{i18n('kayttaja.puhelin')}</th>
              <th class="etp-table--th">{i18n('laatija.patevyystaso')}</th>
              <th class="etp-table--th">{i18n('laatijahaku.voimassaolo')}</th>
              <th class="etp-table--th">{i18n('laatija.paatoimintaalue')}</th>
              <th class="etp-table--th">{i18n('laatija.postinumero')}</th>
              <th class="etp-table--th">{i18n('laatijahaku.kunta')}</th>
              <th class="etp-table--th">{i18n('yritys.yritykset')}</th>
              {#if Kayttajat.isPaakayttajaOrLaskuttaja(whoami)}
                <th class="etp-table--th">
                  {i18n('laatijahaku.energiatodistukset')}
                </th>
              {/if}
            </thead>
            <tbody class="etp-table--tbody">
              {#each pageItems as laatija}
                <tr data-cy="laatija-row" class="etp-table--tr">
                  <Linkrow
                    contents={[
                      `${laatija.etunimi} ${laatija.sukunimi}`,
                      laatija.puhelin,
                      formatLocale(patevyydet, laatija.patevyystaso),
                      Formats.formatPatevyydenVoimassaoloaika(
                        laatija.toteamispaivamaara
                      ),
                      formatToimintaalue(toimintaalueet, laatija.toimintaalue),
                      laatija.postinumero,
                      laatija.postitoimipaikka
                    ]}
                    href={`#/kayttaja/${laatija.id}`} />
                  <td class="etp-table--td">
                    {#each formatYritys(yritykset, laatija.yritys) as { id, nimi }}
                      <a
                        class="text-primary hover:underline"
                        href={`#/yritys/${id}`}>
                        {nimi}
                      </a>
                    {/each}
                  </td>
                  {#if Kayttajat.isPaakayttajaOrLaskuttaja(whoami)}
                    <td class="etp-table--td">
                      <a
                        class="font-icon text-2xl text-primary hover:underline"
                        href={`#/energiatodistus/all?where=[[["=","energiatodistus.laatija-id",${laatija.id}]]]`}>
                        view_list
                      </a>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Pagination>
    {/each}
  </div>

  <div slot="overlay-content">
    <Spinner />
  </div>
</Overlay>
