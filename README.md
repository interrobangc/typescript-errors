# typescript-errors

TypeScript library for creating and handling type safe errors without the use of throw statements.

## Why?

There are quite a few other packages out there that solve the same problem as this one, but they are all a bit complex and hard to understand without a deep grasp of typescript or Functional Programming.

This package is designed so that the highly opinionated pattern is as simple to understand as possible while still being type safe and easy to use.

### The Problem

Throwing errors in TypeScript makes it impossible for typescript to infer that a function may throw. This package aims to solve that problem while making it easier to split control flow based on the type of error that bubbles up from underlying code.

### The Solution

Stop throwing errors. Instead, we use a few simple functions to wrap our code and handle errors in a type safe way. When you call a function that may fail, you can check the result to see if it is an error or not. If you try to access data returned from a function that may fail, you will be forced to handle the error case first. This leads to a much more robust and type safe codebase.

Under the hood we still use an extended Error class so that the error can be used like a normal error if needed.

## How

### The Functions

The pattern is based around 2 main function types:

#### May fail functions

These are helper functions that wrap your code and return an error if something goes wrong. There are 3 convenience functions for these:

- `mayFail` - A function that takes a function and returns an error if the function throws.
- `promiseMayFail` - A function that takes a promise and returns an error if the promise rejects.
- `promiseMapMayFail` - A function that takes an array of promises and returns an array of errors if any of the promises reject.

#### Is Error

The `isError()` function is a type guard that takes a value and returns true if the value is an error. It accepts an optional error code to check against so that you can handle errors differently based on the error code that bubbles up.

The `throwIfError()` function will throw the error if the value is a typescript error. It accepts an optional error code to throw so that you can handle errors differently based on the error code that bubbles up. There are times when you actually want to throw an error and this is the function to use.

#### Utility functions

The `newError()` function creates a new typescript error class. This is useful if you need to create an error without calling a mayFail function.

## Basic Usage

### Initialize the package using your error codes and messages

```ts
import type { TSErrorDefinition } from 'typescript-errors';
import { init } from 'typescript-errors';

// Define your error codes and messages
const TS_ERRORS = {
  error: {
    message: 'An error occurred',
    statusCode: 400, // Optional, defaults to 500
  },
} as const satisfies TSErrorDefinition;

const {
  isError,
  mayFail,
  newError,
  promiseMayFail,
  promiseMapMayFail,
  throwIfError,
} = init(TS_ERRORS);

export {
  isError,
  mayFail,
  newError,
  promiseMayFail,
  promiseMapMayFail,
  throwIfError,
};
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

## Error Bubbling

If you use a mayFail function and the underlying function returns a typescript error, that error will be returned instead of the error you provided. The error you provided will only be returned if the underlying function throws.

```ts
const TS_ERRORS = {
  'test:error': {
    message: 'Test error',
    statusCode: 400,
  },
  'test:error:somethingElse': {
    message: 'Something else went wrong',
    statusCode: 403,
  },
} as const satisfies TSErrorDefinition;

const {
  isError,
  mayFail,
  newError,
  promiseMayFail,
  promiseMapMayFail,
  throwIfError,
} = init(TS_ERRORS);

const result = mayFail(() => {
  return newError({ code: 'test:error:somethingElse' });
}, 'test:error');

console.dir(result, { depth: null }); // { code: 'test:error:somethingElse', message: 'Something else went wrong', statusCode: 403 }
```

## Dynamic error messages

The message for an error can be a function. This allows you to create errors with dynamic messages.

```ts
const TS_ERRORS = {
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
} = init(TS_ERRORS);

const result = mayFail(() => {
  throw newError({
    code: 'test:error:functionMessage',
    meta: { customText: 'custom text' },
  });
}, 'test:error:functionMessage');

console.error(result.message); // "Test error from function test:error:functionMessage custom text"
```

## The TSError object

The TSError object is a custom error class that extends the native Error class. It is used to create errors that can be used like a normal error if needed.

It includes the following properties:

- `cause`: The original error that caused the error to be thrown which includes the stack trace
- `code`: The error code
- `message`: The error message
- `statusCode`: The HTTP status code
- `meta`: The error meta data

The TSError object is not intended to be used directly. Instead, you should use the `newError` function to create errors if you need to create an error without calling a mayFail function.

```ts
const error = newError({
  code: 'test:error',
  message: 'Test error',
  statusCode: 400,
  meta: { customText: 'custom text' },
});
```
