// Make the error params generic over the error codes
export type TSErrorParams<TErrors> = {
  errorMap: TErrors;
  cause?: unknown;
  code: keyof TErrors;
  message?: string;
  meta?: Record<string, unknown>;
  statusCode?: number;
};

export type TSErrorDefinitionMessageFnArgs = Omit<
  TSErrorParams<unknown>,
  'errorMap' | 'code'
> & {
  code: string | number | symbol;
};

export type TSErrorDefinitionMessageFn = (
  args: TSErrorDefinitionMessageFnArgs,
) => string | undefined | null;

export type TSErrorDefinitionItem = {
  message: string | TSErrorDefinitionMessageFn;
  statusCode?: number;
};

export type TSErrorDefinition = Record<string, TSErrorDefinitionItem>;
