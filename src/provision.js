// @ts-check
const debug = require('debug')('pubsub:provision');
const azureSb = require('azure-sb');

const getSb = connectionInfo => azureSb.createServiceBusService(connectionInfo);

const ensureTopicExists = (topic, options, connectionInfo) => {
  const sb = getSb(connectionInfo);
  return new Promise((resolve, reject) => {
    debug(`Ensuring topic ${topic}`);
    sb.createTopicIfNotExists(topic, options, (error, success, response) => {
      if (error) return reject(error);
      return resolve({ success, response });
    });
  });
};

const ensureSubscriptionExists = (topic, subscription, options, connectionInfo) => {
  const sb = getSb(connectionInfo);
  return new Promise((resolve, reject) => {
    debug(`Creating subscription ${subscription} for topic ${topic}`);
    return sb.createSubscription(topic, subscription, options, (error, result, response) => {
      // TODO check on errorStatus === 409 so its just a duplicate - and no error
      if (error && error.statusCode !== 409) return reject(error);
      return resolve({ result, response, error });
    });
  });
};

const getTopic = (topic, connectionInfo) => new Promise((resolve, reject) => {
  debug(`Getting topic info for ${topic}`);
  getSb(connectionInfo).getTopic(topic, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });
});

const getSubscription = (topic, subscription, connectionInfo) => new Promise((resolve, reject) => {
  debug(`Getting subscription ${subscription} for topic ${topic}`);
  getSb(connectionInfo).getSubscription(topic, subscription, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });
});

const getRules = (topic, subscription) => new Promise((resolve, reject) => {
  debug(`Getting rules for topic ${topic}`);
  getSb().listRules(topic, subscription, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });
});

const ensureTopicDeleted = (topic, connectionInfo) => {
  const sb = getSb(connectionInfo);
  const operation = new Promise((resolve, reject) => {
    debug(`Deleting topic ${topic}`);
    sb.deleteTopic(topic, (error, response) => {
      if (error && response.statusCode !== 404) {
        return reject(error);
      }
      return resolve({ response });
    });
  });
  return operation;
};

module.exports = {
  ensureTopicExists,
  ensureSubscriptionExists,
  ensureTopicDeleted,
  getTopic,
  getSubscription,
  getRules,
};
