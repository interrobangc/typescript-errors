import type { TSErrorDefinition, TSErrorParams } from './types.js';

/**
 * These functions make up a TS safe error handling system.
 *
 * The types are a bit messy and overly complicated so that this system can be extended
 * and used by other projects that use it (like the Remix frontend).
 *
 * Since the
 */
const isErrorCode =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  <TCode extends keyof TErrors>(code: unknown): code is TCode => {
    return Object.keys(errorMap).includes(code as string);
  };

const getErrorMessage =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  <TCode extends keyof TErrors>(code: TCode, message?: string): string => {
    if (message) {
      return message;
    }

    if (isErrorCode(errorMap)(code)) {
      return errorMap[code]?.message ?? code;
    }

    return code as unknown as string;
  };

export type TSErrorType<TErrors extends TSErrorDefinition> = TSError<TErrors>;

/**
 * A custom error class for the Time by Projects project.
 *
 * We extend the base Error class because folks know how to deal with them and they include a stack trace.
 *
 * We change the call signature to include a code, cause, and meta data.
 *
 * The code is a string that represents the error. It should be unique and descriptive.
 * The message will be pulled from the TS_ERRORS constant.
 */
export class TSError<TErrors extends TSErrorDefinition> extends Error {
  message: string;
  code: keyof TErrors;
  cause?: unknown;
  meta: Record<string, unknown>;

  constructor({
    errorMap,
    cause,
    code,
    message,
    meta,
  }: TSErrorParams<TErrors>) {
    super();
    this.code = code;
    this.message = getErrorMessage(errorMap)(code, message);
    this.cause = cause;
    this.meta = meta ?? {};
  }
}

/**
 * Check if an error is a RemixError
 *
 * @param {unknown} target The error to check
 *
 * @returns {bool} Whether the target is a RemixError
 */
export const isError =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
    <TCode extends keyof TErrors>(
      target: unknown,
      code?: TCode,
    ): target is TSError<TErrors> =>
      target instanceof TSError && (!code || target.code === code);

/**
 * Resolves a target that could throw and returns a RemixError if the target fails
 *
 * @param {() => T} target The function to handle
 * @param {ErrorCode} code The error code to use if the target fails
 * @param {TSErrorParams['meta']} meta The meta data to include in the error
 *
 * @returns The result of the target or a RemixError with the error in the meta
 */
export const mayFail =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  <T, TCode extends keyof TErrors>(
    target: () => T,
    code: TCode,
    meta: Record<string, unknown> = {},
  ) => {
    try {
      const targetResp = target();
      if (isError(errorMap)(targetResp)) return targetResp;
      return targetResp;
    } catch (e) {
      return new TSError<TErrors>({ cause: e, code, meta, errorMap });
    }
  };

/**
 * Resolves a promise that could throw and returns a RemixError if the promise fails
 *
 * @param {Promise<T>} target The promise to handle
 * @param {ErrorCode} code The error code to use if the promise fails
 * @param {TSErrorParams['meta']} meta The meta data to include in the error
 *
 * @returns - The result of the promise or a RemixError with the error in the meta
 *
 */
export const promiseMayFail =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  async <T, TCode extends keyof TErrors>(
    target: Promise<T>,
    code: TCode,
    meta: Record<string, unknown> = {},
  ) => {
    try {
      const targetRes = await target;
      if (isError(errorMap)(targetRes)) return targetRes;
      return targetRes;
    } catch (e) {
      return new TSError<TErrors>({ cause: e, code, meta, errorMap });
    }
  };

/**
 * Resolves a map of promises and return a RemixError if any of the promises fail
 *
 * @param {Promise<T>[]} map The map of promises to handle
 * @param {ErrorCode} code The error code to use if any of the promises fail
 *
 * @returns - The results of the promises or a RemixError with the TS_ERRORS and results in the meta
 */
export const promiseMapMayFail =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  async <T, TCode extends keyof TErrors>(
    map: Promise<T>[],
    code: TCode,
    meta: Record<string, unknown> = {},
  ) => {
    const resolved = await Promise.allSettled(map);
    const errors = resolved.filter(
      (item) => item.status === 'rejected' || isError(errorMap)(item.value),
    );
    const results = resolved.filter((item) => item.status === 'fulfilled');

    if (errors.length) {
      return new TSError<TErrors>({
        code,
        meta: { ...meta, errors, results },
        errorMap,
      });
    }

    return results.map(
      (item) => (item as PromiseFulfilledResult<unknown>).value,
    );
  };

export const newError =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  (args: Omit<TSErrorParams<TErrors>, 'errorMap'>) => {
    return new TSError<TErrors>({ ...args, errorMap });
  };
