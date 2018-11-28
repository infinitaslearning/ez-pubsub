const azure = require('azure-sb');

const noop = async () => {};

const creatSubscriptionListener = ({
  connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
  topic,
  subscription,
  onStop = () => {},
  onMessage = (message) => {}, // eslint-disable-line no-unused-vars
  onError = (error) => {}, // eslint-disable-line no-unused-vars
  autoCreate = true,
  defaultAck = true,
}) => {
  let running = false;
  const sb = azure.createServiceBusService(connectionString);

  const receiveMessage = async () => new Promise((resolve) => {
    sb.receiveSubscriptionMessage(topic, subscription,
      { isPeekLock: !defaultAck },
      (error, result, response) => {
        resolve({
          result,
          response,
          error,
        });
      });
  });

  const isEntityExistsError = error => error.statusCode === 409;

  const ensureEnvironment = autoCreate
    ? new Promise((resolve, reject) => {
      sb.createTopicIfNotExists(topic, (error) => {
        if (error) return reject(error);
        return sb.createSubscription(topic, subscription, (error2, result) => {
          if (error2 && !isEntityExistsError(error)) {
            return reject(error);
          }
          return resolve(result);
        });
      });
    })
    : Promise.resolve();


  const loop = async () => {
    const { error, result, response } = await receiveMessage();
    const ack = defaultAck
      ? noop
      : () => new Promise((resolve, reject) => {
        sb.deleteMessage(result, (deleteError, deleteResponse) => {
          if (deleteError) return reject(deleteError);
          return resolve(deleteResponse);
        });
      });
    const abandon = defaultAck
      ? noop
      : () => new Promise((resolve, reject) => {
        sb.unlockMessage(result, (unlockError, unlockResponse) => {
          if (unlockError) return reject(unlockError);
          return resolve(unlockResponse);
        });
      });
    switch (true) {
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
      return onStop();
    }
    return setImmediate(loop);
  };
  const start = async () => {
    await ensureEnvironment;
    running = true;
    loop();
  };

  const stop = () => {
    running = false;
  };

  return {
    start,
    stop,
  };
};


module.exports = {
  creatSubscriptionListener,
};
