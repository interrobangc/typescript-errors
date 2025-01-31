import type { TSErrorDefinition } from './types.js';

import { describe, it, expect } from 'vitest';
import { init } from './index.js';

const TEST_ERRORS = {
  'test:error': {
    message: 'Test error',
  },
} as const satisfies TSErrorDefinition;

describe('init', () => {
  const { isError, mayFail, newError, promiseMayFail, promiseMapMayFail } =
    init(TEST_ERRORS);
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
    const result = mayFail(() => 'test', 'test:error');
    expect(result).toBe('test');
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
});
