#!/usr/bin/env node

/* eslint-disable */

require('dotenv').load();
const fs = require('fs');
const { ensureTopicExists, ensureSubscriptionExists } = require('../src/provision');

const connectionInfo = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
const envName = process.env.LIBER_ENV || 'development';
let configFile = process.cwd();
const params = process.argv.slice(2);

if (params.length > 0) {
	configFile = (fs.existsSync(params[0]) && fs.realpathSync(params.shift())) || process.cwd();
}
if (params.length > 1) {
	throw new Error('too many parameters');
}
const tag = params.pop();
console.log(`configFile: ${configFile}, tag: ${tag}`);
const config = require(configFile);
const topicFilter = topic => !tag || (tag && topic === tag);

const createTopics = (topics, topicTemplate) => {
	const topicNameList = Object.keys(topics)
		.filter(topicFilter)
		.map(topic => ({
			name: topic.replace('${LIBER_ENV}', envName),
			config: { ...topicTemplate, ...topics[topic].config },
		}));

	const topicsPromises = topicNameList.map(topic => ensureTopicExists(topic.name, topic.config, connectionInfo));
	return Promise.all(topicsPromises);
};

const createSubscription = (topics, subscriptionTemplate) => {
	const subscriptionMap = ({ name, config, topic }) => ({
		name,
		topic: topic.replace('${LIBER_ENV}', envName),
		config: { ...subscriptionTemplate, ...config, topic: undefined },
	});

	const subscriptionNameList = Object.keys(topics || {})
		.filter(topicFilter)
		.reduce((subscriptions, topic) => {
			return subscriptions.concat(
				...Object.keys(topics[topic].subscriptions || {}).map(subscription =>
					subscriptionMap({ name: subscription, config: topics[topic][subscription], topic }),
				),
			);
		}, []);

	const subscriptionsPromises = subscriptionNameList.map(subscription =>
		ensureSubscriptionExists(subscription.topic, subscription.name, subscription.config, connectionInfo),
	);

	return Promise.all(subscriptionsPromises);
};

const setupServiceBus = async () => {
	try {
		await createTopics(config.serviceBus.topics, config.serviceBus.topicCreate_Template);
		console.log('Success setting up Topics');
		await createSubscription(config.serviceBus.topics, config.serviceBus.subscriptionCreate_Template);
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
