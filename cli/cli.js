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
if (params.length > 1) return console.log('to many parameters');
const tag = params.pop();
console.log(`consfigFile: ${configFile}, tag: ${tag}`);
const config = require(configFile);

const createTopics = (topics, topicTemplate) => {
	const topicFilter = topic => !tag || (tag && topic === tag);
	const topicNameList = Object.keys(topics)
		.filter(topicFilter)
		.map(topic => ({ name: topic.replace('${LIBER_ENV}', envName), config: { ...topicTemplate, ...topics[topic] } }));

	const topicPromise = topicNameList.map(topic => ensureTopicExists(topic.name, topic.config, connectionInfo));
	return Promise.all(topicPromise)
		.then(() => {
			console.log('Topic(s) creation was a success');
		})
		.catch(error => {
			console.error('Topic(s) creation failed.');
			console.error(error);
		});
};

const createSubscription = (subscriptions, subscriptionTemplate) => {
	const subscriptionFilter = subscription => !tag || (tag && subscriptions[subscription].topic !== tag);
	const subscriptionNameList = Object.keys(subscriptions || {})
		.filter(subscriptionFilter) // filter subscription by topic tag if tag exists
		.map(subscription => ({
			name: subscription.replace('${LIBER_ENV}', envName),
			topic: subscriptions[subscription].topic.replace('${LIBER_ENV}', envName),
			config: { ...subscriptionTemplate, ...subscriptions[subscription], topic: undefined },
		})); //prepare subscription obejct

	return Promise.all(
		subscriptionNameList.map(subscription => {
			return ensureSubscriptionExists(subscription.topic, subscription.name, subscription.config, connectionInfo);
		}),
	);
};

const setupServiceBus = async () => {
	try {
		await createTopics(config.serviceBus.topics, config.serviceBus.topicCreate_Template);
		console.log('Success setting up Topics');
		await createSubscription(config.serviceBus.subscriptions, config.serviceBus.subscriptionCreate_Template);
		console.log('Success setting up Subscriptions');
	} catch (error) {
		console.error('Failed setting up Azure Service Bus', error);
	}
};

if (config && config.serviceBus) {
	setupServiceBus();
} else {
	console.error('invalid config file');
}
