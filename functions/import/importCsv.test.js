const firebase = require("@firebase/testing");
function authedApp(auth) {
    return firebase
        .initializeTestApp({ projectId: 'test-project', auth })
        .firestore();
}
const db = require('../firestore/db')

const test = require('firebase-functions-test')({
    projectId: 'mo-meditations-firebase'
});
const USER_COLLECTION = 'testUsers'
const SUBSCRIPTIONS_COLLECTION = 'testSubscriptions'
const fs = require('fs');
const _ = require("lodash")
const assert = require('chai').assert;
const expect = require('chai').expect;

const importCsv = require('./importCsv');
const saveFile = (fileData, filename) => {
    fs.writeFile(filename, JSON.stringify(fileData), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log(`The file ${filename} was saved!`);
    });
}
describe("import",()=>{
    function authedApp(auth) {
        return firebase
            .initializeTestApp({ projectId: 'test-project', auth })
            .firestore();
    }
    // before(() => {
    //     db.setDb(authedApp(null));
    // });

    before(async () => {
        // Clear the database before each test
        await firebase.clearFirestoreData({ projectId: 'test-project' });
    });

    after(async () => {
        await Promise.all(firebase.apps().map(app => app.delete()));
    });
    xdescribe('Converting csv to firebase structure', () => {
        let result, users, nonExistedUsers, existedUsers, data
        before("", async () => {
            result = await importCsv.convert();
            users = importCsv.mergeEntries(result)
            saveFile(users, 'users.json')
            data = await importCsv.splitUsers(users)
            saveFile(data.nonExistedUsers, 'test-nonExistedUsers.json')
            saveFile(data.existedUsers, 'test-existedUsers.json')

        })
        it('should have entries', async () => {
            assert.equal(result.length, 19936);
            assert.equal(Object.keys(users).length, 7763);
            assert.equal(Object.keys(data.existedUsers).length, 4);
            assert.equal(Object.keys(data.nonExistedUsers).length, 6);
        });
    })
    describe('read test-nonExistedUsers.json and add them in `devices` database ', () => {
        let devicesIds, nonExistedUsers
        before("", async () => {
            nonExistedUsers = fs.readFileSync('test-nonExistedUsers.json', 'utf8');
            devicesIds = await importCsv.batchCreateDevices(JSON.parse(nonExistedUsers))
        })
        it('should create all devices from file', () => {
            assert.equal(devicesIds.length, _.keys(JSON.parse(nonExistedUsers)).length);
        });
    })

    describe('Add subscriptions for non-existed users and link them to devices ', () => {
        let nonExistedUsers, subscriptions,devicesIds
        before("preapare files", async () => {
            nonExistedUsers = fs.readFileSync('test-nonExistedUsers.json', 'utf8');
            devicesIds = await importCsv.batchCreateDevices(JSON.parse(nonExistedUsers))
        })
        it('should create all batch subscriptions from passed collections', async () => {
            subscriptions = await importCsv.batchCreateNewSubscriptionForDevices(JSON.parse(nonExistedUsers))
            assert.equal(subscriptions.length, _.keys(JSON.parse(nonExistedUsers)).length);
        })
        it('should fill all events in users and update subscription', async () => {
            // TODO - important - it must work with users too!
            // TODO - test the order of entries is right
            const updatedSubscriptions = await importCsv.processEventsForDevices(JSON.parse(nonExistedUsers), subscriptions)
            console.log({updatedSubscriptions})
            assert.equal(updatedSubscriptions.length, _.keys(JSON.parse(nonExistedUsers)).length);
        })
    })


    xdescribe('process days of subscription for given productId', () => {
        it('should parse year', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.verv2.year.2790.withTrial'), 365);
        });
        it('should parse halfYear', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.oldAngry.halfYear.999.withTrial'), 183);
        });
        it('should parse month', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.verv.month.849.withoutTrial'), 30);
        });
    })

})
