const debug = require('debug')('pubsub:receive');
const azure = require('azure-sb');

const noop = async () => {};

const creatSubscriptionListener = ({
  connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING,
  topic,
  subscription,
  onStop = () => {},
  onMessage = async (message) => {}, // eslint-disable-line no-unused-vars
  onError = (error) => {}, // eslint-disable-line no-unused-vars
  autoCreate = false,
  defaultAck = true,
  azureApi = azure,
}) => {
  let running = false;
  const sb = azureApi.createServiceBusService(connectionString);

  const receiveMessage = async () => new Promise((resolve) => {
    debug(`Receiving message in subscription ${subscription} for topic ${topic}`);
    return sb.receiveSubscriptionMessage(
      topic,
      subscription,
      { isPeekLock: !defaultAck },
      (error, result, response) => resolve({ error, result, response }),
    );
  });

  const isEntityExistsError = ({ statusCode }) => statusCode === 409;
  const isNoMessagesError = error => error === 'No messages to receive';


  const acknowledgeMessage = message => () => new Promise((resolve, reject) => {
    debug('Deleting received message...');
    sb.deleteMessage(message, (deleteError, deleteResponse) => {
      if (deleteError) return reject(deleteError);
      return resolve(deleteResponse);
    });
  });

  const abandonMessage = message => () => new Promise((resolve, reject) => {
    debug('Unlocking message...');
    sb.unlockMessage(message, (unlockError, unlockResponse) => {
      if (unlockError) return reject(unlockError);
      return resolve(unlockResponse);
    });
  });

  const ensureEnvironment = autoCreate
    ? new Promise((resolve, reject) => {
      debug(`Ensuring topic ${topic}...`);
      sb.createTopicIfNotExists(topic, (error) => {
        if (error) return reject(error);
        debug('Creating subscription...');
        return sb.createSubscription(topic, subscription, (error2, result) => {
          if (error2 && !isEntityExistsError(error2)) return reject(error2);
          return resolve(result);
        });
      });
    })
    : Promise.resolve();

  const loop = async () => {
    if (!running) {
      return onStop();
    }

    const { error, result, response } = await receiveMessage();

    if (error) {
      if (!isNoMessagesError(error)) {
        onError(error);
      }
      return setImmediate(loop);
    }

    const ack = defaultAck ? noop : acknowledgeMessage(result);
    const abandon = defaultAck ? noop : abandonMessage(result);
    await onMessage(result, response, { ack, abandon });
    return setImmediate(loop);
  };

  const start = async () => {
    debug('Ensuring environment...');
    await ensureEnvironment;
    running = true;
    debug('Starting looping...');
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
