const { creatSubscriptionListener } = require('../');

describe('receiving from topic', () => {
  it('can receive', async () => new Promise((resolve) => {
    const { start, stop } = creatSubscriptionListener({
      topic: 'serial.indexed',
      subscription: 'AllMessages',
      onMessage: (m) => {
        console.log('Test subscriber', m.body);
      },
      onError: (error) => {
        console.error('Error', error);
      },
      onStop: resolve,
    });

    setTimeout(() => {
      stop();
    }, 10000);
    return start();
  })).timeout(20000);
});
