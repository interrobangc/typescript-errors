import { TSErrorDefinition } from './types.js';
import * as errors from './errors.js';

export type * from './types.js';

export const init = <TErrors extends TSErrorDefinition>(errorMap: TErrors) => {
  return {
    isError: errors.isError<TErrors>(errorMap),
    mayFail: errors.mayFail<TErrors>(errorMap),
    promiseMayFail: errors.promiseMayFail<TErrors>(errorMap),
    promiseMapMayFail: errors.promiseMapMayFail<TErrors>(errorMap),
    newError: errors.newError<TErrors>(errorMap),
  };
};
