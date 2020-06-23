const csvFilePath = './functions/import/data.csv'
const csv = require('csvtojson')
// const fs = require('fs');
// const testFolder = './functions/import';
// fs.readdir(testFolder, (err, files) => {
//     files.forEach(file => {
//         console.log(file);
//     });
// });
const _ = require('lodash')
const {getUserByServiceUid} = require('../firestore/firestore')
const firestore = require('../firestore/firestore')
const convert = async () => {
    try {
        return csv({ignoreEmpty: true}).fromFile(csvFilePath,);
    } catch (e) {
        console.error(e.message)
        return Promise.reject(e.message)
    }
}

const mergeEntries = (csvEntries = []) => {
    console.time('process json from flat to map')
    const users = {}
    const length = csvEntries.length
    csvEntries.forEach((entry, index) => {
        // console.log(`${index} of ${length}:${entry["Q User ID"]}`)
        if (users[entry["Q User ID"]]) {
            users[entry["Q User ID"]].events.push(entry);
        } else {
            users[entry["Q User ID"]] = {events: [entry]};
        }
    })
    console.timeEnd('process json from flat to map')
    return users
}

const splitUsers = async (users) => {
    try {
        const promises = []
        const nonExistedUsers = {}
        const existedUsers = {}
        const keys = Object.keys(users)
        const ENTRIES_TO_CHECK = 10
        for (let i = 0; i < ENTRIES_TO_CHECK; i++) {
            const serviceUID = keys[i]
            console.log("checking for %s", serviceUID)
            promises.push(firestore.getUserByServiceUid(serviceUID).then((entries) => {
                if (entries.length === 1) {
                    existedUsers[serviceUID] = users[serviceUID]
                } else if (entries.length === 0) {
                    nonExistedUsers[serviceUID] = users[serviceUID]
                }
                return true
            }).catch(console.error))
        }
        return Promise.all(promises).then(() => ({nonExistedUsers, existedUsers})).catch(console.error)
    } catch (e) {
        console.error(e.message)
    }
}
const parsePeriodFromProductId = (productId = "") => {
    const possiblePeriod = {'year': 365, 'month': 30, 'halfYear': 183}
    const daysOfSubscription = productId.split(".").reduce((acc, entry) => possiblePeriod[entry] ? possiblePeriod[entry] : acc, 0)
    return daysOfSubscription;
}

const createNewUsersAndSubscriptions = (newUsersMap) => {
    const qonversionStatusesMap ={

    }
    const fields = {
        email,
        name,

            serviceUID,
            subscriptionStatus,

            subscriptionActiveTill,
            subscriptions
    }
}

module.exports = {convert, processEntries: mergeEntries, createUserForNonExistedUser: splitUsers,parsePeriodFromProductId}
