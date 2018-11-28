const azure = require('azure-sb');

const noop = async () => {}

const creatSubscriptionListener =  ({ 
    connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
    topic,
    subscription,
    onStop = () => {},
    onMessage = (message) => {},
    onError = (error) => {},
    autoCreate = true,
    defaultAck = false,
    running = false,
}) => {

    const sb = azure.createServiceBusService(connectionString);

    const receiveMessage = async () => new Promise((resolve, reject) => {
        sb.receiveSubscriptionMessage(topic, subscription, 
            { isPeekLock: !defaultAck }, 
            (error, result, response) => {
            resolve({ 
                result,
                response,
                error
            });
        })
    })

    const isEntityExistsError = error => error.statusCode === 409

    const ensureEnvironment = autoCreate 
        ? new Promise((resolve, reject) => {
            sb.createTopicIfNotExists(topic, (error, result, response) => {
                if (error) return reject(error);
                sb.createSubscription(topic, subscription, (error, result, response) => {
                    if (error && !isEntityExistsError(error)) {
                        return reject(error);
                    }
                    resolve(result);
                })
            })
        })
        : Promise.resolve()
    

    const loop = async () => {
        const { error, result, response } = await receiveMessage();
        const ack = defaultAck
            ? noop
            : () => new Promise((resolve, reject) => {
                sb.deleteMessage(result, (error, response) => {
                    if (error) return reject(error);
                    resolve(response)
                })  
            })
        const abandon = defaultAck
            ? noop
            : () => new Promise( (resolve, reject) => {
                sb.unlockMessage(result, (error, response) => {
                    if (error) return reject(error);
                    resolve(response)
                })
            })
        switch(true) {
            case error && error !== 'No messages to receive':
                onError(error);
                break;
            case error === 'No messages to receive':
                break; 
            default:
                onMessage(result, response, { ack, abandon });
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
