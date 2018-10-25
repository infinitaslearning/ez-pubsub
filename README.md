## Wrapper around PubSub Messaging

Currently this is implemented over Service Bus - but the backing tech might change.

## Send a message to a topic


```javascript
const { createTopicSender } = require('@liber/ez-pubsub');

const sender = createTopicSender({ topic: 'serial.indexed' });
sender.send({ message: { body: JSON.stringify({ id: '42', name: 'noname')});
```

This autocreates the topic if it does not exist.

Connection string can be passed in or is taken from AZURE_SERVICEBUS_CONNECTION_STRING env


```javascript
const sender = createTopicSender({ connectionString: '{your_connection_string}' });
```

## Start listening for messages on a subscription

```javascript
const { creatSubscriptionListener } = require('@liber/ez-pubsub');

const { start, stop } = creatSubscriptionListener({
    topic: 'serial.indexed',
    subscription: 'page-cache-cleaner',
    onMessage: (m) => console.log(m.body),
    onError: (error) => console.error('Error', error),
    onStop: () => console.log('stopped')
},

});

start();
```
This autocreates both the topic and subscribtion if they dont exist.


Connection string can be passed in or is taken from AZURE_SERVICEBUS_CONNECTION_STRING env
```javascript
const { start, stop } = creatSubscriptionListener({ connectionString: '{your_connection_string}' });
```
