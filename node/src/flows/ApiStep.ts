import { Step } from '@lib/Step';
import { StepDependencies } from '@models';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import bunyan from 'bunyan';
import merge from 'lodash/merge';
import { delay, retryUntil } from './helpers';

export abstract class ApiStep<U extends StepDependencies, K> extends Step<U, K> {
  protected apiBaseUrl = 'https://wxm-api-mock.herokuapp.com/api/v1';
  protected profileId?: string;
  protected log!: bunyan;
  protected apiLog!: bunyan;
  private axiosInstance!: AxiosInstance;
  protected fetch!: (arg0: AxiosRequestConfig) => Promise<AxiosResponse<any>>;

  protected baseBeforeHooks = [
    (): void => {
      this.axiosInstance = this.makeInstance();
      this.fetch = this.makeCallWrapper();
    },
  ];

  private makeInstance() {
    return axios.create({
      baseURL: this.apiBaseUrl,
      method: 'get',
      headers: {
        charset: 'UTF-8',
      },
    });
  }

  private makeCallWrapper() {
    return async (options: AxiosRequestConfig): Promise<AxiosResponse<any>> => {
      const callConfig = merge({}, this.axiosInstance.defaults, options);
      this.apiLog.fields = { ...this.log.fields };
      this.apiLog.fields.requestOptions = options;
      try {
        return await this.axiosInstance(callConfig);
      } catch (error: Error | AxiosError | any) {
        if (error.response) {
          this.apiLog.fields.responseStatus = error.response.status;
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status < 500) {
            try {
              await delay(1000);
              return await this.axiosInstance(callConfig);
            } catch (error) {
              this.apiLog.error('Retry failed');
              throw 'Retry failed';
            }
          }
          if (error.response.status >= 500) {
            try {
              this.apiLog.warn('Triggering RetryUntil for 5xx error');
              return await retryUntil(
                () => {
                  this.apiLog.warn('RetryUntil for 5xx error attempt');
                  return this.axiosInstance(callConfig);
                },
                (res) => res.status < 300,
                undefined,
                55 * 60 * 1000
              );
            } catch (error) {
              this.apiLog.error('Retries after 5xx failed');
              throw 'Retries after 5xx failed';
            }
          }
          this.apiLog.error('Generic response error for unhandled status code');
          throw 'Generic response error for unhandled status code';
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          this.apiLog.fields.responseStatus = null;
          this.apiLog.error('Generic request error');
          throw 'Generic request error';
        } else {
          // Something happened in setting up the request that triggered an Error
          this.apiLog.fields.responseStatus = null;
          this.apiLog.error('Generic error');
          throw 'Generic error';
        }
      }
    };
  }

  // Metadata about this step
  // Any value here will be saved in the DB for this step.
  protected get meta(): any {
    return undefined;
  }

  // Utility function that defaults data to array
  protected normaliseToArray = (data: any = []): any => {
    if (!Array.isArray(data)) return [data];
    return data;
  };

  async run(...args: [U]): Promise<K> {
    this.log = bunyan.createLogger({
      name: this.logName || this.name,
    });
    this.apiLog = bunyan.createLogger({
      name: 'API_LOG',
    });
    return super.run(...args);
  }
}
