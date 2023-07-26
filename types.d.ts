import { AnySchema } from 'yup';

export type YupType =
  | 'array'
  | 'boolean'
  | 'date'
  | 'lazy'
  | 'mixed'
  | 'number'
  | 'object'
  | 'string'
  | 'tuple'
  | 'objectId';

export type Converters = Record<YupType, Converter>;
export type Operators = Record<string, Operator>;

export type Converter = ({
  schema: AnySchema,
  converters: Converters,
  operators: Operators,
  filters: Operators,
  fields: QueryFields,
  path: string[],
  types: any
}) => void;

export type Operator = (schema: AnySchema, value: any) => void;

export type Meta = {
  // jsonSchema?: JSONSchema7;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: [string];
  [key: string]: any;
};

export type QueryFields = {
  [key: string]: any;
};

export type OperatorFields = {
  [key: string]: AnySchema;
};

/* This is basically Yup's ResolveOptions type that yup doesn't actually export with `converters` added. */
export type ResolveOptions = {
  value?: unknown;
  parent?: unknown;
  context?: unknown;
  converters?: Converters;
  operators?: Operators;
};
