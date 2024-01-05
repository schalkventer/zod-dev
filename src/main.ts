import { z, Schema } from "zod";

export const withEnv = <T extends Schema>(
  current: T,
  condition: boolean
) => {
  return {
    ...current,

    envParse: (value: any): z.infer<T> => {
      if (!condition) return value;
      return current.parse(value);
    },
  };
};

export const createWithEnv = (condition: boolean) => {
  const fn = <T extends Schema>(current: T) => {
    return {
      ...current,

      envParse: (value: any): z.infer<T> => {
        if (!condition) return value;
        console.log("skip");
        return current.parse(value);
      },
    };
  };

  return fn;
};
