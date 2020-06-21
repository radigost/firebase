const functions = require('firebase-functions');


const {isSignedByCloudPayments} = require('./security');
const {logUserEvent, startNewSubscriptionForUser, getPeriodFromPayload, getUserSubscriptionByUserId, changeSubscriptionStatus} = require('./firestore/firestore');
const {logPaymentToAmplitude, logRecurrentToAmplitude, logFailToAmplitude, logRefundToAmplitude} = require('./amplitude/amplitude');
const {get} = require('lodash');
const SubscriptionStatus = require('./domain/SubscriptionStatus');
const SubscriptionProvider = require('./domain/SubscriptionProvider');
const CloudPaymentsSubscriptionStatus = require('./domain/CloudPaymentsSubscriptionStatus');

const {logger} = require('./logger')


// common middleware
const executeEvent = async (request, response, execute) => {
    if (request.method !== 'POST') {
        response.send({"code": 13})
    } else {
        try {
            if (isSignedByCloudPayments(request)) {
                if (request.body.Data) {
                    request.body.Data = JSON.parse(request.body.Data)
                }
                await execute();
                response.send({"code": 0});
            } else {
                response.status(401).send({"code": 13});
            }
        } catch (e) {
            logger.error("error happened", e);
            response.send({"code": 13})
        }
    }
}

const getProductId = (request) => get(request.body.Data, 'productId');


//  API
exports.pay = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        const productId = getProductId(request)
        const subscription = await getUserSubscriptionByUserId(request.body.AccountId)
        const payload = {
            accountId: request.body.AccountId,
            productId,
        }


        /*
        By documentations from CloudPayments,subscriptions must be started in Subscription hook,
         but actually we receive only Pay hook when start subscription, so use it and its fields to manage period and status
        * */
        if (get(request.body, 'Data.cloudPayments.recurrent')) {
            Object.assign(payload, {
                activeTill: getPeriodFromPayload(
                    {
                        Interval: get(request.body, 'Data.cloudPayments.recurrent.interval'),
                        Period: get(request.body, 'Data.cloudPayments.recurrent.period'),
                        StartDate: new Date().toDateString()
                    }),
            })
        }

        if (subscription) {
            Object.assign(payload, {
                status: SubscriptionStatus.active
            })
            logger.debug("payload: %O", payload);
            await changeSubscriptionStatus(payload)
        } else {
            Object.assign(payload, {
                type: SubscriptionProvider.cloudPayments,
                email: request.body.Email
            })
            logger.debug("payload: %O:", payload);
            await startNewSubscriptionForUser(payload);
        }

        const {insertId, serviceUID} = await logUserEvent(request.body.AccountId, SubscriptionProvider.cloudPayments, request.body);

        logPaymentToAmplitude(request.body, productId, insertId, serviceUID);
    })
});

exports.fail = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        await changeSubscriptionStatus({accountId: request.body.AccountId, status: SubscriptionStatus.billingRetry})
        const {insertId, serviceUID} = await logUserEvent(request.body.AccountId, SubscriptionProvider.cloudPayments, request.body);
        const productId = getProductId(request)
        logFailToAmplitude(request.body, productId, insertId, serviceUID);
    })
});


exports.refund = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        const payload = {
            accountId: request.body.AccountId,
            productId: getProductId(request),
            activeTill: 0
        }
        await changeSubscriptionStatus(payload)
        const {insertId, serviceUID} = await logUserEvent(request.body.AccountId, SubscriptionProvider.cloudPayments, request.body);
        logRefundToAmplitude(request.body, payload.productId, insertId, serviceUID);
    })
});


exports.recurrent = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        const productId = getProductId(request)
        logger.debug("Status of recurrent event: %s", request.body.Status);
        const payload = {
            accountId: request.body.AccountId,
            productId
        }
        if (request.body.StartDate) {
            Object.assign(payload, {
                activeTill: getPeriodFromPayload(request.body)
            })
        }


        if (request.body.Status === CloudPaymentsSubscriptionStatus.Active) {
            Object.assign(payload, {status: SubscriptionStatus.active,})
            await changeSubscriptionStatus(payload)
        }
        if (request.body.Status === CloudPaymentsSubscriptionStatus.PastDue) {
            Object.assign(payload, {status: SubscriptionStatus.billingRetry})
            await changeSubscriptionStatus(payload)
        }
        if (request.body.Status === CloudPaymentsSubscriptionStatus.Rejected) {
            Object.assign(payload, {status: SubscriptionStatus.cancelled})
            await changeSubscriptionStatus(payload)
        }
        if (request.body.Status === CloudPaymentsSubscriptionStatus.Cancelled) {
            Object.assign(payload, {status: SubscriptionStatus.cancelled})
            await changeSubscriptionStatus(payload)
        }

        const {insertId, serviceUID} = await logUserEvent(request.body.AccountId, SubscriptionProvider.cloudPayments, request.body);
        logRecurrentToAmplitude(request.body, productId, insertId, serviceUID);
    })
});


