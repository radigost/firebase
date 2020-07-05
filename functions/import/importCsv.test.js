const firebase = require("@firebase/testing");

const SubscriptionStatus = require('../domain/SubscriptionStatus')
const db = require('../firestore/db')
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
describe("import", () => {
    function authedApp(auth) {
        return firebase
            .initializeTestApp({projectId: 'test-project', auth})
            .firestore();
    }

    before(() => {
        db.setDb(authedApp(null));
    });

    before(async () => {
        // Clear the database before each test
        await firebase.clearFirestoreData({projectId: 'test-project'});
    });

    after(async () => {
        await Promise.all(firebase.apps().map(app => app.delete()));
    });
    describe('process days of subscription for given productId', () => {
        it('should parse year', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.verv2.year.2790.withTrial').subscriptionLength, 366);
        });
        it('should parse halfYear', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.oldAngry.halfYear.999.withTrial').subscriptionLength, 183);
        });
        it('should parse month', async () => {
            assert.equal(importCsv.parsePeriodFromProductId('app.momeditation.mo.subscription.verv.month.849.withoutTrial').subscriptionLength, 31);
        });
    })
    xdescribe('Converting csv to firebase structure', () => {
        let result, users, nonExistedUsers, existedUsers, data
        before("", async () => {
            result = await importCsv.convert();
            users = importCsv.mergeEntries(result)
            saveFile(users, 'users.json')
            data = await importCsv.splitUsers(users, 10)
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
        let nonExistedUsers, subscriptionsRefs
        before("preapare files", async () => {
            nonExistedUsers = fs.readFileSync('test-nonExistedUsers.json', 'utf8');
        })
        it('should create all batch subscriptions from passed collections', async () => {
            subscriptionsRefs = await importCsv.batchCreateNewSubscriptionForDevices(JSON.parse(nonExistedUsers))
            assert.equal(subscriptionsRefs.length, _.keys(JSON.parse(nonExistedUsers)).length);
        })
        it('should fill all events in users and update subscription', async () => {
            // TODO - important - it must work with users too!
            const expectedRes = {
                'iTunes_zvMd6O77svx8DM_wOSjot4Dty1wMGwWa': SubscriptionStatus.active,
                'iTunes_M9Bphf8XvZfAhIVgKOqjMQVuNboY7qe0': SubscriptionStatus.cancelled,
                'iTunes_mBJps-GHqXDHjkWrSx6dvBFDpTgbSFD_': SubscriptionStatus.cancelled,
                'iTunes_-y7h8MLRJSARIj_cbvgXl35ZzxKPwvX8': SubscriptionStatus.active,
                'iTunes_7P81UurUufD7iSLkQ3GdTHKMFWCsbV41': SubscriptionStatus.cancelled,
                'iTunes_kAzcSnNXqY8AKVTm4izJqTECljOfoM2h': SubscriptionStatus.active

            }
            await importCsv.processEventsForDevices(JSON.parse(nonExistedUsers), subscriptionsRefs)
            const getDocs = (_subscriptionsRefs) => {
                const res = _subscriptionsRefs.map(ref => {
                    return ref.get().then(snapshot => snapshot);
                })
                return res
            }
            const subscriptionsSnapshots = await Promise.all(getDocs(subscriptionsRefs))
            _.forEach(subscriptionsSnapshots, (snapshot) => {
                const data = snapshot.data()
                assert.equal(data.status, expectedRes[snapshot.id]);
            })
        })
    })




})
