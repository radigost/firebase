const test = require('firebase-functions-test')({
    projectId: 'mo-meditations-firebase'
});
const USER_COLLECTION = 'testUsers'
const SUBSCRIPTIONS_COLLECTION = 'testSubscriptions'
const fs = require('fs');

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
xdescribe('Converting csv to firebase structure', () => {
    let result, users, nonExistedUsers, existedUsers, data
    before("", async () => {
        result = await importCsv.convert();
        users = importCsv.processEntries(result)
        saveFile(users, 'users.json')
        data = await importCsv.createUserForNonExistedUser(users)
        saveFile(data.nonExistedUsers, 'nonExistedUsers.json')
        saveFile(data.existedUsers, 'existedUsers.json')

    })
    it('should have entries', async () => {
        assert.equal(result.length, 19936);
        assert.equal(Object.keys(users).length, 7763);
        assert.equal(Object.keys(data.existedUsers).length, 4);
        assert.equal(Object.keys(data.nonExistedUsers).length, 6);
    });


})

describe('process days of subscription for given productId', () => {
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
