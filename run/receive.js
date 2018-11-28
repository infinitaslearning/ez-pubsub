const { creatSubscriptionListener } = require('../src/receive');

const { start } = creatSubscriptionListener({
  topic: 'dlq-test',
  subscription: 's1',
  autoCreate: false,
  defaultAck: false,
  onMessage: async (m, r, { ack, abandon }) => { // eslint-disable-line
    const { brokerProperties } = m;
    console.log(brokerProperties);
    const ackR = await ack();
    console.log(abandon);
    console.log(ackR.isSuccessful);
  },
  onError: (error) => {
    console.error('Error', error);
  },
  onStop: () => console.log('done'),
});

start();
