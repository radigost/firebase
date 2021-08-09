const format = require('date-fns/format');
const AmplitudeEvent = require('../domain/AmplitudeEvent');
const { logToAmplitude, logPaymentToAmplitude, logFailToAmplitude, logRefundToAmplitude, logRecurrentToAmplitude } = require('./amplitude');

const Currency = require('../domain/Currency');
const SubscriptionStatus = require('../domain/SubscriptionStatus');

//  tests - amplitude
const testLogAmplitudeEvent = async () => {
    try {
        logToAmplitude({
            event_type: AmplitudeEvent.pay,
            user_id: 'datamonster@gmail.com',
            revenue: "5000",
            transactionId: 'asdfas',
            amount: "50",
            currency: 'RUB',
            testMode: true,
            DateTime:"2020-05-21 05:30:59"
        });
    } catch (error) {
        console.error("error happened", error.message);
    }

}

const testLogPaymentToAmplitude = () => {
    const event = {
        AccountId: "datamonster@gmail.com",
        Amount: Math.random()*1000,
        TransactionId: "sadf434wsa",
        TestMode: "1",
        Currency: Currency.RUB,
        DateTime: format(new Date,"yyyy-MM-dd HH:mm:ss"),
        Data:{
            utm_source:"random_utm_source",
            utm_campaign:"random_utm_campain",
            utm_medium:"random_utm_medium",
            productId:"inkognito_product_id"
        }
    }
    logPaymentToAmplitude(event);
}

const testLogFailToAmplitude = () => {
    const event = {
        AccountId: "datamonster@gmail.com",
        TransactionId: "sadf434wsa",
        TestMode: "1",
        Currency: Currency.RUB,
        Reason: "Unsufficient Funds",
        DateTime:"2020-05-21 05:30:59"

    }
    logFailToAmplitude(event);
}

const testLogRefundToAmplitude = () => {
    const event = {
        Amount: "1690",
        AccountId: "datamonster@gmail.com",
        TransactionId: "sadf434wsa",
        DateTime:"2020-05-21 05:30:59"
    }
    logRefundToAmplitude(event);
}


const testLogRecurrentToAmplitude = () => {
    const eventActive = {
        AccountId: "datamonster@gmail.com",
        TransactionId: "sadf434wsa",
        Status: SubscriptionStatus.active,
        SuccessfulTransactionsNumber: 4,
        Currency:Currency.RUB,
        DateTime:"2020-05-21 05:30:59"
    }
    logRecurrentToAmplitude(eventActive);

    const eventCancelled = {
        AccountId: "datamonster@gmail.com",
        TransactionId: "sadf434wsa",
        Status: SubscriptionStatus.cancelled,
        SuccessfulTransactionsNumber: 4,
        Currency:Currency.RUB,
        DateTime:"2020-05-21 05:30:59",

    }
    logRecurrentToAmplitude(eventCancelled);

    const eventRejected = {
        AccountId: "datamonster@gmail.com",
        TransactionId: "sadf434wsa",
        Status: SubscriptionStatus.Expired,
        SuccessfulTransactionsNumber: 4,
        Currency:Currency.RUB,
        DateTime:"2020-05-21 05:30:59"
    }
    logRecurrentToAmplitude(eventRejected);
}

// testActivateSubscription();
// testLogAmplitudeEvent();
testLogPaymentToAmplitude();
// testLogFailToAmplitude();
// testLogRefundToAmplitude();
// testLogRecurrentToAmplitude();
