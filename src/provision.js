// @ts-check
const azureSb = require('azure-sb');

const getSb = () => azureSb.createServiceBusService()

const ensureTopicExists = (topic, options, connectionInfo) => {
    const sb = getSb()
    return new Promise((resolve, reject) => {
        sb.createTopicIfNotExists(topic, options, (error, success, response) => {
            if (error) return reject(error);
            resolve({ success, response })
        })
    })
}

const ensureSubscriptionExists = (topic, subscription, options, connectionInfo) => {
    const sb = getSb()
    return new Promise((resolve, reject) => {
        sb.createSubscription(topic, subscription, options, (error, result, response) => {
            resolve({ result, response })
        })
    })
}

const getTopic = (topic) => {
    return new Promise( (r, e) => {
        getSb().getTopic(topic, (error, result) => {
            if (error) return e(error)
            r(result)
        })
    })
}

const getSubscription = (topic, subscription) => {
    return new Promise( (r, e) => {
        getSb().getSubscription(topic, subscription, (error, result) => {
            if (error) return e(error)
            r(result)
        })
    })
}


const getRules = (topic, subscription) => {
    return new Promise( (r, e) => {
        getSb().listRules(topic, subscription, (error, result, response) => {
            if (error) return e(error)
            r(result)
        })
    })
}

const ensureTopicDeleted = (topic, connectionInfo) => {
    const sb = getSb();
    const operation = new Promise((resolve, reject) => {
        sb.deleteTopic(topic, (error, response) => {
            if (error && response.statusCode != 404) {
                return reject({ error, response});
            }
            resolve({ response })
        })
    })
    return operation;
}

module.exports = {
    ensureTopicExists,
    ensureSubscriptionExists,
    ensureTopicDeleted,
    getTopic,
    getSubscription,
    getRules,
}

