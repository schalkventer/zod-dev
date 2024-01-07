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
 * Creates a custom `withDev` that automatically includes the condition. This
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
 * more flexibility since it is not bound to a specific schema.
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
 * A general purpose abstraction for performing common, immutable CRUD
 * operations on a collection of objects (in an array). The returned methods
 * automatically perform `devParse` on all inputs and outputs to ensure that
 * both the input and output match the provided schema. All methods require the
 * collection itself as the first argument, and returns an new instance of the
 * collection with the modifications.
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

  const isCollection = (value: any) =>
    devParse(value, z.array(schema));

  const getIndices = (
    collection: object[],
    query: Query
  ): number[] => {
    if (!collection)
      throw new Error("No collection supplied");
    if (!query) throw new Error("No query supplied");

    const inner = isCollection(collection);

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

  const remove = (collection: object[], query: Query) => {
    const indices = getIndices(collection, query);
    const inner = isCollection(collection);

    const result = inner.filter((_, index) => {
      return !indices.includes(index);
    });

    return isCollection(result);
  };

  return {
    /**
     * Determines whether the provided value is an array of objects that match
     * the provided schema.
     */
    isCollection,

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
    get: (collection: object[], query: Query): Item[] => {
      const indices = getIndices(collection, query);
      const inner = isCollection(collection);

      const result = indices.map(
        (singleIndex) => inner[singleIndex]
      );

      return isCollection(result);
    },

    /**
     * Accepts an single or array of new objects to add to the array. An
     * optional third (`position`) argument can be passed to determine whether
     * the new collection should be added to the start or end of the array. By
     * default new values will be added to the end of the array.
     */
    add: (
      collection: object[],
      values: object | object[],
      position?: "start" | "end"
    ): Item[] => {
      const inner = isCollection(collection);

      const valuesAsArray = Array.isArray(values)
        ? values
        : [values];

      if (position === "start") {
        return isCollection([...valuesAsArray, ...inner]);
      }

      return isCollection([...inner, ...valuesAsArray]);
    },

    /**
     * Loops over a collection and runs the provided `operation` callback on
     * each item, the result of each function call will be re-assigned in-place.
     * If you only want to run the `operation` function on specific items, you
     * can pass an optional third argument (`query`) that will be used to filter
     * the array before running the `operation` function.
     */
    update: (
      collection: object[],
      operation: Operation,
      query?: Query
    ): Item[] => {
      if (!operation)
        throw new Error("No operation supplied");

      const filtered = query
        ? remove(collection, query)
        : collection;

      const result = filtered.map((item) => {
        return operation(item);
      });

      return isCollection(result);
    },
  };
};
