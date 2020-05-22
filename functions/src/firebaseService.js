const SubscriptionStatus = require('../src/domain/SubscriptionStatus');
const USER_COLLECTION = 'testUsers'
const admin = require('firebase-admin');


admin.initializeApp();
const db = admin.firestore();



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

module.exports = {logUserEvent,startSubscriptionForUser}