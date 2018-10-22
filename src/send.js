const azureSb = require('azure-sb');

const createTopicSender = ({
    connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
    topic,
 }) => {
    const sb = azureSb.createServiceBusService(connectionString);

    // its a run once thing
    const ensureEnvironment = new Promise((resolve, reject) => {
        sb.createTopicIfNotExists(topic, (error, result, response) => {
            if (error) return reject(error);
            resolve(result);
        })
    });
    
    const send = async ({ message }) => {
        await ensureEnvironment;
        return new Promise((resolve, reject) => {
            sb.sendTopicMessage(topic, message, (error, response) => {
                if (error) return reject(error);
                resolve(response);
            })
        })
    }

    return {
        send
    }
}

module.exports = {
    createTopicSender
}