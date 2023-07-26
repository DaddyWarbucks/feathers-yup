const roleSchema = object({ name: string().query(["$eq"]) });

const userSchema = object({
  id: objectId(),
  role_id: objectId().query(["$eq"]).join("role", "roles", "id", roleSchema),
  name: string().query(["$iLike", "$eq"]),
}).default(undefined);

const postSchema = object({
  id: objectId(),
  title: string().select().sort().query(["$iLike"]),
  body: string(),
  user_id: objectId().query(["$eq"]).join("user", "users", "id", userSchema),
  comments: array(
    object({
      user_id: objectId().join("comments.user", "users", "id", userSchema),
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

console.log("PostSchema: ", postSchema.fields);
console.log("PostQuerySchema: ", postQuerySchema.fields);

const mySchema = () => {
  return object({ name: string() });
};

const mySchemaInstance = mySchema();

type MySchema = InferType<typeof mySchemaInstance>;

type Post = InferType<typeof postSchema>;
type PostQuery = InferType<typeof postQuerySchema>;

const things: MySchema = { name: "" };

const query: PostQuery = {
  // $select: ['id'],
  // title: { $iLike: 'Blog' },
  // body: 'Blog',
  "user.name": "Bob",
};

const query2: PostQuery = { title: "1232" };

const data: Post = {
  // title: 'The Blog Title',
  id: "507f1f77bcf86cd799439011",
  title: "The Blog Title",
  body: "The Blog Body",
  user_id: "507f1f77bcf86cd799439011",
  comments: [
    {
      user_id: "507f1f77bcf86cd799439011",
      message: "This is cool",
    },
    {
      user_id: "507f1f77bcf86cd799439011",
      message: "This is lame",
    },
  ],
};

postSchema
  .resolver(data, { method: "create" })
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
