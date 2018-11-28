const { createTopicSender }= require('../src/send');
const shortid = require('shortid');

describe('sending to topics', () => {
    it('can send', async () => {
        const sender = createTopicSender({ topic: 'serial.indexed' });


        const sends = []
        for(var i = 0; i < 10; i++) {
            await sender.send({ message: { body: JSON.stringify({ i, rnd: shortid() }) }})
        }
    }).timeout(30000)

})
