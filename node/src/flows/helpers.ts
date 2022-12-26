export const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const retryUntil = async <T>(
  fn: () => Promise<T>,
  check: (obj: T) => boolean,
  shouldStop: (obj: T) => boolean = () => false,
  maxBackOff = 60 * 60 * 1000 // 60 minutes
): Promise<T> => {
  let isOk;
  let result;
  let tries = 1;
  let delayMs = (2 ** ++tries + Math.random()) * 1000;
  await delay(delayMs);
  result = await Promise.resolve(fn());
  isOk = await Promise.resolve(check(result));
  while (isOk === false && delayMs < maxBackOff) {
    if (tries < 10) {
      // Use exponential increase for the first 10 tries
      delayMs = (2 ** ++tries + Math.random()) * 1000;
    } else {
      // After reaching 10 tries increase the delay by a constant amount
      delayMs += 15 * 60 * 1000; // 15 minutes
    }
    await delay(delayMs);
    result = await Promise.resolve(fn());
    isOk = await Promise.resolve(check(result));
    if (await Promise.resolve(shouldStop(result))) {
      throw 'Stopped based on result';
    }
  }
  if (isOk) {
    return result;
  } else {
    throw 'Retries limit reached.';
  }
};

export const getRandomNumberBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const createRequestData = (
  data: {
    SellerId: string;
    MWSAuthToken: string;
    [x: string]: any;
  },
  array: any[] = [],
  path = ''
): any => {
  let moreFields = {};
  if (array.length && path) {
    moreFields = array.reduce((prev, curr, i) => {
      return {
        ...prev,
        [`${path}.${i + 1}`]: curr,
      };
    }, {});
  }

  return {
    ...data,
    ...moreFields,
  };
};

// Utility function that that convert objects from PascalCase to camelCase
export const toCamel = (o: Record<string, any>): Record<string, any> => {
  let newO: Record<string, any>, origKey, newKey, value;
  if (o instanceof Array) {
    return o.map((value) => {
      if (typeof value === 'object') {
        value = toCamel(value);
      }
      return value;
    });
  } else {
    newO = {};
    for (origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString();
        value = o[origKey];
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value);
        }
        newO[newKey] = value;
      }
    }
  }
  return newO;
};
