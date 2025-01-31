export type TSErrorDefinitionItem = {
  message: string;
  statusCode?: number;
};

export type TSErrorDefinition = Record<string, TSErrorDefinitionItem>;

// Make the error params generic over the error codes
export type TSErrorParams<TErrors> = {
  errorMap: TErrors;
  cause?: unknown;
  code: keyof TErrors;
  message?: string;
  meta?: Record<string, unknown>;
};
