import type {
  TSErrorDefinition,
  TSErrorDefinitionMessageFnArgs,
} from './types.js';

import { describe, it, expect } from 'vitest';
import { init } from './index.js';

const TEST_ERRORS = {
  'test:error': {
    message: 'Test error',
    statusCode: 400,
  },
  'test:error:functionMessage': {
    message: (args: TSErrorDefinitionMessageFnArgs) =>
      `Test error from function ${String(args.code)} ${String(args.meta?.customText)}`,
    statusCode: 400,
  },
} as const satisfies TSErrorDefinition;

const {
  isError,
  mayFail,
  newError,
  promiseMayFail,
  promiseMapMayFail,
  throwIfError,
} = init(TEST_ERRORS);

describe('init', () => {
  it('type should fail if not a TSErrorDefinition', () => {
    init({
      // @ts-expect-error - This should now fail typescript compilation
      'test:error': {},
    });
    expect(true).toBe(true);
  });
});

describe('newError', () => {
  it('newError should be able to create a new error', () => {
    const error = newError({ code: 'test:error' });
    expect(error.message).toEqual('Test error');
    expect(isError(error, 'test:error')).toBe(true);
    expect(error.statusCode).toEqual(400);
  });

  it('newError should fail typescript on unknown code', () => {
    // @ts-expect-error - This should now fail typescript compilation
    newError({ code: 'unknown:error' });
    expect(true).toBe(true);
  });
});

describe('mayFail', () => {
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
    expect(result.statusCode).toEqual(400);
  });

  it('mayFail type should fail typescript on unknown code', () => {
    // @ts-expect-error - This should now fail typescript compilation
    mayFail(() => 'test', 'unknown:error');
    expect(true).toBe(true);
  });

  it('mayFail should return an error with a custom message', () => {
    const result = mayFail(
      () => {
        throw new Error('test');
      },
      'test:error:functionMessage',
      {
        customText: 'custom text',
      },
    );
    if (isError(result, 'test:error:functionMessage')) {
      expect(result.message).toEqual(
        'Test error from function test:error:functionMessage custom text',
      );
    }
  });
});

describe('promiseMayFail', () => {
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
    expect(result.statusCode).toEqual(400);
  });
});

describe('promiseMapMayFail', () => {
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

  it('promiseMapMayFail should return the results of complex types if they do not throw', async () => {
    const users = [
      {
        id: 1,
        name: 'test1',
      },
      {
        id: 2,
        name: 'test2',
      },
      {
        id: 3,
        name: 'test3',
      },
    ];
    const res = await promiseMapMayFail(
      users.flatMap(async (user) => {
        if (user.id > 5) {
          return newError({ code: 'test:error', message: 'Test error' });
        }

        return {
          user,
        };
      }),
      'test:error',
    );

    if (isError(res)) {
      throw res;
    }

    expect(res.filter((r) => !isError(r) && r.user.id === 2)).toEqual([
      {
        user: {
          id: 2,
          name: 'test2',
        },
      },
    ]);
  });

  it('promiseMapMayFail should return an error if any of the promises fails', async () => {
    const result = await promiseMapMayFail(
      [1, 2, 3].map((n) => (n === 2 ? Promise.reject(n) : Promise.resolve(n))),
      'test:error',
    );

    expect(isError(result, 'test:error')).toBe(true);
    if (isError(result, 'test:error')) {
      expect(result.statusCode).toEqual(400);
    }
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
});

describe('throwIfError', () => {
  it('throwIfError should throw an error if the promise fails', async () => {
    const fn = () =>
      throwIfError(
        promiseMayFail(Promise.reject(new Error('test')), 'test:error'),
      );
    expect(fn).rejects.toThrowError('Test error');
    if (isError(fn)) {
      expect(fn.statusCode).toEqual(400);
    }
  });

  it('throwIfError should not throw an error if the promise succeeds', async () => {
    const fn = () =>
      throwIfError(promiseMayFail(Promise.resolve('test'), 'test:error'));
    expect(fn).not.toThrow();
  });
});
