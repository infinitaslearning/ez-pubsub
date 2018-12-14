#!/usr/bin/env node

require('dotenv').load();


const connectionInfo = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
const fs = require('fs');
const { ensureTopicExists, getTopic, ensureSubscriptionExists, getSubscription } = require('../src/provision');

let configFile = process.cwd();
const params = process.argv.slice(2);

if (params.length > 0) {
  configFile = (fs.existsSync(params[0]) && fs.realpathSync(params.shift())) || process.cwd();
}
if (params.length > 1) return console.log('to many parameters')
const tag = params.pop()
console.log('consfigFile: ', configFile, tag);
const config = require(configFile)

const topicFilter = _ => !tag || (tag && _ === tag)
const createTopics = (topics, topicTemplate) => {
  const topicNameList = Object.keys(topics)
    .filter(topicFilter)
    .map(_ => ({ name: _, config: { ...topicTemplate, ...topics[_] } }))

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
    .filter(_ => !tag || (tag && subscriptions[_].topics.indexOf(tag) >= 0))
    .map(_ => ({ name: _, topics: subscriptions[_].topics.filter(topicFilter), config: { ...subscriptionTemplate, ...subscriptions[_], topics: undefined } }))
    .map(_ => _.topics.map((t) => ({ ..._, topic: t, topics: undefined })))
  )
  return Promise.all(subscriptionNameList.map(_ => ensureSubscriptionExists(_.topic, _.name, _.config, connectionInfo)))
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

