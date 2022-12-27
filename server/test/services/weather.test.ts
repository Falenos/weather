import app from '../../src/app';

describe('\'weather\' service', () => {
  it('registered the service', () => {
    const service = app.service('weather');
    expect(service).toBeTruthy();
  });
});
