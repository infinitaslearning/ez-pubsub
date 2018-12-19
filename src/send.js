const azureSb = require('azure-sb');

const createTopicSender = ({
  connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
  topic,
  autoCreate = false,
  azure = azureSb,
}) => {
  const sb = azure.createServiceBusService(connectionString);

  // its a run once thing
  const ensureEnvironment = autoCreate ? new Promise((resolve, reject) => {
    sb.createTopicIfNotExists(topic, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
  }) : Promise.resolve();

  const send = async ({ message }) => {
    await ensureEnvironment;

    return new Promise((resolve, reject) => {
      sb.sendTopicMessage(topic, message, (error, response) => {
        if (error) return reject(error);
        return resolve(response);
      });
    });
  };

  return {
    send,
  };
};

module.exports = {
  createTopicSender,
};
