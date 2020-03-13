import * as R from 'ramda';

//
// Some ready-made validations
//
export const required = f => {
  return model => {
    const value = f(model);
    if(value !== undefined) {
      return value.isSome() || value.foldLeft(false)((acc, v) => v.isSome());
    } else {
      return false;
    }
  }
};

export const numberBetween = (f, min, max) => {
  return model => {
    const value = f(model);
    if(value !== undefined) {
      return (value.foldLeft(false)((acc, v) => v.map(raw => {
        return min <= raw && max >= raw;
      }).orSome(false)));
    } else {
      return false;
    }
  }
};

//
// Functionality for running the validations
//
const runValidation = R.curry((model, validation) => {
  const res = validation.f(model);
  if(res === false) {
    return validation;
  } else {
    return true;
  }
});

export const runValidations = (model, validations) => {
  const runValidationsForModel = runValidation(model);
  return R.reduce((acc, validation) => {
    const validationResult = runValidationsForModel(validation);
    if(validationResult === true) {
      return acc;
    } else {
      return R.assoc(validationResult.id, validationResult.label, acc);
    }
  }, {}, validations);
};
