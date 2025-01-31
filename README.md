# ts-errors

Npm package for creating and handling type safe errors in TypeScript.

## Why

There are quite a few other packages out there that do this, but this one is designed to be minimal and easy to understand without a deep grasp of typescript or Functional Programming.

Throwing errors in TypeScript makes it impossible for typescript to infer that a function may throw. This package aims to solve that problem while making it easier to split control flow based on the type of error that bubbles up from underlying code.

## Usage

### Initialize the package

```ts
import { init } from 'ts-errors';

const TS_ERRORS = {
  error: {
    message: 'An error occurred',
    statusCode: 500,
  },
} as const satisfies TSErrorDefinition;

const { isError, mayFail, newError, promiseMayFail, promiseMapMayFail } =
  init(TS_ERRORS);

export { isError, mayFail, newError, promiseMayFail, promiseMapMayFail };
```

### Run something that may fail

```ts
const result = mayFail(() => JSON.parse('{'), 'test:error');

if (isError(result, 'test:error')) {
  // Handle the error if it is a specific error
  console.error(result.message);
} else if (isError(result)) {
  // Handle any other error
  console.error(result.message);
}
```

### Run something async that may fail

```ts
const result = await promiseMayFail(
  fetch('https://api.example.com'),
  'test:error',
);

if (isError(result, 'test:error')) {
  console.error(result.message);
}
```

### Run something async that may fail and return a promise

```ts
const result = await promiseMapMayFail(
  [1, 2, 3].map((n) => fetch(`https://api.example.com/${n}`)),
  'test:error',
);

if (isError(result, 'test:error')) {
  console.error(result.message);
}
```
