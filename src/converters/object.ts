import { AnySchema, ObjectSchema, object } from 'yup';
import { Converter, Converters, QueryOperators } from '../../types';

const objectConverter: Converter = ({
  schema,
  converters,
  fields,
  operators,
  filters,
  path,
}) => {
  // const queryOperators: QueryOperators = {};
  // Object.keys(schema.fields).forEach((fieldName) => {
  //   const converter = converters[schema.type as keyof Converters];
  //   const fieldSchema = schema.fields[fieldName];
  //   queryOperators[fieldName] = converter(fieldSchema, converters);
  // });
  // return object(queryOperators);

  // console.log({ schema });

  Object.keys(schema.fields).forEach((field) => {
    const queryPath = [...path, field];
    const fieldSchema = schema.fields[field];
    const converter = converters[fieldSchema.type as keyof Converters];

    if (['object', 'array'].includes(fieldSchema.type)) {
      return converter({
        schema: fieldSchema,
        path: queryPath,
        converters,
        operators,
        filters,
        fields,
      });
    }

    converter({
      schema: fieldSchema,
      path: queryPath,
      converters,
      operators,
      filters,
      fields,
    });
  });
};

export default objectConverter;
