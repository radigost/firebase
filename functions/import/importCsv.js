const CSV_FILE_PATH = './functions/import/data.csv'

const csv = require('csvtojson')
const add = require('date-fns/add');
const getUnixTime = require('date-fns/getUnixTime');
const _ = require('lodash')

const SubscriptionStatus = require('../domain/SubscriptionStatus');
const SubscriptionProvider = require('../domain/SubscriptionProvider');
const ITunesStatusToSystemStatusesMap = require('../domain/ITunesStatusToSystemStatusesMap');
const productToPeriodsMap = require('./productMap')
const firestore = require('../firestore/firestore')


const convert = async () => {
    try {
        return csv({ignoreEmpty: true}).fromFile(CSV_FILE_PATH,);
    } catch (e) {
        console.error(e.message)
        return Promise.reject(e.message)
    }
}

const mergeEntries = (csvEntries = []) => {
    console.time('Process entries to make map with ids')
    const users = {}
    csvEntries.forEach((entry, index) => {
        if (users[entry["Q User ID"]]) {
            users[entry["Q User ID"]].events.push(entry);
        } else {
            users[entry["Q User ID"]] = {events: [entry]};
        }
    })
    console.timeEnd('Process entries to make map with ids')
    return users
}

const splitUsers = async (users, entriesToCheck) => {
    console.time('Split users between existed and not existed')
    try {
        const promises = []
        const nonExistedUsers = {}
        const existedUsers = {}
        const keys = Object.keys(users)
        entriesToCheck = entriesToCheck || Object.keys(users).length
        for (let i = 0; i < entriesToCheck; i++) {
            const serviceUID = keys[i]
            console.log("Checking if user with serviceUID %s is in users table", serviceUID)
            promises.push(firestore.getUserByServiceUid(serviceUID).then((entries) => {
                if (entries.length === 1) {
                    existedUsers[serviceUID] = users[serviceUID]
                } else if (entries.length === 0) {
                    nonExistedUsers[serviceUID] = users[serviceUID]
                }
                return true
            }).catch(console.error))
        }
        console.timeEnd('Split users between existed and not existed')
        return Promise.all(promises).then(() => ({nonExistedUsers, existedUsers})).catch(console.error)
    } catch (e) {
        console.error(e.message)
    }
}

const parsePeriodFromProductId = (productId = "") => productToPeriodsMap.autoRenewable[productId]

const batchCreateDevices = async (nonExistedUsers) => {
    console.time('Create new device entries')
    const promises = []
    _.forEach(nonExistedUsers, (value, key) => promises.push(firestore.createNewDevice({serviceUID: key})))
    console.timeEnd('Create new device entries')
    return Promise.all(promises)
}
const batchCreateNewSubscriptionForDevices = async (users) => {
    return Promise.all(_.reduce(users, (result, value, key) => {
        const {'Product ID': productId} = _.head(value.events)
        result.push(firestore.startNewSubscriptionForDevice({
            type: SubscriptionProvider.iTunes,
            productId,
            activeTill: 0,
            deviceId: key,
        }))
        return result
    }, []))
}

const processEventsForDevices = async (mergedUsers, subscriptionReferences) => {
    console.time('processing events')
    for (let subscriptionRef of subscriptionReferences) {
        const owner = await firestore.getOwner(subscriptionRef)
        const {serviceUID} = owner.data()
        const userEvents = _.get(mergedUsers, [serviceUID, 'events'])

        for (let event of userEvents) {
            const {'Event Name': eventName, 'Product ID': productId,} = event
            const status = ITunesStatusToSystemStatusesMap[eventName]

            const dateValue = event["Event Date"]

            const date = new Date(dateValue)
            const periods = parsePeriodFromProductId(productId)
            let property
            if (status === SubscriptionStatus.trial) {
                property = 'trialLength'
            } else if (status === SubscriptionStatus.active) {
                property = 'subscriptionLength'
            }

            const payload = {
                uid: owner.id,
                status,
                productId,
                type: SubscriptionProvider.iTunes,
                activeTill: getUnixTime(add(date, {days: periods[property] || 0})),
            }
            const eventAlreadyExistsInSubscription = await firestore.isEventAlreadyExistsInSubscription(
                subscriptionRef,
                event,
                ['Event Name', 'Transaction Date']
            )
            if (!eventAlreadyExistsInSubscription) {
                await firestore.changeSubscriptionStatus(subscriptionRef, payload)
                await firestore.logUserEvent({
                    subscriptionRef,
                    provider: SubscriptionProvider.iTunes,
                    payload: event,
                    owner
                });
            } else {
                console.debug(`event already exists `)
            }
        }

    }
    console.timeEnd('processing events')
}


module.exports = {
    convert,
    mergeEntries,
    splitUsers,
    parsePeriodFromProductId,
    batchCreateDevices,
    batchCreateNewSubscriptionForDevices,
    processEventsForDevices
}
