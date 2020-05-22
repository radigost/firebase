import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as  crypto from "crypto";

admin.initializeApp();
const db = admin.firestore();



import * as TestSuite from 'firebase-functions-test';
const test = TestSuite()
test.mockConfig({ amplitude: { api_key: process.env.AMPLITUDE_API_KEY } });
const Amplitude = require('@amplitude/node');
const key = functions.config().amplitude.api_key
const amplitudClient = Amplitude.init(key);


const EventType = {
    'Payment': 'Payment',
    'Recurring': 'Recurring',
    'Check': 'Check',
    'Fail': 'Fail',
}

const SubscriptionStatus = {
    'Active': 'Active',
    'PastDue': 'PastDue',
    'Cancelled': 'Cancelled',
    'Rejected': 'Rejected',
    'Expired': 'Expired',
}

const USER_COLLECTION = 'testUsers'


// security
const hashInBase64 = (payload: Buffer) => {
    const secret = functions.config().cloudpayments.api_secret;

    return crypto.createHmac("sha256", secret)
        .update(payload)
        .digest("base64");
}

const signedByCloudPayments = (request: Request) => {
    const HMAC = request.headers.get('Content-HMAC');
    let hashedBody;
    if (request.body) {
        // @ts-ignore
        hashedBody = hashInBase64(Buffer.from(request.rawBody, 'utf-8'));
    }
    const res = hashedBody === HMAC;

    if (!res) {
        console.error("Checksum of POST body %s is not equal to Content-HMAC : %s", hashedBody, HMAC)
    }
    return res;
}

// logging to firebase

const logUserEvent = async (event, eventType) => {
    collection = USER_COLLECTION;
    try {
        const { AccountId } = event;
        const userRef = db.collection(collection).doc(AccountId);

        await userRef.update({
            'subscription.events.cloudPayments': admin.firestore.FieldValue.arrayUnion(event)
        })

        console.log('Added document about: %s for user %s ', eventType, AccountId);
    }
    catch (e) {
        console.error("Error happened", e.message);
    }

}

// services
const startSubscriptionForUser = async (AccountId) => {
    console.log(USER_COLLECTION, `${AccountId}`, SubscriptionStatus.Active);
    return db.collection(USER_COLLECTION).doc(`${AccountId}`).update({
        'subscription.status': SubscriptionStatus.Active,
    });
}

//  common middleware
const executeEvent = async (request, response, execute) => {
    if (request.method !== 'POST') {
        response.send({ "code": 13 })
    }
    else {
        try {
            if (signedByCloudPayments(request)) {
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

const logToAmplitude = () => {
    amplitudClient.logEvent({
        event_type: 'Node.js Event',
        user_id: 'datamonster@gmail.com',
        location_lat: 37.77,
        location_lng: -122.39,
        ip: '127.0.0.1',
    });
}

//  API 
exports.pay = functions.https.onRequest(async (request, response) => {
    await executeEvent(request, response, async () => {
        await startSubscriptionForUser(request.body.AccountId);
        await logUserEvent(request.body, EventType.Payment);
    })
});

exports.recurrent = functions.https.onRequest(async (request, response) => {
    await executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Recurring);
    })
});

exports.check = functions.https.onRequest(async (request, response) => {
    await executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Check);
    })
});

exports.fail = functions.https.onRequest(async (request, response) => {
   await executeEvent(request, response, async () => {
        await logUserEvent(request.body, EventType.Fail);
    })
});


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
        logToAmplitude();


    } catch (error) {
        console.error("error happened", error.message);
    }

}

// @ts-ignore
await testLogAmplitudeEvent();
