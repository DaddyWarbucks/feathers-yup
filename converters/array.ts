import { Converter, Meta } from '../types';
import { string, object } from 'yup';
import { convertOperators, convertFilters } from './operators';
// import commonConverter from './common';

const arrayConverter: Converter = ({
  schema,
  converters,
  fields,
  operators,
  filters,
  path,
}) => {
  const fieldSchema = schema.innerType;
  const converter = converters[fieldSchema.type as keyof Converters];

  // console.log({ fieldSchema });

  convertFilters({ schema, filters, operators, path });
  convertOperators({ schema, fields, operators, path });

  if (!fieldSchema) {
    return;
  }

  if (['object', 'array'].includes(fieldSchema.type)) {
    return converter({
      schema: fieldSchema,
      path,
      converters,
      operators,
      filters,
      fields,
    });
  }

  converter({
    schema: fieldSchema,
    // path: [...path, '[]'],
    path,
    converters,
    operators,
    filters,
    fields,
  });
};

export default arrayConverter;
