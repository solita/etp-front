<script>
  import * as R from 'ramda';
  import * as Future from '@Utility/future-utils';
  import * as Maybe from '@Utility/maybe-utils';
  import * as Either from '@Utility/either-utils';
  import * as validation from '@Utility/validation';
  import * as formats from '@Utility/formats';
  import * as Kayttajat from '@Utility/kayttajat';
  import * as api from './energiatodistus-api';
  import * as valvontaApi from './valvonta-api';
  import * as kayttajaApi from '@Component/Kayttaja/kayttaja-api';

  import { _ } from '@Language/i18n';
  import { flashMessageStore } from '@/stores';

  import H1 from '@Component/H/H1';
  import H2 from '@Component/H/H2';
  import Overlay from '@Component/Overlay/Overlay';
  import Spinner from '@Component/Spinner/Spinner';
  import Link from '@Component/Link/Link';
  import FileDropArea from '@Component/FileDropArea/FileDropArea';
  import Input from '@Component/Input/Input';
  import Button from '@Component/Button/Button';
  import Confirm from '@Component/Confirm/Confirm';
  import Checkbox from '@Component/Checkbox/Checkbox.svelte';
  import * as Response from '@Utility/response';

  export let params;

  const emptyLiite = _ => ({ nimi: '', url: '' });

  let overlay = true;
  let failure = false;
  let enabled = false;
  let liitteet;
  let liiteLinkAdd;
  let files = [];
  let whoami = Maybe.None();

  let linkNimi = '';
  let linkUrl = '';
  let linkNimiValid = true;
  let linkUrlValid = true;

  const resetForm = () => {
    liitteet = [];
    liiteLinkAdd = emptyLiite();
  };

  const enableOverlay = _ => {
    overlay = true
  }

  resetForm();

  const liiteLinkAddSchema = {
    nimi: [validation.isRequired, validation.maxLengthConstraint(300)],
    url: [validation.isRequired, validation.urlValidator]
  };

  const orEmpty = Maybe.orSome('');
  const cancel = _ => {
    linkNimi = '';
    linkUrl = '';
    linkNimiValid = true;
    linkUrlValid = true;
    liiteLinkAdd = emptyLiite();
  };

  const getValvonta = (_, id) => valvontaApi.getValvonta(fetch, id);

  const load = R.compose(
    Future.fork(
      _ => {
        flashMessageStore.add('Energiatodistus', 'error',
          $_('energiatodistus.liitteet.messages.load-error'));
        overlay = false;
      },
      response => {
        whoami = Maybe.Some(response[0]);
        liitteet = response[1];
        enabled = response[2].active;
        overlay = false;
      }
    ),
    R.tap(enableOverlay),
    Future.parallel(5),
    R.prepend(kayttajaApi.whoami),
    R.juxt([api.getLiitteetById(fetch), getValvonta])
  );


  const viewError = (functionName, response) => {
    const msg = $_(Maybe.orSome(
      `energiatodistus.liitteet.messages.${functionName}.error`,
      Response.localizationKey(response)));
    flashMessageStore.add('Energiatodistus', 'error', msg);
  }

  const fork = functionName =>
    Future.fork(
      response => {
        viewError(functionName, response);
        overlay = false;
      },
      _ => {
        flashMessageStore.add('Energiatodistus', 'success',
          $_(`energiatodistus.liitteet.messages.${functionName}.success`));
        load(params.version, params.id);
      }
    );

  $: files.length > 0 &&
  R.compose(
    fork('add-files'),
    R.tap(enableOverlay),
    api.postLiitteetFiles(fetch, params.version, params.id)
  )(files);

  const addLink = R.compose(
    fork('add-link'),
    R.tap(enableOverlay),
    api.postLiitteetLink(fetch, params.version, params.id)
  );

  const submit = event => {
    if (isValidForm(liiteLinkAdd)) {
      flashMessageStore.flush();
      addLink(liiteLinkAdd);
      resetForm();
    } else {
      flashMessageStore.add(
        'Energiatodistus',
        'error',
        $_('energiatodistus.liitteet.messages.add-link.validation')
      );
    }
  };

  $: load(params.version, params.id);

  const liiteUrl = liite =>
    Maybe.orSome(
      api.url.liitteet(params.version, params.id)
      + '/'
      + liite.id
      + '/'
      + encodeURIComponent(liite.nimi),
      liite.url
    );

  const addDefaultProtocol = R.ifElse(
    R.anyPass([R.includes('://'), R.isEmpty]),
    R.identity,
    R.concat('http://')
  );

  const deleteLiite = R.compose(
    fork('delete-liite'),
    R.tap(enableOverlay),
    api.deleteLiite(fetch, params.version, params.id)
  );

  const isValidForm = R.compose(
    R.all(Either.isRight),
    R.filter(Either.isEither),
    R.values,
    validation.validateModelObject(liiteLinkAddSchema)
  );

  $: linkEmpty = linkNimi.length === 0 || linkUrl.length === 0;
  $: linkInvalid = !(linkNimiValid && linkUrlValid);

  const saveValvonta = event => Future.fork(
    response => {
      viewError('valvonta', response);
      enabled = !enabled;
    },
    _ => {
      flashMessageStore.add('Energiatodistus', 'success',
        $_(`energiatodistus.liitteet.messages.valvonta.success`));
    },
    valvontaApi.putValvonta(fetch, params.id, enabled));
</script>

<style>

</style>

<div class="w-full mt-3">
  <H1 text={$_('energiatodistus.liitteet.title')} />

  <Overlay {overlay}>
    <div slot="content" class="mb-10">
      {#if Maybe.fold(false, Kayttajat.isPaakayttaja, whoami)}
      <div class="mb-5"
           on:change={saveValvonta}>
      <Checkbox
          bind:model={enabled}
          label="Laatija saa lisätä todistukselle liitteitä" />
      </div>
      {/if}

      {#if !enabled}
      <div class="mb-5 bg-warning flex p-5">
        <span class="font-icon mr-2">warning</span>
        Liitteitä ei voi lisätä koska energiatodistus ei ole valvonnassa
      </div>
      {/if}

      {#if R.isEmpty(liitteet)}
        <p>{$_('energiatodistus.liitteet.empty')}</p>
      {:else}
        <table class="etp-table">
          <thead class="etp-table--thead">
            <tr class="etp-table--tr">
              <th class="etp-table--th">
                {$_('energiatodistus.liitteet.liite.createtime')}
              </th>
              <th class="etp-table--th">
                {$_('energiatodistus.liitteet.liite.nimi')}
              </th>
              <th class="etp-table--th">
                {$_('energiatodistus.liitteet.liite.author')}
              </th>
              <th class="etp-table--th">{$_('table.actions')}</th>
            </tr>
          </thead>
          <tbody class="etp-table--tbody">
            {#each liitteet as liite}
              <tr class="etp-table--tr">
                <td class="etp-table--td">
                  {formats.formatTimeInstant(liite.createtime)}
                </td>
                <td class=" etp-table--td">
                  <Link text={liite.nimi} href={liiteUrl(liite)} />
                </td>
                <td class="etp-table--td">{liite['author-fullname']}</td>
                <td class="etp-table--td">
                  <Confirm
                    let:confirm
                    confirmButtonLabel={$_('confirm.button.delete')}
                    confirmMessage={$_('confirm.you-want-to-delete')}>
                    <span
                      class="material-icons cursor-pointer"
                      on:click|stopPropagation={_ => confirm(deleteLiite, liite.id)}>
                      delete
                    </span>
                  </Confirm>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
    <div slot="overlay-content">
      <Spinner />
    </div>
  </Overlay>

  {#if enabled}
  <div class="mb-4 flex lg:flex-row flex-col">
    <div class="lg:w-1/2 w-full mr-6 mb-6">
      <H2 text={$_('energiatodistus.liitteet.add-files.title')} />
      <FileDropArea bind:files multiple={true} />
    </div>
    <div class="lg:w-1/2 w-full flex flex-col">
      <H2 text={$_('energiatodistus.liitteet.add-link.title')} />
      <form on:submit|preventDefault={submit}>
        <div class="w-full px-4 py-4">
          <Input
            id={'link.nimi'}
            name={'link.nimi'}
            label={$_('energiatodistus.liitteet.add-link.nimi')}
            bind:model={liiteLinkAdd}
            lens={R.lensPath(['nimi'])}
            bind:currentValue={linkNimi}
            bind:valid={linkNimiValid}
            parse={R.trim}
            validators={liiteLinkAddSchema.nimi}
            i18n={$_} />
        </div>

        <div class="w-full px-4 py-4">
          <Input
            id={'link.url'}
            name={'link.url'}
            label={$_('energiatodistus.liitteet.add-link.url')}
            bind:model={liiteLinkAdd}
            lens={R.lensPath(['url'])}
            bind:currentValue={linkUrl}
            bind:valid={linkUrlValid}
            parse={R.compose( addDefaultProtocol, R.trim )}
            validators={liiteLinkAddSchema.url}
            i18n={$_} />
        </div>

        <div class="flex -mx-4 pt-8">
          <div class="px-4">
            <Button
              disabled={linkEmpty || linkInvalid}
              type={'submit'}
              text={'Lisää linkki'} />
          </div>
          <div class="px-4">
            <Button
              on:click={cancel}
              text={'Tyhjennä'}
              type={'reset'}
              style={'secondary'} />
          </div>
        </div>
      </form>
    </div>
  </div>
  {/if}
</div>