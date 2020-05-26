const functions = require('firebase-functions');
const EventType = require('./src/domain/EventType');

const { isSignedByCloudPayments } = require('./src/security');
const { logUserEvent, startSubscriptionForUser } = require('./src/firebaseService');
const { logPaymentToAmplitude, logFailToAmplitude, logRefundToAmplitude } = require('./src/amplitude');
const { get } = require('lodash');

// common middleware
const executeEvent = async (request, response, execute) => {
    if (request.method !== 'POST') {
        response.send({ "code": 13 })
    }
    else {
        try {
            console.log("hit with url", request.path);
            console.log("hit with body ", request.body);
            if (isSignedByCloudPayments(request)) {
                await execute();
                response.send({ "code": 0 });
            }
            else {
                response.status(401).send({ "code": 13 });
            }
        }
        catch (e) {
            console.error("error happened", e.message);
            response.send({ "code": 13 })
        }
    }
}

//  API 
exports.pay = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        await startSubscriptionForUser(request.body.AccountId);
        await logUserEvent(request.body, EventType.Payment);

        const productId = get(request, 'body.Data.productId');
        logPaymentToAmplitude(request.body, productId);
    })
});

exports.recurrent = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Recurring);

        const productId = get(request, 'body.Data.productId');
        logRecurrentToAmplitude(request.body, productId);
    })
});

exports.check = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {


        await logUserEvent(request.body, EventType.Check);
    })
});

exports.fail = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Fail);

        const productId = get(request, 'body.Data.productId');
        logFailToAmplitude(request.body, productId);
    })
});

exports.refund = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {

        const productId = get(request, 'body.Data.productId');
        logRefundToAmplitude(request.body, productId);
    })
});


