## Wrapper around Messaging

Currently this is implemented over Service Bus - but the backing tech might change.

### Send a message to a topic


```javascript
const { createTopicSender } = require('module-service-bus-client');

const sender = createTopicSender({ topic: 'serial.indexed' });
sender.send({ message: { body: JSON.stringify({ id: '42', name: 'noname')});
```

### Start listening for messages on a subscription
```javascript
const { creatSubscriptionListener } = require('module-service-bus-client');

const { start, stop } = creatSubscriptionListener({
    topic: 'serial.indexed',
    subscription: 'page-cache-cleaner',
    onMessage: (m) => console.log(m.body),
    onError: (error) => console.error('Error', error),
},
onStop: resolve
});

start();
```
This autocreates both the topic and subscribtion if they dont exist.



