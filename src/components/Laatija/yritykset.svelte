<script>
  import * as R from 'ramda';

  import { _ } from '@Language/i18n';
  import { push } from '@Component/Router/router';

  import H1 from '@Component/H/H1';
  import Input from '@Component/Input/Input';
  import Button from '@Component/Button/Button';
  import Link from '@Component/Link/Link';
  import Autocomplete from '@Component/Autocomplete/Autocomplete';
  import Confirm from '@Component/Confirm/Confirm';
  import Overlay from '@Component/Overlay/Overlay.svelte';
  import Address from '@Component/Yritys/address.svelte';

  import * as kayttajaApi from '@Component/Kayttaja/kayttaja-api';
  import * as Kayttajat from '@Utility/kayttajat'
  import * as laatijaApi from './laatija-api';
  import * as yritysApi from '@Component/Yritys/yritys-api';
  import * as Tila from '@Component/Yritys/laatija-yritys-tila';

  import * as Maybe from '@Utility/maybe-utils';
  import * as Either from '@Utility/either-utils';
  import * as Future from '@Utility/future-utils';
  import * as Formats from '@Utility/formats';
  import * as Parsers from '@Utility/parsers';

  import { flashMessageStore } from '@/stores';

  export let params;

  let newLaatijaYritys = Either.Right(Maybe.None());
  let laatijaYritykset = [];
  let allYritykset = [];
  let whoami = Maybe.None();
  let overlay = true;
  let disabled = false;

  const detach = index => {
    Future.fork(
      _ =>
        flashMessageStore.add(
          'Laatija',
          'error',
          $_('laatija.yritykset.error.detach-failed')
        ),
      _ => {
        load(params.id);
        flashMessageStore.add(
          'Laatija',
          'success',
          $_('laatija.yritykset.success.detach')
        );
      },
      laatijaApi.deleteLaatijaYritys(
        fetch,
        params.id,
        laatijaYritykset[index].id
      )
    );
  };

  const toggleOverlay = value => {
    overlay = value;
  };

  const parseId = R.compose(parseInt, R.trim, R.nth(0), R.split('|'));

  const isInYritykset = yritykset =>
    R.propSatisfies(R.includes(R.__, R.map(R.prop('id'), yritykset)), 'id');

  $: parseYritys = R.compose(
    Either.filter(
      R.applyTo('laatija.yritykset.already-attached'),
      R.complement(isInYritykset(laatijaYritykset))
    ),
    Maybe.toEither(R.applyTo('laatija.yritykset.yritys-not-found')),
    Maybe.findById(R.__, allYritykset),
    parseId
  );

  const formatYritys = yritys =>
    yritys.id + ' | ' + yritys.ytunnus + ' | ' + yritys.nimi;

  const load = id => {
    toggleOverlay(true);
    return Future.fork(
      _ => {
        flashMessageStore.add('Laatija', 'error', $_('errors.load-error'));
        toggleOverlay(false);
      },
      response => {
        allYritykset = response.allYritykset;
        laatijaYritykset = R.compose(
          R.map(yritys =>
            R.mergeLeft(yritys, R.find(R.propEq('id', yritys.id), allYritykset))
          ),
          R.filter(R.complement(Tila.isDeleted))
        )(response.yritykset);
        whoami = Maybe.Some(response.whoami);
        toggleOverlay(false);
      },
      Future.parallelObject(3, {
        yritykset: laatijaApi.yritykset(id),
        allYritykset: yritysApi.getAllYritykset,
        whoami: kayttajaApi.whoami
      })
    )
  }

  $: load(params.id);

  function attach() {
    newLaatijaYritys
      .flatMap(
        Maybe.toEither(R.applyTo('laatija.yritykset.error.select-yritys'))
      )
      .leftMap(R.applyTo($_))
      .cata(flashMessageStore.add('Laatija', 'error'), yritys => {
        Future.fork(
          _ =>
            flashMessageStore.add(
              'Laatija',
              'error',
              $_('laatija.yritykset.error.attach-failed')
            ),
          _ => {
            load(params.id);
            flashMessageStore.add(
              'Laatija',
              'success',
              $_('laatija.yritykset.success.attach')
            );
          },
          laatijaApi.putLaatijaYritys(fetch, params.id, yritys.id)
        );
      });
  }
</script>

<style type="text/postcss">
  h2 {
    @apply font-bold uppercase text-lg pb-4;
  }
</style>

<Overlay {overlay}>
  <div slot="content">
    <form>
      <div class="w-full mt-3">
        <H1 text={$_('laatija.yritykset.title')} />

        {#if R.isEmpty(laatijaYritykset)}
          <p class="mb-10">{$_('laatija.yritykset.empty')}</p>
        {:else}
          <p class="mb-5">{$_('laatija.yritykset.table.description')}</p>

          <div class="mb-8">
            <table class="etp-table">
              <thead class="etp-table--thead">
                <tr class="etp-table--tr">
                  <th class="etp-table--th">{$_('yritys.nimi')}</th>
                  <th class="etp-table--th">{$_('yritys.y-tunnus')}</th>
                  <th class="etp-table--th">{$_('yritys.laskutusosoite')}</th>
                  <th class="etp-table--th"
                    >{$_('laatija.yritykset.table.tila')}</th>
                  <th class="etp-table--th"
                    >{$_('laatija.yritykset.table.delete')}</th>
                </tr>
              </thead>
              <tbody class="etp-table--tbody">
                {#each laatijaYritykset as yritys, index}
                  <tr
                    class="etp-table--tr etp-table--tr__link"
                    on:click={() => push('#/yritys/' + yritys.id)}>
                    <td class="etp-table--td">
                      {yritys.nimi}
                      {Maybe.fold(
                        '',
                        R.concat('/ ', R.__),
                        yritys['vastaanottajan-tarkenne']
                      )}
                    </td>
                    <td class="etp-table--td">{yritys.ytunnus}</td>
                    <td class="etp-table--td"><Address address={yritys} /></td>
                    <td class="etp-table--td">
                      {#if Tila.isProposal(yritys)}
                        {$_('laatija.yritykset.table.proposal')}
                      {:else}
                        {R.replace(
                          '{time}',
                          Formats.formatTimeInstant(yritys.modifytime),
                          $_('laatija.yritykset.table.accepted')
                        )}
                      {/if}
                    </td>
                    <td class="etp-table--td">
                      <Confirm
                        let:confirm
                        confirmButtonLabel={$_('confirm.button.delete')}
                        confirmMessage={$_('confirm.you-want-to-delete')}>
                        <span
                          class="material-icons cursor-pointer"
                          on:click|stopPropagation={_ =>
                            confirm(detach, index)}>
                          delete
                        </span>
                      </Confirm>
                    </td>
                  </tr>
                {/each}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4">
                    {$_('laatija.yritykset.table.footer')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        {/if}

        {#if whoami.map(Kayttajat.isLaatija).orSome(false)}
          <h2>{$_('laatija.yritykset.joining.heading')}</h2>

          <ol class="list-decimal list-inside">
            <li>{$_('laatija.yritykset.joining.step-1')}</li>
            <li>{$_('laatija.yritykset.joining.step-2')}</li>
            <li>{$_('laatija.yritykset.joining.step-3')}</li>
          </ol>

          <form class="mb-5" on:submit|preventDefault={attach}>
            <div class="flex lg:flex-row flex-col py-4 -mx-4">
              <div class="lg:w-1/2 lg:py-0 w-full px-4 py-4">
                <Autocomplete items={R.map(formatYritys, allYritykset)}>
                  <Input
                    id={'yritys'}
                    name={'yritys'}
                    label={$_('laatija.yritykset.find-yritys')}
                    required={false}
                    {disabled}
                    bind:model={newLaatijaYritys}
                    format={R.compose(Maybe.orSome(''), R.map(formatYritys))}
                    parse={Parsers.optionalParser(parseYritys)}
                    lens={R.lens(R.identity, R.identity)}
                    search={true}
                    i18n={$_} />
                </Autocomplete>
              </div>
              <div class="self-end">
                <Button
                  type={'submit'}
                  text={$_('laatija.yritykset.attach-to-yritys')} />
              </div>
            </div>
          </form>

          <h2>{$_('laatija.yritykset.create-new')}</h2>

          <p class="mb-5">
            {$_('laatija.yritykset.create-info')}
          </p>
          <div class="flex flex-row">
            <span class="material-icons">add</span>
            &nbsp;
            <Link text={$_('laatija.yritykset.add-new')} href="#/yritys/new" />
          </div>
        {/if}
      </div>
    </form>
  </div>
</Overlay>
