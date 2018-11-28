// this is a utility script to test SB delivery issues

const azureSb = require('azure-sb');

const topic = 'dlq-test';
const cnstr = process.env.AZURE_SERVICEBUS_CONNECTION_STRING
const sb = azureSb.createServiceBusService(cnstr);

const getBodyString = () => {
    let res = '';
    for(let i = 0; i < 25; i++) {
        res += 'A';
    }
    return res;
}

const body = getBodyString();

const send = async () => new Promise((resolve) => {
    sb.sendTopicMessage(topic, { body }, (error, response) => {
        resolve({ error, response })
    })

})

const run = async () => {
    while(true) {
        const { error, response } = await send()
        console.log({ error })
    }
}

run().then(console.log)