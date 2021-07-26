<script>
  import * as R from 'ramda';
  import * as Maybe from '@Utility/maybe-utils';
  import * as Either from '@Utility/either-utils';
  import * as EM from '@Utility/either-maybe';
  import * as Parsers from '@Utility/parsers';
  import * as Formats from '@Utility/formats';
  import * as Future from '@Utility/future-utils';
  import * as Response from '@Utility/response';
  import * as Validation from '@Utility/validation';
  import * as Locales from '@Language/locale-utils';
  import { push } from '@Component/Router/router';

  import DirtyConfirmation from '@Component/Confirm/dirty.svelte';
  import Overlay from '@Component/Overlay/Overlay.svelte';
  import Spinner from '@Component/Spinner/Spinner.svelte';
  import H1 from '@Component/H/H1.svelte';
  import Input from '@Component/Input/Input.svelte';
  import Button from '@Component/Button/Button.svelte';
  import Select from '@Component/Select/Select.svelte';
  import { _, locale } from '@Language/i18n';
  import { flashMessageStore } from '@/stores';

  export let params;

  import * as api from './valvonta-api';
  import * as geoApi from '@Component/Geo/geo-api';
  // import * as KayttajaApi from '@Component/Kayttaja/kayttaja-api';

  const i18n = $_;
  const i18nRoot = 'valvonta.kaytto.osapuolet';
  const emptyHenkilo = {
    etunimi: '',
    sukunimi: '',
    henkilotunnus: '',
    'rooli-id': Maybe.None(),
    'rooli-description': ' ',
    email: '',
    puhelin: '',
    'vastaanottajan-tarkenne': '',
    jakeluosoite: '',
    postinumero: '',
    postitoimipaikka: '',
    maa: Maybe.None(),
    'toimitustapa-id': Maybe.None(),
    'toimitustapa-description': ' '
  };

  let overlay = true;
  let dirty = false;
  let form;
  let henkilo = emptyHenkilo;

  let resources = Maybe.None();

  Future.fork(
    response => {
      const msg = $_(
        `${i18nRoot}.messages.load-error`,
        Response.localizationKey(response)
      );

      flashMessageStore.add('henkilo', 'error', msg);
      overlay = false;
    },
    response => {
      resources = Maybe.Some(response);
      overlay = false;
    },
    Future.parallelObject(3, {
      roolit: api.roolit,
      toimitustavat: api.toimitustavat,
      countries: geoApi.countries
    })
  );

  const submitNewHenkilo = event => {
    if (henkilo.etunimi?.length >= 1 && henkilo.sukunimi?.length >= 1) {
      overlay = true;
      console.log('SUBMITTING:', henkilo);
      addHenkilo(henkilo);
    } else {
      flashMessageStore.add(
        'henkilo',
        'error',
        i18n(`${i18nRoot}.messages.validation-error`)
      );
      Validation.blurForm(event.target);
    }
  };

  const addHenkilo = R.compose(
    Future.fork(
      response => {
        const msg = i18n(
          Maybe.orSome(
            `${i18nRoot}.messages.error`,
            Response.localizationKey(response)
          )
        );
        flashMessageStore.add('henkilo', 'error', msg);
        overlay = false;
      },
      _ => {
        flashMessageStore.add(
          'henkilo',
          'success',
          i18n(`${i18nRoot}.messages.success`)
        );
        dirty = false;
        push('/valvonta/kaytto/' + params.id + '/henkilo/' + _.id);
      }
    ),
    api.postHenkilo(fetch, params.id)
  );
</script>

<H1 text={i18n(i18nRoot + '.uusi-henkilo')} />

<Overlay {overlay}>
  <div slot="content">
    {#each Maybe.toArray(resources) as { roolit, toimitustavat, countries }}
      <form
        class="content"
        bind:this={form}
        on:submit|preventDefault={submitNewHenkilo}
        on:input={_ => {
          dirty = true;
        }}
        on:change={_ => {
          dirty = true;
        }}>
        <DirtyConfirmation {dirty} />
        <div class="flex flex-col w-full py-8">
          <div
            class="py-4 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 w-full md:w-2/3">
            <div class="w-full">
              <Input
                id={'henkilo.etunimi'}
                name={'henkilo.etunimi'}
                label={i18n(`${i18nRoot}.etunimi`)}
                required={true}
                bind:model={henkilo}
                lens={R.lensProp('etunimi')}
                parse={R.trim}
                {i18n} />
            </div>
            <div class="w-full">
              <Input
                id={'henkilo.sukunimi'}
                name={'henkilo.sukunimi'}
                label={i18n(`${i18nRoot}.sukunimi`)}
                required={true}
                bind:model={henkilo}
                lens={R.lensProp('sukunimi')}
                parse={R.trim}
                {i18n} />
            </div>
          </div>

          <div class="py-4 w-full md:w-1/3 md:pr-2">
            <Input
              id={'henkilo.henkilotunnus'}
              name={'henkilo.henkilotunnus'}
              label={i18n(`${i18nRoot}.henkilotunnus`)}
              bind:model={henkilo}
              lens={R.lensProp('henkilotunnus')}
              parse={R.trim}
              {i18n} />
          </div>

          <div class="py-4 w-full md:w-1/3 md:pr-2">
            <Select
              id={'henkilo.rooli-id'}
              label={i18n(`${i18nRoot}.rooli-id`)}
              required={false}
              disabled={false}
              allowNone={true}
              bind:model={henkilo}
              parse={Maybe.fromNull}
              lens={R.lensProp('rooli-id')}
              format={Locales.labelForId($locale, roolit)}
              items={R.pluck('id', roolit)} />
          </div>
          {#each Maybe.toArray(henkilo['rooli-id']) as rooliId}
            {#if rooliId === 2}
              <div class="py-4 w-full md:w-1/3 md:pr-2">
                <Input
                  id={'henkilo.rooli-description'}
                  name={'henkilo.rooli-description'}
                  label={i18n(`${i18nRoot}.rooli-description`)}
                  bind:model={henkilo}
                  lens={R.lensProp('rooli-description')}
                  parse={R.trim}
                  {i18n} />
              </div>
            {/if}
          {/each}

          <div
            class="py-4 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 w-full md:w-2/3">
            <div class="w-full">
              <Input
                id={'henkilo.email'}
                name={'henkilo.email'}
                label={i18n(`${i18nRoot}.email`)}
                bind:model={henkilo}
                lens={R.lensProp('email')}
                parse={R.trim}
                {i18n} />
            </div>
            <div class="w-full">
              <Input
                id={'henkilo.puhelin'}
                name={'henkilo.puhelin'}
                label={i18n(`${i18nRoot}.puhelin`)}
                bind:model={henkilo}
                lens={R.lensProp('puhelin')}
                parse={R.trim}
                {i18n} />
            </div>
          </div>

          <div class="py-4 w-full md:w-1/3 md:pr-2">
            <Input
              id={'henkilo.vastaanottajan-tarkenne'}
              name={'henkilo.vastaanottajan-tarkenne'}
              label={i18n(`${i18nRoot}.vastaanottajan-tarkenne`)}
              bind:model={henkilo}
              lens={R.lensProp('vastaanottajan-tarkenne')}
              parse={R.trim}
              {i18n} />
          </div>
          <div class="py-4 w-full">
            <Input
              id={'henkilo.jakeluosoite'}
              name={'henkilo.jakeluosoite'}
              label={i18n(`${i18nRoot}.jakeluosoite`)}
              bind:model={henkilo}
              lens={R.lensProp('jakeluosoite')}
              parse={R.trim}
              {i18n} />
          </div>
          <div
            class="py-4 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0 w-full">
            <div class="w-full">
              <Input
                id={'henkilo.postinumero'}
                name={'henkilo.postinumero'}
                label={i18n(`${i18nRoot}.postinumero`)}
                bind:model={henkilo}
                lens={R.lensProp('postinumero')}
                parse={R.trim}
                {i18n} />
            </div>
            <div class="w-full">
              <Input
                id={'henkilo.postitoimipaikka'}
                name={'henkilo.postitoimipaikka'}
                label={i18n(`${i18nRoot}.postitoimipaikka`)}
                bind:model={henkilo}
                lens={R.lensProp('postitoimipaikka')}
                parse={R.trim}
                {i18n} />
            </div>
            <div class="w-full">
              <Select
                id={'henkilo.maa'}
                label={i18n(`${i18nRoot}.maa`)}
                required={false}
                disabled={false}
                allowNone={true}
                bind:model={henkilo}
                parse={Maybe.fromNull}
                lens={R.lensProp('maa')}
                format={Locales.labelForId($locale, countries)}
                items={R.pluck('id', countries)} />
            </div>
          </div>
          <div class="py-4 w-full md:w-1/3 md:pr-2">
            <Select
              id={'henkilo.toimitustapa-id'}
              label={i18n(`${i18nRoot}.toimitustapa-id`)}
              required={false}
              disabled={false}
              allowNone={true}
              bind:model={henkilo}
              parse={Maybe.fromNull}
              lens={R.lensProp('toimitustapa-id')}
              format={Locales.labelForId($locale, toimitustavat)}
              items={R.pluck('id', toimitustavat)} />
          </div>
        </div>
        {#each Maybe.toArray(henkilo['toimitustapa-id']) as toimitustapa}
          <div class="flex flex-col">
            {#if toimitustapa === 0 && !henkilo.henkilotunnus}
              <div class="flex space-x-2">
                <span class="font-icon text-warning">info</span>
                <span>
                  {i18n(`${i18nRoot}.warning-toimitustapa-suomifi-henkilo`)}
                </span>
              </div>
            {/if}
            {#if toimitustapa === 1 && !henkilo.email}
              <div class="flex space-x-2">
                <span class="font-icon text-warning">info</span>
                <span>
                  {i18n(`${i18nRoot}.warning-toimitustapa-email`)}
                </span>
              </div>
            {/if}
          </div>
        {/each}
        <div class="flex space-x-4 py-8">
          <Button
            disabled={!dirty}
            type={'submit'}
            text={i18n(`${i18nRoot}.save`)} />
          <!-- <Button
            disabled={!dirty}
            on:click={resetForm}
            text={i18n(`${i18nRoot}.reset`)}
            type={'reset'}
            style={'secondary'} /> -->
          <!-- <Button
              disabled={!dirty}
              on:click={() => alert('DELETE')}
              text={i18n(`${i18nRoot}.delete`)}
              style={'error'} /> -->
        </div>
      </form>
    {/each}
  </div>
  <div slot="overlay-content">
    <Spinner />
  </div>
</Overlay>
