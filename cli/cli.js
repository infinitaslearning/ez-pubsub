#!/usr/bin/env node

require('dotenv').load();
const fs = require('fs');
const { ensureTopicExists, getTopic, ensureSubscriptionExists, getSubscription } = require('../src/provision');

const connectionInfo = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
const envName = process.env.LIBER_ENV || 'development';
let configFile = process.cwd();
const params = process.argv.slice(2);

if (params.length > 0) {
  configFile = (fs.existsSync(params[0]) && fs.realpathSync(params.shift())) || process.cwd();
}
if (params.length > 1) return console.log('to many parameters')
const tag = params.pop()
console.log(`consfigFile: ${configFile}, tag: ${tag}`);
const config = require(configFile)

const topicFilter = _ => !tag || (tag && _ === tag)
const createTopics = (topics, topicTemplate) => {
  const topicNameList = Object.keys(topics)
    .filter(topicFilter)
    .map(_ => ({ name: _.replace('${LIBER_ENV}', envName), config: { ...topicTemplate, ...topics[_] } }))

  const topicPromis = topicNameList.map(_ => ensureTopicExists(_.name, _.config, connectionInfo))
  return Promise.all(topicPromis)
    .then(async (data) => {
      console.log('Success created topic(s)')
    })
    .catch((error) => {
      console.error('Topic(s) create faild.')
      console.error(error)
    })
}

const createSubscription = (subscriptions, subscriptionTemplate) => {
  const subscriptionNameList = [].concat(...Object.keys(subscriptions)
    .filter(_ => !tag || (tag && subscriptions[_].topic !== tag))  // filter subscription by topic tag if tag exists
    .map(_ => ({
      name: _.replace('${LIBER_ENV}', envName),
      topic: subscriptions[_].topic.replace('${LIBER_ENV}', envName),
      config: { ...subscriptionTemplate, ...subscriptions[_], topic: undefined }
    })) //prepare subscription obejct
  )
  return Promise.all(subscriptionNameList.map(_ => {return ensureSubscriptionExists(_.topic, _.name, _.config, connectionInfo)}))
}

const setupServiceBus = async () => {
  try {
    await createTopics(config.serviceBus.topics, config.serviceBus.topicCreate_Template);
    console.log('Success setup Topics')
    await createSubscription(config.serviceBus.subscriptions, config.serviceBus.subscriptionCreate_Template)
    console.log('Success setup Subscriptions')
  } catch (error) {
    console.error('Faild setup Azure Service Bus', error)
  }
}

if (config && config.serviceBus) {
  setupServiceBus()
}
else {
  console.error('invalid config file')
}

