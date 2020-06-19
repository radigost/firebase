const test = require('firebase-functions-test')({
    projectId: 'mo-meditations-firebase'
});
const USER_COLLECTION = 'testUsers'
const SUBSCRIPTIONS_COLLECTION = 'testSubscriptions'
const fs = require('fs');

const assert = require('chai').assert;
const expect = require('chai').expect;

const {convert,splitUsersThatAreInDatabase,processEntries} = require('./importCsv');
const saveFile = (fileData,filename)=>{
    fs.writeFile(filename, JSON.stringify(fileData), 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }
        console.log(`The file ${filename} was saved!`);
    });
}
describe('Converting csv to firebase structure', () => {
    let result, emptyUsers, existedUsers,users
    before("", async () => {
        result = await convert();
        users = processEntries(result)
        saveFile(users,'users.json')

    })
    it('should have entries', async () => {
        // console.log("result:%O", result);
        assert.equal(result.length, 19936);
        assert.equal(Object.keys(users).length, 7674);
        // assert.equal(emptyUsers.length, 19937);
        // assert.equal(existedUsers.length, 19937);
    });


})
