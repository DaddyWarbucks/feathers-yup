import {
  Schema,
  object,
  string,
  array,
  number,
  date,
  boolean,
  mixed,
  lazy,
  tuple,
} from 'yup';
import { ObjectId } from 'bson';
// import * as yup from 'yup';
// console.log(yup);

export * from 'yup';

class ObjectIdSchema extends Schema {
  constructor(options) {
    super({
      ...options,
      type: 'objectId',
      check: (value) => {
        if (typeof value === 'number') {
          return false;
        }
        return ObjectId.isValid(value);
      },
    });

    this.withMutation((schema) => {
      schema.transform(function (value, originalValue) {
        if (this.isType(value)) {
          return new ObjectId(value);
        }
        return originalValue;
      });
    });
  }
}

export const objectId = () => new ObjectIdSchema();

export const types = {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  objectId,
  string,
  tuple,
  lazy,
};
