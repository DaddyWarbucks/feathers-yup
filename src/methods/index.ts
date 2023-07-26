import type { InferType } from "yup";
import {
  addMethod,
  Schema,
  object,
  objectId,
  number,
  boolean,
  string,
  array,
  tuple,
  StringSchema,
  ObjectSchema,
} from "./yup";

import { convertSchema } from "src/converters";
import { Resolver } from "src/resolver";
import { DataError, QueryError } from "src/errors";

declare module "yup" {
  interface AnySchema<TIn, TContext, TDefault, TFlags> {
    query(operators: any): this;
  }
  interface AnySchema<TIn, TContext, TDefault, TFlags> {
    sort(shouldSort?: boolean): this;
  }
  interface AnySchema<TIn, TContext, TDefault, TFlags> {
    select(shouldSort?: boolean): this;
  }
  interface ObjectSchema<TIn, TContext, TDefault, TFlags> {
    resolvers(resolvers: any): this;
  }
}

// Improve the basic validate() method to supply default params
// that we use most often, as well as customize the error
// TODO: This could be wrapped up better to throw better stack
// traces where the .validateData() method is actually called
addMethod(object, "validateData", function (data, options) {
  const opts = {
    abortEarly: false, // return all errors, not just first
    stripUnknown: true, // remove any props not on schema
    strict: false, // allow transforms and coercions
    ...options,
  };
  const dataSchema = Array.isArray(data) ? array().of(this) : this;
  return dataSchema.validate(data, opts).catch((error) => {
    throw new DataError(error.message, {
      // errors: convertYupError(error),
    });
  });
});

addMethod(object, "validateQuery", function (data, options) {
  const opts = {
    abortEarly: false, // return all errors, not just first
    stripUnknown: true, // remove any props not on schema,
    strict: false, // allow transforms and coercions
    ...options,
  };
  return this.querySchema(opts)
    .validate(data, opts)
    .catch((error) => {
      throw new QueryError(error.message, {
        // errors: convertYupError(error),
      });
    });
});

addMethod(object, "querySchema", function (options) {
  return convertSchema(this, options);
});

addMethod(Schema, "query", function (operators, callback) {
  const query = { ...(this.meta()?.query || {}) };

  if (!operators) {
    query.operators = {};
    return this.meta({ query });
  }

  query.operators = { ...query.operators };

  if (Array.isArray(operators)) {
    operators.forEach((operator) => {
      query.operators[operator] = operator;
    });
  } else {
    query.operators[operators] = callback;
  }

  return this.meta({ query });
});

// addMethod(Schema, "sort", function (shouldShort = true) {
//   // const query = { ...(this.meta()?.query || {}) };
//   // query.sort = shouldShort;
//   // return this.meta({ query });
//   return this.meta({});
// });

addMethod(Schema, "select", function (shouldSelect = true) {
  const query = { ...(this.meta()?.query || {}) };
  query.select = shouldSelect;
  return this.meta({ query });
});

addMethod(Schema, "join", function (as, from, foreignField, schema) {
  const query = { ...(this.meta()?.query || {}) };
  query.join = { ...query.join };
  query.join[as] = {
    as,
    from,
    foreignField,
    schema,
  };
  return this.meta({ query });
});

addMethod(object, "resolvers", function (resolvers) {
  const query = { ...(this.meta()?.query || {}) };
  // query.resolvers = { ...query.resolvers, ...resolvers };
  // resolvers always overwrites instead of merges. This is
  // important for being able to create schemas with new resolvers
  // without having to unset other ones. Its more in line with
  // the immutable nature of yup schemas.
  query.resolvers = resolvers;
  return this.meta({ query });
});

addMethod(object, "resolver", function (data, context) {
  const query = { ...(this.meta()?.query || {}) };
  const resolver = new Resolver(query.resolvers);
  return resolver.resolve(data, context);
});

const unwindObject = ({ query, fields, fieldSchema }) => {
  fields.forEach((field) => {
    const unwindSchema = fieldSchema.fields[field];
    if (unwindSchema) {
      if (unwindSchema.type === "array") {
        unwindArray({ query, fields, fieldSchema });
      } else if (unwindSchema.type === "object") {
        unwindObject({ query, fields, fieldSchema });
      } else {
        query.unwind[field] = {
          // path: path,
          schema: unwindSchema,
        };
      }
    }
  });
};
const unwindArray = ({ query, fields, fieldSchema }) => {
  fields.forEach((field) => {
    const unwindSchema = fieldSchema.innerType;
    if (unwindSchema) {
      if (unwindSchema.type === "array") {
        unwindArray({ query, fields, fieldSchema });
      } else if (unwindSchema.type === "object") {
        unwindObject({ query, fields, fieldSchema });
      } else {
        query.unwind[field] = {
          path: arrayField,
          schema: unwindSchema,
        };
      }
    }
  });
};

addMethod(array, "unwind", function (fields) {
  const query = { ...(this.meta()?.query || {}) };
  query.unwind = { ...query.unwind };
  const fieldSchema = this.innerType;

  if (fieldSchema.type === "object") {
    unwindObject({ query, fields, fieldSchema });
  }

  // if (fieldSchema.type === 'array') {
  // }

  // console.log({ schema });

  // query.unwind = '';

  return this.meta({ query });
});

// addMethod(Schema, 'unwind', function (operators, callback) {
//   const query = { ...(this.meta()?.query || {}) };
//   query.unwind = { ...query.unwind };

//   if (Array.isArray(operators)) {
//     operators.forEach((operator) => {
//       query.unwind[operator] = operator;
//     });
//   } else {
//     query.unwind[operators] = callback;
//   }

//   return this.meta({ query });
// });
