import app from '../../src/app';

describe("'devices' service", () => {
  it('registered the service', () => {
    const service = app.service('devices');
    expect(service).toBeTruthy();
  });
});
