// @ts-check
const azureSb = require('azure-sb');

const getSb = connectionInfo => azureSb.createServiceBusService(connectionInfo);

const ensureTopicExists = (topic, options, connectionInfo) => {
  const sb = getSb(connectionInfo);
  return new Promise((resolve, reject) => {
    sb.createTopicIfNotExists(topic, options, (error, success, response) => {
      if (error) return reject(error);
      return resolve({ success, response });
    });
  });
};

const ensureSubscriptionExists = (topic, subscription, options, connectionInfo) => {
  const sb = getSb(connectionInfo);
  return new Promise((resolve) => {
    sb.createSubscription(topic, subscription, options, (error, result, response) => {
      resolve({ result, response });
    });
  });
};

const getTopic = topic => new Promise((r, e) => {
  getSb().getTopic(topic, (error, result) => {
    if (error) return e(error);
    return r(result);
  });
});

const getSubscription = (topic, subscription) => new Promise((r, e) => {
  getSb().getSubscription(topic, subscription, (error, result) => {
    if (error) return e(error);
    return r(result);
  });
});


const getRules = (topic, subscription) => new Promise((r, e) => {
  getSb().listRules(topic, subscription, (error, result) => {
    if (error) return e(error);
    return r(result);
  });
});

const ensureTopicDeleted = (topic, connectionInfo) => {
  const sb = getSb(connectionInfo);
  const operation = new Promise((resolve, reject) => {
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
