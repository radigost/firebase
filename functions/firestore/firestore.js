const USER_COLLECTION = 'testUsers'
const SUBSCRIPTIONS_COLLECTION = 'testSubscriptions'
const DEVICES_COLLECTION = 'testDevices'

const admin = require('firebase-admin');
let FieldValue = require('firebase-admin').firestore.FieldValue;
const _ = require('lodash')
const add = require('date-fns/add');
const getUnixTime = require('date-fns/getUnixTime');
const {get, isEqual, toNumber} = require('lodash');

const SubscriptionStatus = require('../domain/SubscriptionStatus');
const SubscriptionProvider = require('../domain/SubscriptionProvider');

const {logger} = require('../logger')

admin.initializeApp();
const db = require('./db').getDb();


// logging to firebase
const logUserEvent = async ({subscriptionRef, owner, provider, payload}) => {
    const {serviceUID} = owner.data()
    await subscriptionRef.update({
        events: admin.firestore.FieldValue.arrayUnion(payload)
    })
    logger.info(`Added entry for Subscription ${subscriptionRef.path}`);

    const subscriptionSnapshot = await subscriptionRef.get()
    const length = subscriptionSnapshot.data().events.length
    const insertId = `${provider}_${subscriptionRef.id}_${length}`;
    return {insertId, serviceUID};
}

//users
const createNewDevice = async ({serviceUID}) => {
    const data = {serviceUID}
    let docRef
    if (serviceUID) {
        docRef = await db.collection(DEVICES_COLLECTION).doc(serviceUID)
        const doc = await docRef.get();
        if (!doc.exists) {
            await docRef.set(data)
        }

    } else {
        docRef = await db.collection(DEVICES_COLLECTION).doc(serviceUID).set(data)
    }
    return docRef.id
}


// subscriptions
const startNewSubscriptionForDevice = async ({type, productId, activeTill, deviceId, status}) => {
    logger.debug(`Starting new ${type} subscription for device ${deviceId}`);
    const deviceRef = await db.collection(DEVICES_COLLECTION).doc(deviceId)

    const doc = await deviceRef.get();
    const data = doc.data()
    if (data && !data.subscriptions) {
        await deviceRef.update({
            subscriptions: []
        })
    }

    const newSubscriptionData = {
        owner: [deviceRef],
        type,
        productId,
        events: []
    }
    if (status) {
        Object.assign(newSubscriptionData, {status})
    }
    if (activeTill || isEqual(toNumber(activeTill), 0)) {
        Object.assign(newSubscriptionData, {activeTill})
    }
    const subscription = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${deviceId}`).set(newSubscriptionData, {merge: true})

    await deviceRef.update({
        'subscriptions': admin.firestore.FieldValue.arrayUnion(db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${deviceId}`))
    })
    return db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${deviceId}`)
}
const startNewSubscriptionForUser = async ({accountId: uid, email, type, productId, activeTill}) => {
    logger.debug(`Starting new subscription for user ${uid}`);
    const userRef = await db.collection(USER_COLLECTION).doc(uid)
    const doc = await userRef.get();
    if (!doc.subscriptions) {
        await userRef.update({
            subscriptions: []
        })
    }

    const data = {
        owner: [db.collection(USER_COLLECTION).doc(`${uid}`)],
        type,
        productId,
        status: SubscriptionStatus.active,
        events: []
    }
    if (email) {
        Object.assign(data, {email})
    }
    if (activeTill || isEqual(toNumber(activeTill), 0)) {
        Object.assign(data, {activeTill})
    }
    const subscription = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${uid}`).set(data, {merge: true})

    return userRef.update({
        'subscriptions': admin.firestore.FieldValue.arrayUnion(
            db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscription.path)
        )
    })

}

const isEventAlreadyExistsInSubscription = async (
    subscriptionRef,
    eventToCheck,
    keys
) => {
    const snapshot = await subscriptionRef.get();
    const getEventHash = (_event) => _.reduce(keys, (acc, key) => `${acc}__${_event[key]}`, '')
    const eventToCheckHash = getEventHash(eventToCheck)
    return _.find(snapshot.data().events, (e) => getEventHash(e) === eventToCheckHash)
}

const changeSubscriptionStatus = async (subscriptionRef,
                                        {
                                            status,
                                            activeTill,
                                            productId,
                                        }) => {
    const event = {status}
    if (activeTill || isEqual(toNumber(activeTill), 0)) {
        event.activeTill = activeTill;
    }
    if (productId) {
        event.productId = productId;
    }
    logger.debug(`Changing status for subscriptions ${subscriptionRef.id} on ${status}`)
    const subscriptionSnapshot = await subscriptionRef.get();
    if (subscriptionSnapshot.exists) {
        return subscriptionRef.update(event);
    } else {
        logger.error(`Cannot change status of subscription, ${subscriptionRef.id} does not exist!`)
        return Promise.resolve();
    }
}

const getOwner = async (subscriptionRef) => {
    const snapshot = await subscriptionRef.get()
    const data = snapshot.data()
    return db.doc(_.head(data.owner).path).get()
}

const getUserSubscriptionByUserId = async (id, provider = SubscriptionProvider.cloudPayments) => {
    try {
        const doc = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${provider}_${id}`).get();
        return doc.data();
    } catch (e) {
        logger.error("Cannot get user subscription", e)
        return e;
    }
}
const getUser = async (id) => {
    try {
        logger.debug(`retrieveing user:${id} in ${USER_COLLECTION}`);
        const doc = await db.collection(USER_COLLECTION).doc(id).get();

        return doc.data();
    } catch (e) {
        logger.error(e.message)
        return e;
    }
}

const getUserByServiceUid = async (id) => {
    try {
        logger.debug(`retrieveing user:${id} in ${USER_COLLECTION}`);
        const snapshot = await db.collection(USER_COLLECTION).where('serviceUID', '==', id).get();
        if (snapshot.empty) {
            console.log("No Such User - %s", id)
            return [];
        } else {
            const usersPromise = []
            snapshot.forEach(doc => {
                usersPromise.push(doc.data())
            });
            if (usersPromise.length === 1) {
                console.log("User exists - %s", id)
            } else {
                console.log("several entries found - %s for user %s", usersPromise.length, id)
            }
            return usersPromise;
        }
    } catch (e) {
        logger.error(e.message)
        return e;
    }
}

const clearUserSubscription = async (id) => {
    try {
        logger.debug(`clearing subscription array for user ${USER_COLLECTION}, ${id}`);
        await db.collection(USER_COLLECTION).doc(id).update({
            'subscriptions': FieldValue.delete()
        })
    } catch (e) {
        logger.error(e)
    }
}

const getPeriodFromPayload = ({Interval, Period, StartDate}) => {
    const addMap = {
        'Month': 'months',
        'Day': 'days',
        'Week': 'weeks',
    }
    const date = new Date(StartDate)
    logger.debug("date, %s", date)
    const period = {[get(addMap, Interval)]: Period}
    logger.debug("period, %O", period)
    return getUnixTime(add(date, period))
}
module.exports = {
    logUserEvent,
    startNewSubscriptionForUser,
    getUser,
    clearUserSubscription,
    getUserSubscriptionByUserId: getUserSubscriptionByUserId,
    SubscriptionProvider,
    getPeriodFromPayload,
    changeSubscriptionStatus,
    getUserByServiceUid,
    createNewDevice,
    startNewSubscriptionForDevice,
    getOwner,
    isEventAlreadyExistsInSubscription
}
