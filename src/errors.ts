import type {
  TSErrorDefinition,
  TSErrorParams,
  TSErrorDefinitionMessageFnArgs,
} from './types.js';

const isErrorCode =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  <TCode extends keyof TErrors>(code: unknown): code is TCode => {
    return Object.keys(errorMap).includes(code as string);
  };

const getErrorMessage =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  (args: TSErrorDefinitionMessageFnArgs): string => {
    const { code, message } = args;
    if (message) {
      return message;
    }

    if (isErrorCode(errorMap)(code)) {
      const messageOrFn = errorMap[code]?.message;
      if (typeof messageOrFn === 'function') {
        return messageOrFn(args) ?? code;
      }
      return messageOrFn ?? code;
    }

    return code as unknown as string;
  };

const getStatusCode =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  <TCode extends keyof TErrors>(code: TCode, statusCode?: number): number => {
    return statusCode ?? errorMap[code]?.statusCode ?? 500;
  };

export type TSErrorType<TErrors extends TSErrorDefinition> = TSError<TErrors>;

/**
 * A custom error class so that we can add a code, cause, and meta data.
 *
 * We extend the base Error class because folks know how to deal with them and they include a stack trace.
 *
 * We change the call signature to include a code, cause, and meta data.
 *
 * The code is a string that represents the error. It should be unique and descriptive.
 * The message will be pulled from the TS_ERRORS constant.
 *
 * THIS CLASS SHOULD NEVER BE USED DIRECTLY.
 */
export class TSError<TErrors extends TSErrorDefinition> extends Error {
  message: string;
  code: keyof TErrors;
  cause?: unknown;
  statusCode?: number;
  meta: Record<string, unknown>;

  constructor({
    errorMap,
    cause,
    code,
    message,
    meta,
    statusCode,
  }: TSErrorParams<TErrors>) {
    super();
    this.code = code;
    this.message = getErrorMessage(errorMap)({
      code,
      message,
      meta,
      statusCode,
    });
    this.cause = cause;
    this.meta = meta ?? {};
    this.statusCode = getStatusCode(errorMap)(code, statusCode);
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
  ): Promise<TSError<TErrors> | T[]> => {
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

    return results.map((item) => (item as PromiseFulfilledResult<T>).value);
  };

export const throwIfError =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  async <T>(target: Promise<T>, code?: keyof TErrors) => {
    const res = await target;
    if (isError(errorMap)(res, code)) throw res;
    return res as Exclude<Awaited<T>, TSError<TErrors>>;
  };

export const throwErrorResponseIfError =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  async <T>(target: Promise<T>, code?: keyof TErrors) => {
    const res = await target;
    if (isError(errorMap)(res, code))
      throw new Response(res.message, {
        status: res.statusCode ?? 500,
      });
    return res as Exclude<Awaited<T>, TSError<TErrors>>;
  };

export const newError =
  <TErrors extends TSErrorDefinition>(errorMap: TErrors) =>
  (args: Omit<TSErrorParams<TErrors>, 'errorMap'>) => {
    return new TSError<TErrors>({ ...args, errorMap });
  };
