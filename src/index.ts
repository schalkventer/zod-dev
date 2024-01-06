import { z, Schema } from "zod";

/**
 * A functional mixin that adds the `.devParse` method to an existing Zod
 * schema.
 */
export const withDev = <T extends Schema>(
  current: T,
  condition: boolean
) => {
  return {
    ...current,

    devParse: (value: any): z.infer<T> => {
      if (!condition) return value;
      return current.parse(value);
    },
  };
};

/**
 * create a custom `withDev` that automatically includes the condition. This
 * means that you don't need to manually pass the condition each time you create
 * a schema.
 */
export const createWithDev = (condition: boolean) => {
  const fn = <T extends Schema>(current: T) => {
    return {
      ...current,

      devParse: (value: any): z.infer<T> => {
        if (!condition) return value;
        return current.parse(value);
      },
    };
  };

  return fn;
};

/**
 * Similar to `createWithDev`, however instead creates `devParse` as a
 * stand-alone function that accepts any value and schema. This provides a bit
 * more flexibility since it is not bound to a specific schema:
 */
export const createDevParse = (condition: boolean) => {
  const fn = <T extends Schema>(
    schema: T,
    value: any
  ): z.infer<T> => {
    if (!condition) return value;
    return schema.parse(value);
  };

  return fn;
};
