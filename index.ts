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
  InferType,
  StringSchema,
  ObjectSchema,
} from './yup';

import { convertSchema } from './converters';
import { Resolver } from './resolver.ts';

declare module 'yup' {
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

// class Schema {
//   constructor() {}

//   validateData() {}
//   validateQuery() {}
//   pick() {}
//   omit() {}
//   shape() {}
// }

addMethod(Schema, 'query', function (operators, callback) {
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

addMethod(object, 'validateQuery', function (query, options) {
  return convertSchema(this).validate(query, options);
});

addMethod(Schema, 'sort', function (shouldShort = true) {
  // const query = { ...(this.meta()?.query || {}) };
  // query.sort = shouldShort;
  // return this.meta({ query });
  return this.meta({});
});

addMethod(Schema, 'select', function (shouldSelect = true) {
  const query = { ...(this.meta()?.query || {}) };
  query.select = shouldSelect;
  return this.meta({ query });
});

addMethod(Schema, 'join', function (as, from, foreignField, schema) {
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

addMethod(object, 'resolvers', function (resolvers) {
  const query = { ...(this.meta()?.query || {}) };
  // query.resolvers = { ...query.resolvers, ...resolvers };
  // resolvers always overwrites instead of merges. This is
  // important for being able to create schemas with new resolvers
  // without having to unset other ones. Its more in line with
  // the immutable nature of yup schemas.
  query.resolvers = resolvers;
  return this.meta({ query });
});

addMethod(object, 'resolver', function (data, context) {
  const query = { ...(this.meta()?.query || {}) };
  const resolver = new Resolver(query.resolvers);
  return resolver.resolve(data, context);
});

const unwindObject = ({ query, fields, fieldSchema }) => {
  fields.forEach((field) => {
    const unwindSchema = fieldSchema.fields[field];
    if (unwindSchema) {
      if (unwindSchema.type === 'array') {
        unwindArray({ query, fields, fieldSchema });
      } else if (unwindSchema.type === 'object') {
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
      if (unwindSchema.type === 'array') {
        unwindArray({ query, fields, fieldSchema });
      } else if (unwindSchema.type === 'object') {
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

addMethod(array, 'unwind', function (fields) {
  const query = { ...(this.meta()?.query || {}) };
  query.unwind = { ...query.unwind };
  const fieldSchema = this.innerType;

  if (fieldSchema.type === 'object') {
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

const roleSchema = object({ name: string().query(['$eq']) });

const userSchema = object({
  id: objectId(),
  role_id: objectId().query(['$eq']).join('role', 'roles', 'id', roleSchema),
  name: string().query(['$iLike', '$eq']),
}).default(undefined);

const postSchema = object({
  id: objectId(),
  title: string().select().sort().query(['$iLike']),
  body: string(),
  user_id: objectId().query(['$eq']).join('user', 'users', 'id', userSchema),
  comments: array(
    object({
      user_id: objectId().join('comments.user', 'users', 'id', userSchema),
      message: string(),
    })
  ),
})
  // .resolvers({
  //   user: function (data, context) {
  //     console.log('resolving');
  //     return {
  //       id: '507f1f77bcf86cd799439011',
  //       name: 'Bob',
  //     };
  //   },
  // })
  .default(undefined);

const postQuerySchema = convertSchema(postSchema)
  .shape({
    // $skip: number().min(0).integer().label('Skip'),
    // $limit: number().min(0).max(100).integer().label('Limit'),
  })
  .default(undefined);

console.log('PostSchema: ', postSchema.fields);
console.log('PostQuerySchema: ', postQuerySchema.fields);

const mySchema = () => {
  return object({ name: string() });
};

const mySchemaInstance = mySchema();

type MySchema = InferType<typeof mySchemaInstance>;

type Post = InferType<typeof postSchema>;
type PostQuery = InferType<typeof postQuerySchema>;

const things: MySchema = { name: '' };

const query: PostQuery = {
  // $select: ['id'],
  // title: { $iLike: 'Blog' },
  // body: 'Blog',
  'user.name': 'Bob',
};

const query2: PostQuery = { title: '1232' };

const data: Post = {
  // title: 'The Blog Title',
  id: '507f1f77bcf86cd799439011',
  title: 'The Blog Title',
  body: 'The Blog Body',
  user_id: '507f1f77bcf86cd799439011',
  comments: [
    {
      user_id: '507f1f77bcf86cd799439011',
      message: 'This is cool',
    },
    {
      user_id: '507f1f77bcf86cd799439011',
      message: 'This is lame',
    },
  ],
};

postSchema
  .resolver(data, { method: 'create' })
  .then((result) => {
    console.log({ result });
  })
  .catch((error) => {
    console.error(error);
    console.log(error.inner);
    console.log(error.stack);
  });

postSchema
  .validate(data, { stripUnknown: true, abortEarly: false })
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
    console.log(error.inner);
    console.log(error.stack);
  });

console.log({ query });

postSchema
  .validateQuery(query, { stripUnknown: true, abortEarly: false })
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
    console.log(error.inner);
    console.log(error.stack);
  });

// console.log(postSchema);
// console.log(querySchema(baseSchema));
