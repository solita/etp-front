import * as R from 'ramda';

import * as Validation from '@Utility/validation';

import * as Toimenpiteet from './toimenpiteet';
import * as Maybe from '@Utility/maybe-utils';

const OptionalLimitedString = (min, max) =>
  R.map(Validation.liftValidator, Validation.LimitedString(2, 200));

export const kohde = {
  rakennustunnus: [
    Validation.liftValidator(Validation.rakennustunnusValidator)
  ],
  katuosoite: Validation.RequiredString(2, 200),
  ilmoituspaikka_description: OptionalLimitedString(2, 200),
  ilmoitustunnus: OptionalLimitedString(2, 200)
};

const osapuoli = {
  email: [Validation.liftValidator(Validation.emailValidator)],
  puhelin: OptionalLimitedString(2, 200),
  'vastaanottajan-tarkenne': OptionalLimitedString(2, 200),
  jakeluosoite: OptionalLimitedString(2, 200),
  postinumero: [],
  postitoimipaikka: OptionalLimitedString(2, 200),
  'rooli-description': OptionalLimitedString(2, 200),
  'toimitustapa-description': OptionalLimitedString(2, 200)
};

export const henkilo = R.mergeLeft(osapuoli, {
  henkilotunnus: [Validation.liftValidator(Validation.henkilotunnusValidator)],
  etunimi: Validation.RequiredString(2, 200),
  sukunimi: Validation.RequiredString(2, 200)
});

export const yritys = R.mergeLeft(osapuoli, {
  ytunnus: [Validation.liftValidator(Validation.ytunnusValidator)],
  nimi: Validation.RequiredString(2, 200)
});

export const appendPostinumeroValidatorForCountry = (osapuoli, schema) =>
  R.over(
    R.lensProp('postinumero'),
    Maybe.exists(R.equals('FI'), osapuoli.maa)
      ? R.append(Validation.liftValidator(Validation.postinumeroFIValidator))
      : R.concat(
          R.__,
          R.map(Validation.liftValidator, Validation.LimitedString(2, 20))
        ),
    schema
  );

const description = R.map(
  Validation.liftValidator,
  Validation.LimitedString(2, 4000)
);

const addRequiredValidator = when =>
  when ? R.prepend(Validation.isSome) : R.identity;

export const toimenpideSave = {
  publish: false,
  'deadline-date': [],
  'template-id': [],
  description: description,
  'severity-id': [],
  'type-specific-data': {
    'recipient-answered': [Validation.isBoolean],
    'answer-commentary-fi': description,
    'answer-commentary-sv': description,
    'statement-fi': description,
    'statement-sv': description,
    fine: Validation.MaybeInterval(0, Number.MAX_VALUE),
    'osapuoli-specific-data': [
      {
        'osapuoli-id': [],
        'hallinto-oikeus-id': Validation.MaybeInterval(0, 5)
      }
    ],
    'department-head-title-fi': description,
    'department-head-title-sv': description,
    'department-head-name': description
  }
};

export const toimenpidePublish = (templates, toimenpide) =>
  R.evolve(
    {
      publish: R.T,
      'deadline-date': addRequiredValidator(
        Toimenpiteet.hasDeadline(toimenpide)
      ),
      'template-id': addRequiredValidator(!R.isEmpty(templates)),
      'type-specific-data': {
        'answer-commentary-fi': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        'answer-commentary-sv': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        'statement-fi': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        'statement-sv': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        fine: addRequiredValidator(Toimenpiteet.hasFine(toimenpide)),
        'osapuoli-specific-data': osapuoliSpecificSchema => {
          return R.map(
            R.over(
              R.lensProp('hallinto-oikeus-id'),
              addRequiredValidator(Toimenpiteet.isActualDecision(toimenpide))
            ),
            osapuoliSpecificSchema
          );
        },
        'department-head-title-fi': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        'department-head-title-sv': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        ),
        'department-head-name': addRequiredValidator(
          Toimenpiteet.isActualDecision(toimenpide)
        )
      }
    },
    toimenpideSave
  );

export const note = {
  description: Validation.LimitedString(2, 4000)
};
