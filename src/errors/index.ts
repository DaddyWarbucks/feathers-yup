import { FeathersError } from "@feathersjs/errors";

export class DataError extends FeathersError {
  constructor(message, data) {
    super(message, "validation-error", 420, "DataError", data);
  }
}

export class QueryError extends FeathersError {
  constructor(message, data) {
    super(message, "query-error", 422, "QueryError", data);
  }
}

// TODO: Update this to make it exactly the same as Formik
// on clients: https://github.com/jaredpalmer/formik/blob/3242489e0cd7b68bad16494b749e43129a2cadbd/src/Formik.tsx#L680
// export const convertYupError = (yupError) => {
//   if (!yupError.inner || yupError.inner.length === 0) {
//     return {
//       [yupError.path]: yupError.message
//     };
//   }
//   return yupError.inner.reduce((errors, error) => {
//     errors[error.path] = error.message;
//     return errors;
//   }, {});
// };
