# typescript-errors

TypeScript library for creating and handling type safe errors without the use of throw statements.

## Why

There are quite a few other packages out there that do this, but this one is designed to be minimal and easy to understand without a deep grasp of typescript or Functional Programming.

Throwing errors in TypeScript makes it impossible for typescript to infer that a function may throw. This package aims to solve that problem while making it easier to split control flow based on the type of error that bubbles up from underlying code.

This pattern forces you to handle any possible errors at each level of the call stack before trying to access the result of the function.

## Basic Usage

### Initialize the package

```ts
import type { TSErrorDefinition } from 'typescript-errors';
import { init } from 'typescript-errors';

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
const result = mayFail(() => {
  const data = JSON.parse(someJson);
  return {
    id: data.id,
    name: data.name,
  };
}, 'test:error');

if (isError(result, 'test:error')) {
  // Handle a specific error differently than other errors
  console.error(result.message);
  return result; // bubble up the error
} else if (isError(result)) {
  // Handle any other error
  console.error(result.message);
  return result; // bubble up the error
}

// Typescript will correctly infer the result type and throw an error if you try
// to access properties without checking the error type first
console.log(result);
```

### Run something async that may fail

```ts
const result = await promiseMayFail(
  fetch('https://api.example.com'),
  'test:error',
);

if (isError(result, 'test:error')) {
  // Handle a specific error differently than other errors
  console.error(result.message);
  return result; // bubble up the error
} else if (isError(result)) {
  // Handle any other error
  console.error(result.message);
  return result; // bubble up the error
}

// Typescript will correctly infer the result type and throw an error if you try
// to access properties without checking the error type first
console.log(result);
```

### Run something async that may fail and return a promise

```ts
const ids = [1, 2, 3];
const result = await promiseMapMayFail(
  ids.map((n) => fetch(`https://api.example.com/${n}`)),
  'test:error',
);

if (isError(result, 'test:error')) {
  // Handle a specific error differently than other errors
  console.error(result.message);
  return result; // bubble up the error
} else if (isError(result)) {
  // Handle any other error
  console.error(result.message);
  console.dir(result.meta.error, { depth: null }); // Can access error information for items that errored
  console.dir(result.meta.results, { depth: null }); // Can access results for items that succeeded
  return result; // bubble up the error
}

// Typescript will correctly infer the result type and throw an error if you try
// to access properties without checking the error type first
console.log(result);
```

### Sometimes you actually WANT to throw (like in a top level remix route)

```ts
const result = await throwIfError(
  promiseMayFail(Promise.reject(new Error('test')), 'test:error'),
);
```
