const { creatSubscriptionListener }= require('../src/receive');

const { start, stop } = creatSubscriptionListener({
    topic: 'serial.indexed',
    subscription: 'AllMessages',
    onMessage: (m) => {
        console.log('Test subscriber', m.body);
    },
    onError: (error) => {
        console.error('Error', error);
    },
    onStop: () => console.log('done')
})

start()
