const functions = require('firebase-functions');
const Currency = require('./domain/Currency');
const Amplitude = require('@amplitude/node');
const key = functions.config().amplitude.api_key
const amplitudClient = Amplitude.init(key);
const getUnixTime = require('date-fns/getUnixTime');
const parse = require('date-fns/parse');

const AmplitudeEvent = require('./domain/AmplitudeEvent');
const SubscriptionStatus = require('./domain/SubscriptionStatus');
const CONVERSION_RATE = 70;

const logToAmplitude = ({
    user_id,
    event_type,
    transactionId,
    amount,
    currency,
    testMode,
    totalFee = 0,
    successfulTransactionsNumber,
    reason,
    dateTime,
    country,
    region,
    city,
    ip,
    utm_source,
    utm_campaign,
    utm_medium,
    productId
}) => {
    try {
        const date = parse(dateTime, "yyyy-MM-dd HH:mm:ss", new Date());
        const event = {
            user_id,
            event_type,
            time: getUnixTime(date),
            revenue: amount / CONVERSION_RATE - parseFloat(totalFee),
            country,
            region,
            city,
            ip,
            productId,
            event_properties: {
                transactionId,
                amount:Math.abs(amount),
                currency,
                testMode,
                successfulTransactionsNumber,
                reason,
                utm_source,
                utm_campaign,
                utm_medium
            },
        }
        console.log("logging", event);
        amplitudClient.logEvent(event);
    } catch (error) {
        console.error("error happened", error.message);
    }

}

const logPaymentToAmplitude = (event, productId) => {
    let utm_source, utm_campaign, utm_medium;
    let totalFee = event.TotalFee || 0;
    const {
        AccountId: user_id,
        Amount: amount,
        TransactionId: transactionId,
        TestMode: testMode,
        Currency: currency,
        DateTime: dateTime,
        IpCountry: country,
        IpRegion: region,
        IpCity: city,
        IpAddress: ip,
    } = event;

    if (event.Data) {
        utm_source = event.Data.utm_source;
        utm_campaign = event.Data.utm_campaign;
        utm_medium = event.Data.utm_medium;
    }

    if (user_id && amount && transactionId && transactionId && currency && dateTime) {
        logToAmplitude({
            event_type: AmplitudeEvent.pay,
            user_id,
            amount,
            transactionId,
            totalFee,
            testMode,
            currency,
            dateTime,
            country,
            region,
            city,
            ip,
            utm_source,
            utm_campaign,
            utm_medium,
            productId
        });
    }
    else {
        console.error("will not send to amplitude dues to lack of mandatory properties!", { user_id, amount, transactionId, currency, dateTime })
    }

}

const logFailToAmplitude = (event, productId) => {
    let utm_source, utm_campaign, utm_medium;
    const amount = 0;
    const { AccountId: user_id,
        TransactionId: transactionId,
        TestMode: testMode,
        Currency: currency,
        Reason: reason,
        DateTime: dateTime,
        IpCountry: country,
        IpRegion: region,
        IpCity: city,
        IpAddress: ip,
    } = event;

    if (event.Data) {
        utm_source = event.Data.utm_source;
        utm_campaign = event.Data.utm_campaign;
        utm_medium = event.Data.utm_medium;
    }

    if (user_id && transactionId && currency && reason && dateTime) {
        logToAmplitude({
            event_type: AmplitudeEvent.fail,
            user_id,
            amount,
            transactionId,
            testMode,
            currency,
            reason,
            dateTime,
            country,
            region,
            city,
            ip,
            utm_source,
            utm_campaign,
            utm_medium,
            productId
        });
    }
    else {
        console.error("will not send to amplitude dues to lack of mandatory properties!", { user_id, transactionId, currency, reason, dateTime })
    }
}

const logRefundToAmplitude = (event, productId) => {
    let utm_source, utm_campaign, utm_medium;
    const amount = -1 * event.Amount || 0;
    currency = Currency.RUB;
    const {
        AccountId: user_id,
        TransactionId: transactionId,
        DateTime: dateTime,
        IpCountry: country,
        IpRegion: region,
        IpCity: city,
        IpAddress: ip,
    } = event

    if (event.Data) {
        utm_source = event.Data.utm_source;
        utm_campaign = event.Data.utm_campaign;
        utm_medium = event.Data.utm_medium;
    }

    if (user_id && transactionId && amount !== undefined && dateTime) {
        logToAmplitude({
            event_type: AmplitudeEvent.refund,
            user_id,
            amount,
            transactionId,
            currency,
            dateTime,
            country,
            region,
            city,
            ip,
            utm_source,
            utm_campaign,
            utm_medium,
            productId
        });
    }
    else {
        console.error("will not send to amplitude dues to lack of mandatory properties!", { user_id, transactionId, amount, dateTime })
    }
}

const logRecurrentToAmplitude = (event , productId) => {
    let utm_source, utm_campaign, utm_medium;
    const amount = 0;
    const {
        AccountId: user_id,
        Currency: currency,
        SuccessfulTransactionsNumber: successfulTransactionsNumber,
        DateTime: dateTime,
        IpCountry: country,
        IpRegion: region,
        IpCity: city,
        IpAddress: ip,
    } = event;

    if (event.Data) {
        utm_source = event.Data.utm_source;
        utm_campaign = event.Data.utm_campaign;
        utm_medium = event.Data.utm_medium;
        
    }

    const mapCloudPaymentsEventsToAmplitudeEvents = {
        [SubscriptionStatus.Active]: AmplitudeEvent.recurrentActive,
        [SubscriptionStatus.Cancelled]: AmplitudeEvent.recurrentCancelled,
        [SubscriptionStatus.Rejected]: AmplitudeEvent.recurrentRejected,
    }
    const event_type = mapCloudPaymentsEventsToAmplitudeEvents[event.Status]

    if (user_id && currency && successfulTransactionsNumber && event_type && dateTime) {
        logToAmplitude({
            event_type,
            user_id,
            amount,
            currency,
            successfulTransactionsNumber,
            dateTime,
            country,
            region,
            city,
            ip,
            utm_source,
            utm_campaign,
            utm_medium,
            productId
        });
    }
    else {
        console.error("will not send to amplitude dues to lack of mandatory properties!", { user_id, currency, successfulTransactionsNumber, event_type, dateTime })
    }
}

module.exports = { logToAmplitude, logPaymentToAmplitude, logFailToAmplitude, logRefundToAmplitude, logRecurrentToAmplitude }