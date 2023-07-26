import { array, object, lazy, mixed, types, string } from '../yup';
import { Operators, OperatorFields } from '../../types';

export const defaultOperators: Operators = {
  $in: (schema, value) => {
    const operatorSchema = types[schema.type];
    return array().of(operatorSchema());
  },
  $nin: (schema, value) => {
    const operatorSchema = types[schema.type];
    return array().of(operatorSchema());
  },
  $gt: (schema, value) => {
    const operatorSchema = types[schema.type];
    return operatorSchema();
  },
  $lt: (schema, value) => {
    const operatorSchema = types[schema.type];
    return operatorSchema();
  },
  $eq: (schema, value) => {
    const operatorSchema = types[schema.type];
    if (schema.type === 'tuple') {
      return operatorSchema([string(), string()]);
    }
    return operatorSchema();
  },
  $iLike: (schema, value) => {
    const operatorSchema = types[schema.type];
    return operatorSchema();
  },
};

export const defaultFilters = ['$select', '$sort'];

const convertFilter = ({ schema, operators, path, fields }) => {
  const query = schema.meta().query;
};

const isPOJO = (obj) => {
  return typeof obj === 'object' && obj !== null && obj.constructor === Object;
};

export const convertFilters = ({ schema, path, operators, filters }) => {
  const query = schema.meta()?.query || {};
  const queryJoins = query.join || {};
  const unwindOperators = query.unwind || {};
  const queryKey = path.join('.');

  filters.sort[queryKey] = query.sort || false;
  filters.select[queryKey] = query.select || false;

  Object.keys(queryJoins).forEach((operator) => {
    filters.join[operator] = {
      ...queryJoins[operator],
      localField: queryKey,
    };
  });

  Object.entries(unwindOperators).forEach(([field, config]) => {
    // const unwindPath = [...path];
    // console.log({ queryKey, path, field, fieldSchema, schema });
    const key = `${queryKey}.[].${field}`;
    // const key = queryKey;
    // console.log({ queryKey, config });
    filters.unwind[key] = {
      path,
      field,
      // schema: fieldSchema,
    };
  });
};

export const convertOperators = ({ schema, fields, operators, path }) => {
  const query = schema.meta()?.query || {};
  const queryOperators = query.operators || {};
  const unwindOperators = query.unwind || {};
  const operatorFields: OperatorFields = {};
  const queryKey = path.join('.');

  Object.entries(queryOperators).forEach(([operatorKey, operatorFn]) => {
    if (typeof operatorFn === 'string') {
      const operatorConverter = operators[operatorFn];
      if (operatorConverter) {
        operatorFields[operatorKey] = lazy((value) => {
          return operatorConverter(schema, value);
        });
        return;
      }
      throw new Error(`Unknown operator ${operatorFn}`);
    }
    operatorFields[operatorKey] = lazy((value) => operatorFn(schema, value));
  });

  // console.log({ unwindOperators });

  // Object.entries(unwindOperators).forEach(([operatorKey, operatorFn]) => {
  //   // console.log({ operatorKey, operatorFn });
  //   const unwindKey = `${queryKey}.[]`;
  //   console.log({ unwindKey });
  //   if (typeof operatorFn === 'string') {
  //     const operatorConverter = operators[operatorFn];
  //     if (operatorConverter) {
  //       operatorFields[unwindKey] = lazy((value) => {
  //         return operatorConverter(schema, value);
  //       });
  //       return;
  //     }
  //     throw new Error(`Unknown operator ${operatorFn}`);
  //   }
  //   operatorFields[unwindKey] = lazy((value) => operatorFn(schema, value));
  // });

  // console.log(queryKey, operatorFields);

  if (!Object.keys(operatorFields).length) {
    // return mixed().strip();
    return;
  }

  fields[queryKey] = lazy((value) => {
    if (isPOJO(value)) {
      return object(operatorFields).default(undefined);
    }
    if (operatorFields.$eq) {
      return operatorFields.$eq;
    }
    if (value === undefined) {
      return mixed().strip();
    }
    return mixed().test(
      'queryKey',
      `Must be an object with { ${Object.keys(operatorFields).join(
        ', '
      )} } keys. To query by equality, use the "$eq" option like schema.query(["$eq"])`,
      () => {
        return false;
      }
    );
  });
};
