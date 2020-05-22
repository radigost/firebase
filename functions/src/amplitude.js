const functions = require('firebase-functions');
const Currency = require('./domain/Currency');
const Amplitude = require('@amplitude/node');
const key = functions.config().amplitude.api_key
var amplitudClient = Amplitude.init(key);
var getUnixTime = require('date-fns/getUnixTime')
const AmplitudeEvent = require('./domain/AmplitudeEvent');
const CONVERSION_RATE = 70;

const logToAmplitude = ({
    user_id,
    event_type,
    revenue,
    transactionId,
    amount,
    currency = Currency.RUB,
    testMode,
    successfulTransactionsNumber
}) => {
    try {
        const event = {
            user_id,
            event_type,
            time: getUnixTime(new Date()),
            revenue: revenue / CONVERSION_RATE,
            event_properties: {
                transactionId,
                amount,
                currency,
                testMode,
                successfulTransactionsNumber
            },
        }
        console.log("logging", event);
        amplitudClient.logEvent(event);
    } catch (error) {
        console.error("error happened", error.message);
    }

}


module.exports = { logToAmplitude }