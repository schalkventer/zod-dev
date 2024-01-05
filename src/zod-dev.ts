import { z, Schema } from "zod";

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

export const createWithDev = (condition: boolean) => {
  const fn = <T extends Schema>(current: T) => {
    return {
      ...current,

      devParse: (value: any): z.infer<T> => {
        if (!condition) return value;
        console.log("skip");
        return current.parse(value);
      },
    };
  };

  return fn;
};
