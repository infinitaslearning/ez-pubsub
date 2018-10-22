const azureSb = require('azure-sb');




const creatSubscriptionListener =  ({ 
    connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
    topic,
    subscription,
    onStop = () => {},
    onMessage = (message) => {},
    onError = (error) => {},
    autocreate = false,
    running = false,
}) => {

    const sb = azureSb.createServiceBusService(connectionString);
    const receiveMessage = async () => new Promise((resolve, reject) => {
        sb.receiveSubscriptionMessage(topic, subscription, (error, result, response) => {
            console.log('listener:', error);
            resolve({ 
                result,
                response,
                error
            });
        })
    })

    const loop = async () => {
        console.log('loop start')
        const { error, result, response } = await receiveMessage();
        console.log('Rece');
        switch(true) {
            case error && error !== 'No messages to receive':
                onError(error);
                break;
            case error === 'No messages to receive':
                console.log('Rece no messagees')
                break; 
            default:
                onMessage(result, response);
                break;
        }
        if (!running) {
            return onStop()
        }
        setImmediate(loop);
    }
    const start = () => {
        running = true;
        loop();
    }

    const stop = () => { 
        running = false; 
    }

    return {
        start,
        stop
    }
}


module.exports = {
    creatSubscriptionListener
}