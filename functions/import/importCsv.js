const csvFilePath = './functions/import/data.csv'
const csv = require('csvtojson')
// const fs = require('fs');
// const testFolder = './functions/import';
// fs.readdir(testFolder, (err, files) => {
//     files.forEach(file => {
//         console.log(file);
//     });
// });
const {getUserByServiceUid} = require('../firestore/firestore')

const convert = async () => {
    try {
        return csv({delimiter: ";", ignoreEmpty: true}).fromFile(csvFilePath,);
    } catch (e) {
        console.error(e.message)
        return Promise.reject(e.message)
    }
}

const processEntries = (csvEntries = []) => {
    const users = {}
    const length = csvEntries.length
    csvEntries.forEach((entry,index) => {
        console.log(`${index} of ${length}:${entry["Q User ID"]}`)
        if (users[entry["Q User ID"]]) {
            users[entry["Q User ID"]].events.push(entry);
        } else {
            users[entry["Q User ID"]] = {events: [entry]};
        }
    })
    return users
}

const splitUsersThatAreInDatabase = async (csvEntries = []) => {
    const emptyUsersPromises = []
    const existedUsersPromises = []
    csvEntries.forEach(entry => {
        getUserByServiceUid(entry["Q User ID"]).then(users => {
            if (!users.length) {
                console.log("user does not exists")
                emptyUsersPromises.push(entry)
            } else if (users.length === 1) {
                console.log("user exists")
                existedUsersPromises.push(entry)
            } else {
                console.log("more than 1 user (actual - %s) with this service UID:%s!", users.length, users.serviceUID)
            }
            return
        }).catch(console.error)
    })
    return Promise.all([emptyUsersPromises, existedUsersPromises])

}

module.exports = {convert, splitUsersThatAreInDatabase, processEntries}
