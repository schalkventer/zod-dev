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
    value: any,
    schema: T
  ): z.infer<T> => {
    if (!condition) return value;
    return schema.parse(value);
  };

  return fn;
};

/**
 * A general purposes abstraction for performing common, immutable CRUD
 * operations on an array of objects. The returned methods automatically perform
 * `devParse` on all inputs and outputs to ensure that both the input and output
 * match the provided schema. All provided methods require the starting array as
 * the first argument.
 *
 * Note that all objects in the array are required to have a unique string `id`
 * property that can be used as a look-up key.
 */
export const createArrayOperations = <T extends Schema>(
  condition: boolean,
  schema: T
) => {
  type Item = z.infer<T>;
  const devParse = createDevParse(condition);

  type Query = string | string[] | ((item: Item) => Item);
  type Operation = (item: Item) => Item;

  const isItems = (items: any) =>
    devParse(items, z.array(schema));

  const getIndices = (
    items: object[],
    query: Query
  ): number[] => {
    if (!items) throw new Error("No items supplied");
    if (!query) throw new Error("No query supplied");

    const inner = isItems(items);

    const queryAsStrings =
      typeof query !== "function" &&
      ((Array.isArray(query)
        ? query
        : [query]) as string[]);

    let result: number[] = [];

    if (queryAsStrings) {
      result = queryAsStrings.map((singleId) => {
        const index = inner.findIndex((singleItem) => {
          singleItem.id === singleId;
        });

        if (index === -1)
          throw new Error(
            `Episode ${singleId} does not exist`
          );
        return index;
      });
    } else {
      const queryAsFunction = query as (item: Item) => Item;
      let count = 0;

      for (const singleItem of inner) {
        if (queryAsFunction(singleItem)) {
          result.push(count);
        }

        count += 1;
      }
    }

    return result;
  };

  const remove = (items: object[], query: Query) => {
    const indices = getIndices(items, query);
    const inner = isItems(items);

    const result = inner.filter((_, index) => {
      return !indices.includes(index);
    });

    return isItems(result);
  };

  return {
    /**
     * Accepts a single `id` string, an array of `id` strings, or a predicate
     * function that will be run on all objects. The array indices for all
     * matching objects will be returned as an array.
     */
    getIndices,

    /**
     * Accepts a single `id` string, an array of `id` strings, or a predicate
     * function that will be run on all objects. All matching objects will be
     * removed from the array.
     */
    remove,

    /**
     * Accepts a single `id` string, an array of `id` strings, or a predicate
     * function that will be run on all objects. All matching objects will be
     * returned as is in a new array.
     */
    get: (items: object[], query: Query): Item[] => {
      const indices = getIndices(items, query);
      const inner = isItems(items);

      const result = indices.map(
        (singleIndex) => inner[singleIndex]
      );

      return isItems(result);
    },

    /**
     * Accepts an single or array of new objects to add to the array. An
     * optional third (`position`) argument can be passed to determine whether
     * the new items should be added to the start or end of the array. By
     * default new values will be added to the end of the array.
     */
    add: (
      items: object[],
      values: object | object[],
      position?: "start" | "end"
    ): Item[] => {
      const inner = isItems(items);

      const valuesAsArray = Array.isArray(values)
        ? values
        : [values];

      if (position === "start") {
        return isItems([...valuesAsArray, ...inner]);
      }

      return isItems([...inner, ...valuesAsArray]);
    },

    /**
     * Loops over all items in the array and runs the provided `operation`
     * callback on them, the result of each function call will be re-assigned
     * in-place. If you only want to run the `operation` function on specific
     * items, you can pass an optional third argument (`query`) that will be
     * used to filter the array before running the `operation` function.
     */
    update: (props: {
      items: object[];
      operation: Operation;
      query?: Query;
    }): Item[] => {
      const { items, operation, query } = props;

      if (!operation)
        throw new Error("No operation supplied");

      const filtered = query ? remove(items, query) : items;

      const result = filtered.map((item) => {
        return operation(item);
      });

      return isItems(result);
    },
  };
};
