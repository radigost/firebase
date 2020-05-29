const USER_COLLECTION = 'users'
const SUBSCRIPTIONS_COLLECTION = 'subscriptions'

const admin = require('firebase-admin');
let FieldValue = require('firebase-admin').firestore.FieldValue;

const add = require('date-fns/add');
const getUnixTime = require('date-fns/getUnixTime');
const {get} = require('lodash');

const SubscriptionStatus = require('../domain/SubscriptionStatus');
const SubscriptionProvider = require('../domain/SubscriptionProvider');

const {logger} = require('../logger')

admin.initializeApp();
const db = admin.firestore();


// logging to firebase
const logUserEvent = async (accountId, provider = SubscriptionProvider.cloudPayments, payload) => {
    const subscriptionRef = await db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${provider}_${accountId}`);
    await subscriptionRef.update({
        events: admin.firestore.FieldValue.arrayUnion(payload)
    })
    logger.info(`Added entry for Subscription ${provider}_${accountId}`);

    const serviceUID = (await getUser(accountId)).serviceUID
    const length = (await getUserSubscriptionByUserId(accountId)).events.length;
    const insertId = `cloudPayments_${accountId}_${length}`;
    return {insertId, serviceUID};
}

// services
const startNewSubscriptionForUser = async ({accountId, email, type, productId, activeTill}) => {
    logger.debug(`Starting new subscription for user ${accountId}`);
    const userRef = await db.collection(USER_COLLECTION).doc(accountId)
    const doc = await userRef.get();
    if (!doc.subscriptions) {
        await userRef.update({
            subscriptions: []
        })
    }
    const data = {
        users: [db.collection(USER_COLLECTION).doc(`${accountId}`)],
        email,
        type,
        productId,
        status: SubscriptionStatus.active,
        events: []
    }
    if (activeTill) {
        Object.assign(data, {activeTill})
    }
    await db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${accountId}`).set(data, {merge: true})

    return userRef.update({
        'subscriptions': admin.firestore.FieldValue.arrayUnion(
            db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${accountId}`)
        )
    })

}

const changeSubscriptionStatus = async ({accountId, status, activeTill, productId}) => {
    const type = SubscriptionProvider.cloudPayments;
    const event = {status}
    if (activeTill) {
        event.activeTill = activeTill;
    }
    if (productId) {
        event.productId = productId;
    }
    logger.debug(`Changing status for subscriptions ${type}_${accountId} on ${status}`)
    return db.collection(SUBSCRIPTIONS_COLLECTION).doc(`${type}_${accountId}`).update(event)
}

//
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
    changeSubscriptionStatus
}
