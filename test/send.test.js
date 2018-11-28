const shortid = require('shortid');
const { createTopicSender } = require('../src/send');

describe('sending to topics', () => {
  it('can send', async () => {
    const sender = createTopicSender({ topic: 'serial.indexed' });

    for (let i = 0; i < 10; i++) {
      await sender.send({ message: { body: JSON.stringify({ i, rnd: shortid() }) } });
    }
  }).timeout(30000);
});
