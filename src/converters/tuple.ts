import { Converter } from '../../types';
import { convertOperators, convertFilters } from './operators';

const tupleConverter: Converter = ({
  schema,
  fields,
  operators,
  filters,
  path,
}) => {
  convertFilters({ schema, filters, operators, path });
  convertOperators({ schema, fields, operators, path });
};

export default tupleConverter;
