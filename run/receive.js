const { creatSubscriptionListener } = require('../src/receive');

const { start, stop } = creatSubscriptionListener({
    topic: 'dlq-test',
    subscription: 's1',
    autoCreate: false,
    defaultAck: false,
    onMessage: async (m, r, { ack, abandon }) => {
        console.log('Test subscriber', m, ack, abandon);
        console.log('ack')
        const ackR = await ack();
        console.log(ackR)
    },
    onError: (error) => {
        console.error('Error', error);
    },
    onStop: () => console.log('done')
})

start()
