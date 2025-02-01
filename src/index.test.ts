import type { TSErrorDefinition } from './types.js';

import { describe, it, expect } from 'vitest';
import { init } from './index.js';

const TEST_ERRORS = {
  'test:error': {
    message: 'Test error',
  },
} as const satisfies TSErrorDefinition;

describe('init', () => {
  const {
    isError,
    mayFail,
    newError,
    promiseMayFail,
    promiseMapMayFail,
    throwIfError,
  } = init(TEST_ERRORS);
  it('newError should be able to create a new error', () => {
    const error = newError({ code: 'test:error' });
    expect(error.message).toEqual('Test error');
    expect(isError(error, 'test:error')).toBe(true);
  });

  it('newError should fail typescript on unknown code', () => {
    // @ts-expect-error - This should now fail typescript compilation
    newError({ code: 'unknown:error' });
    expect(true).toBe(true);
  });

  it('mayFail should return the result of the function if it does not throw', () => {
    const result = mayFail(() => ({ id: 1, name: 'test' }), 'test:error');

    if (isError(result)) {
      throw new Error('test');
    }

    expect(result).toEqual({ id: 1, name: 'test' });
    expect(result.name).toEqual('test');
    expect(result.id).toEqual(1);
    // @ts-expect-error - This should now fail typescript compilation
    expect(result.doesNotExist).toBeUndefined();
  });

  it('mayFail should return an error if the function throws', () => {
    const result = mayFail(() => {
      throw new Error('test');
    }, 'test:error');
    expect(isError(result, 'test:error')).toBe(true);
  });

  it('mayFail type should fail typescript on unknown code', () => {
    // @ts-expect-error - This should now fail typescript compilation
    mayFail(() => 'test', 'unknown:error');
    expect(true).toBe(true);
  });

  it('promiseMayFail should return the result of the promise if it does not throw', async () => {
    const result = await promiseMayFail(Promise.resolve('test'), 'test:error');
    expect(result).toBe('test');
  });

  it('promiseMayFail should return an error if the promise fails', async () => {
    const result = await promiseMayFail(
      Promise.reject(new Error('test')),
      'test:error',
    );
    expect(isError(result, 'test:error')).toBe(true);
  });

  it('promiseMayFail type should fail typescript on unknown code', async () => {
    await promiseMayFail(
      Promise.resolve('test'),
      // @ts-expect-error - This should now fail typescript compilation
      'unknown:error',
    );
    expect(true).toBe(true);
  });

  it('promiseMapMayFail should return the result of the promise if it does not throw', async () => {
    const result = await promiseMapMayFail(
      [1, 2, 3].map((n) => Promise.resolve(n)),
      'test:error',
    );
    expect(result).toEqual([1, 2, 3]);
  });

  it('promiseMapMayFail should return an error if any of the promises fails', async () => {
    const result = await promiseMapMayFail(
      [1, 2, 3].map((n) => (n === 2 ? Promise.reject(n) : Promise.resolve(n))),
      'test:error',
    );

    expect(isError(result, 'test:error')).toBe(true);
  });

  it('promiseMapMayFail type should fail typescript on unknown code', async () => {
    await promiseMapMayFail(
      [1, 2, 3].map((n) => Promise.resolve(n)),
      // @ts-expect-error - This should now fail typescript compilation
      'unknown:error',
    );
    expect(true).toBe(true);
  });

  it('promiseMapMayFail should fail typescript on bad map type', async () => {
    // @ts-expect-error - This should now fail typescript compilation
    await promiseMapMayFail([1, 2, 3], 'test:error');
    expect(true).toBe(true);
  });

  it('throwIfError should throw an error if the promise fails', async () => {
    const fn = () =>
      throwIfError(
        promiseMayFail(Promise.reject(new Error('test')), 'test:error'),
      );
    expect(fn).rejects.toThrowError('Test error');
  });

  it('throwIfError should not throw an error if the promise succeeds', async () => {
    const fn = () =>
      throwIfError(promiseMayFail(Promise.resolve('test'), 'test:error'));
    expect(fn).not.toThrow();
  });
});
