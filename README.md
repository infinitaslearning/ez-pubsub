## Wrapper around PubSub Messaging

Currently this is implemented over Service Bus - but the backing tech might change.

## Send a message to a topic


```javascript
const { createTopicSender } = require('@liber/ez-pubsub');

const sender = createTopicSender({ topic: 'serial.indexed' });
sender.send({ message: { body: JSON.stringify({ id: '42', name: 'noname')});
```

This auto creates the topic if it does not exist.

Connection string can be passed in or is taken from AZURE_SERVICEBUS_CONNECTION_STRING env


```javascript
const sender = createTopicSender({ connectionString: '{your_connection_string}' });
```

## Start listening for messages on a subscription with auto ack
By default messages are acked (accepted and signaled as processed) by the receive REST call itself (before our handler code executes)

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
This auto creates both the topic and subscription if they dont exist.


## Deliberate Acking and Abandoning
If we want control over unreadable messages or redeliveries on a recoverable error we need to set `defaultAck: false` and do a call towards `ack` or `abandon` in the message handler. 

```javascript
const { creatSubscriptionListener } = require('@liber/ez-pubsub');

const { start, stop } = creatSubscriptionListener({
    topic: 'serial.indexed',
    subscription: 'page-cache-cleaner',
    defaultAck: false,
    onMessage: async (message, _, { ack, abandon }) => {
        // if all went well, you need to ack() - this will remove the message
        const ackResult = await ack()

        // if there was an error (recoverable or not) you can abandon the message
        // and it will be redelivered up to 10 times after which the message goes to DLQ
        // The same happens if ack isn't called withon LockTimeout - that is configurable on the subscription
        const abandonResult = await abandon()
    }
    onError: (error) => console.error('Error', error),
    onStop: () => console.log('stopped')
},

});

start();
```

Connection string can be passed in or is taken from AZURE_SERVICEBUS_CONNECTION_STRING env
```javascript
const { start, stop } = creatSubscriptionListener({ connectionString: '{your_connection_string}' });
```
