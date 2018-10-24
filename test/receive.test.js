const { creatSubscriptionListener }= require('../src/receive');

xdescribe('receiving from topic', () => {
    it('can receive', async () => {
        return new Promise( (resolve, reject) => {
            const { start, stop } = creatSubscriptionListener({
                topic: 'serial.indexed',
                subscription: 'AllMessages',
                onMessage: (m) => {
                    console.log('Test subscriber', m.body);
                },
                onError: (error) => {
                    console.error('Error', error);
                },
                onStop: resolve
            })
            setTimeout(()  => {
                stop();
            }, 10000)
            return start();
        })

    }).timeout(20000)

})
