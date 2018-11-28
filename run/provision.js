const {
    ensureSubscriptionExists,
    ensureTopicDeleted,
    ensureTopicExists,
    getRules,
    getSubscription,
    getTopic,
 } = require('../src/provision');

async function run() {
    const topic = 'dlq-test';
    const sub = 's1';
    await ensureTopicDeleted(topic);
    await ensureTopicExists(topic, {
        EnableDeadLetteringOnMessageExpiration: true,
        EnableDeadLetteringOnFilterEvaluationExceptions: true,
    });
    await ensureSubscriptionExists(topic, sub, {
        LockDuration: 'PT30S',
        DefaultMessageTimeToLive: 'PT30M',
        DeadLetteringOnMessageExpiration: false,
    })

    const t = await getTopic(topic)
    console.log(t)
    const s = await getSubscription(topic, sub);
    const rs = await getRules(topic, sub);
    console.log(s)
    console.log(rs)

}


run().then(console.log)