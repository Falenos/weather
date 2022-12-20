export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_URL: string;
      NODE_ENV: 'development' | 'production';
    }
  }
}
