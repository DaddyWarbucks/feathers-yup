// function _next
import { GeneralError } from "@feathersjs/errors";

export function validateData(schema) {
  return async function validateDataHook(context, next) {
    const _next = () => context;
    next = next || _next;

    if (context.params.schema?.data === null) {
      return next();
    }

    if (context.params.schema?.data) {
      context.data = await context.params.schema.data.validateData(
        context.data,
        { context }
      );
      return next();
    }

    if (!schema) {
      throw new GeneralError(
        `Cannot call hook "validateData" on path ${context.path || ""
        } because it has no schema`
      );
    }

    if (context.method === "patch") {
      schema = schema.pick(Object.keys(context.data));
    }

    context.data = await schema.validateData(context.data, { context });

    return next();
  };
}

export function validateQuery(schema) {
  return async function validateQueryHook(context, next) {
    const _next = () => context;
    next = next || _next;

    if (context.params.schema?.query === null) {
      return next();
    }

    if (context.params.schema?.query) {
      context.params.query = await context.params.query.schema.validateQuery(
        context.params.query,
        { context }
      );
      return next();
    }

    if (!schema) {
      throw new GeneralError(
        `Cannot call hook "validateQuery" on path ${context.path || ""
        } because it has no schema`
      );
    }

    context.params.query = await schema.validateQuery(context.params.query, {
      context: { context },
    });

    return next();
  };
}
