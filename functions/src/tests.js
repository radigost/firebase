const test = require('firebase-functions-test')();
test.mockConfig({ amplitude: { api_key: process.env.AMPLITUDE_API_KEY } });

const AmplitudeEvent = require('./domain/AmplitudeEvent');
const { logToAmplitude } = require('./amplitude');
const { startSubscriptionForUser } = require('./firebaseService');


// tests
const testActivateSubscription = async () => {
    try {
        await startSubscriptionForUser("1407529623");
    }
    catch (e) {
        console.error("error", e.message);
    }

}

// testActivateSubscription();

const testLogAmplitudeEvent = async () => {
    try {
        logToAmplitude({
            event_type: AmplitudeEvent.pay,
            user_id: 'datamonster@gmail.com',
            revenue: "5000",
            transactionId: 'asdfas',
            amount: "50",
            currency: 'RUB',
            testMode: true
        });
    } catch (error) {
        console.error("error happened", error.message);
    }

}

testLogAmplitudeEvent();

