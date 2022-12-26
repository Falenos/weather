import app from '../../src/app';

describe('\'flows\' service', () => {
  it('registered the service', () => {
    const service = app.service('flows');
    expect(service).toBeTruthy();
  });
});
