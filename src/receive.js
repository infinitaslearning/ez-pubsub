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
            resolve({ 
                result,
                response,
                error
            });
        })
    })

    const isEntityExistsError = error => error.statusCode === 409

    const ensureEnvironment = new Promise((resolve, reject) => {
        sb.createTopicIfNotExists(topic, (error, result, response) => {
            if (error) return reject(error);
            sb.createSubscription(topic, subscription, (error, result, response) => {
                if (error && !isEntityExistsError(error)) {
                    return reject(error);
                }
                resolve(result);
            })
        })
    });
    

    const loop = async () => {
        const { error, result, response } = await receiveMessage();
        switch(true) {
            case error && error !== 'No messages to receive':
                onError(error);
                break;
            case error === 'No messages to receive':
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
    const start = async () => {
        await ensureEnvironment;
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
