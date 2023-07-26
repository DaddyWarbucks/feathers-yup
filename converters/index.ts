import {
  AnySchema,
  object,
  number,
  array,
  string,
  ValidationError,
  ObjectSchema,
  AnyObjectSchema,
} from 'yup';
import { Converters, ResolveOptions, QueryFields, Operators } from '../types';
import stringConverter from './string';
import numberConverter from './number';
import booleanConverter from './boolean';
import objectIdConverter from './objectId';
import dateConverter from './date';
import arrayConverter from './array';
import objectConverter from './object';
import tupleConverter from './tuple';
import mixedConverter from './mixed';
// import lazyConverter from './lazy';
import { defaultOperators, defaultFilters } from './operators';

type QuerySchema<T extends object> = ObjectSchema<T>;

export function convertSchema<T extends object, K extends keyof T>(
  schema: AnyObjectSchema,
  options?: ResolveOptions
): QuerySchema<T> {
  const { converters, operators, throwUnknown, ...resolveOptions } =
    options || {};
  const fields: QueryFields = {};

  const allConverters: Converters = {
    string: stringConverter,
    number: numberConverter,
    boolean: booleanConverter,
    objectId: objectIdConverter,
    date: dateConverter,
    array: arrayConverter,
    object: objectConverter,
    tuple: tupleConverter,
    mixed: mixedConverter,
    // lazy: lazyConverter,
    ...converters,
  };

  const allOperators: Operators = {
    ...defaultOperators,
    ...operators,
  };

  const filters = {
    sort: {},
    select: {},
    join: {},
    unwind: {},
  };

  objectConverter({
    converters: allConverters,
    operators: allOperators,
    schema,
    fields,
    path: [],
    filters,
  });

  // console.log({ filters });
  const dataFields = { ...fields };

  fields.$and = array().of(object(dataFields));
  fields.$or = array().of(object(dataFields));

  const sortFields = {};
  Object.keys(filters.sort)
    .filter((key) => filters.sort[key])
    .forEach((key) => {
      sortFields[key] = number().oneOf([1, -1]);
    });
  if (Object.keys(sortFields).length) {
    fields.$sort = object(sortFields).default(undefined);
  }

  const selectFields = Object.keys(filters.select).filter(
    (key) => filters.select[key]
  );
  if (selectFields.length) {
    fields.$select = array()
      .of(string().oneOf(selectFields))
      .max(selectFields.length);
  }

  Object.entries(filters.join).forEach(([joinKey, join]) => {
    const joinSchema = convertSchema(join.schema, options).omit([
      '$and',
      '$or',
    ]);
    Object.entries(joinSchema.fields).forEach(([key, schema]) => {
      fields[`${joinKey}.${key}`] = schema;
    });
  });

  Object.entries(filters.unwind).forEach(([unwindKey, unwind]) => {
    // console.log({ unwindKey, unwind });
  });

  if (throwUnknown) {
    // TODO: Use feilds to determine if there is
    // unknown keys
  }

  // const querySchema = object(fields).test(
  //   'unknown',
  //   'Cannot use unknown field',
  //   function (query) {
  //     const errors = [];
  //     console.log({ query });
  //     Object.keys(query).forEach((queryField) => {
  //       if (!fields[queryField]) {
  //         errors.push(`${queryField} is an unknown field`);
  //       }
  //     });

  //     console.log({ errors });

  //     if (errors.length) {
  //       return new ValidationError(errors);
  //     }

  //     return true;
  //   }
  // );

  return object(fields) as QuerySchema<T & Record<K, any>>;
}
