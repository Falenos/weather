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
