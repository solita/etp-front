import * as R from 'ramda';

import * as Validation from '@Utility/validation';

import * as Toimenpiteet from './toimenpiteet';

const isDocumentRequired = Toimenpiteet.isType(Toimenpiteet.type.anomaly);

const document = R.map(Validation.liftValidator, Validation.LimitedString(2, 4000));

const addRequiredValidator = when => when ? R.prepend(Validation.isSome) : R.identity

export const toimenpideSave = {
  'deadline-date': [],
  'template-id': [],
  'document': document
}

export const toimenpidePublish = (templates, toimenpide) => R.evolve({
  'deadline-date': addRequiredValidator(Toimenpiteet.hasDeadline(toimenpide)),
  'template-id': addRequiredValidator(!R.isEmpty(templates)),
  'document': addRequiredValidator(isDocumentRequired(toimenpide))
}, toimenpideSave);


