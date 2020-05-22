const functions = require('firebase-functions');
const EventType = require('./src/domain/EventType');

const {isSignedByCloudPayments} = require('./src/security');
const {logUserEvent,startSubscriptionForUser} = require('./src/firebaseService');



// common middleware
const executeEvent = async (request, response, execute) => {
    if (request.method !== 'POST') {
        response.send({ "code": 13 })
    }
    else {
        try {
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
    })
});

exports.recurrent = functions.https.onRequest(async (request, response) => {
    return executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Recurring);
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
    })
});


