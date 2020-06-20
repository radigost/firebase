const {head} = require("lodash");

const test = require('firebase-functions-test')({
    projectId: 'mo-meditations-firebase'
});
test.mockConfig({amplitude: {api_key: process.env.AMPLITUDE_API_KEY}});
const USER_COLLECTION = 'testUsers'
const SUBSCRIPTIONS_COLLECTION = 'testSubscriptions'
const {
    getPeriodFromPayload,
    changeSubscriptionStatus,
    logUserEvent,
    getUser,
    clearUserSubscription,
    startNewSubscriptionForUser,
    getUserSubscriptionByUserId,
    getUserByServiceUid,
    SubscriptionProvider
} = require("./firestore");
const SubscriptionStatus = require('../domain/SubscriptionStatus');

const {last, get} = require('lodash');

const assert = require('chai').assert;
const expect = require('chai').expect;
const setNewSubscriptionForUser = async (ACCOUNT_ID, USER_PAYLOAD, EVENT) => {
    try {
        await clearUserSubscription(ACCOUNT_ID);
        await startNewSubscriptionForUser(ACCOUNT_ID, USER_PAYLOAD, EVENT);
    } catch (e) {
        logger.error(e)
    }
}

describe('Not a test - just convinient way to check data from production database', () => {
    let users,subscription
    before("", async () => {
        //change to needed id
        const id = "WuXXdkrlqleCp1A6MK_5eg-M3NoyZW4z"
        // user = await getUser(id);
        users = await getUserByServiceUid(id);
        // subscription = await getUserSubscriptionByUserId(id);
    })
    it('should have user accountId', async () => {
        console.log("user:%O", users);
        // console.log("subscription:%O", subscription);
        assert.equal(users.length,1);
    });

})
xdescribe('Firebase', () => {
    const ACCOUNT_ID = `1407529623`
    const USER_PAYLOAD = {
        accountId: ACCOUNT_ID,
        email: 'nickolay.pol@gmail.com',
        type: SubscriptionProvider.cloudPayments,
        productId: 'asdfginmk',
        activeTill: '1590562922',
    }
    const EVENT = {
        OperationType: 'Payment'
    }

    describe('#Start Subscription', () => {
        let user
        before('set test user', async () => {
            await setNewSubscriptionForUser(ACCOUNT_ID, USER_PAYLOAD, EVENT)
            user = await getUser(ACCOUNT_ID);
        })
        it('should have user accountId', async () => {
            assert.equal(user.accountId, ACCOUNT_ID);
        });
        it('should not have subscriptions array for new user', async () => {
            assert.isNotOk(Array.isArray(user.subscriptions));
        });
        xdescribe('##Start Subscription for the first time', async () => {
            let updatedUser
            let subscriptionReference
            before(async () => {
                try {
                    await startNewSubscriptionForUser(USER_PAYLOAD);
                    subscriptionReference = (await getUserSubscriptionByUserId()).ref
                    updatedUser = await getUser(ACCOUNT_ID)
                } catch (e) {
                    logger.error(e.message)
                }
            })
            it('should create subscription array if not exist', () => {
                assert.isOk(Array.isArray(updatedUser.subscriptions));
            });
            it('should create "subscription" collection entry for user', () => {
                assert.isOk(updatedUser.subscriptions.length > 0);
            });
            it('should create "subscription" collection entry for user', () => {
                assert.equal(subscriptionReference, `${SUBSCRIPTIONS_COLLECTION}/cloudPayments_${ACCOUNT_ID}`);
            });
        })
        describe(`##User's subscriptions entry must have valid values after successful subscriptions`, async () => {
            let user
            let subscriptionDoc
            before(async () => {
                try {
                    subscriptionDoc = await getUserSubscriptionByUserId(ACCOUNT_ID);
                    user = await getUser(ACCOUNT_ID)
                } catch (e) {
                    logger.error(e.message)
                }
            })
            it(`should have user's reference in users[] `, () => {
                expect(subscriptionDoc.users).not.to.be.empty;
                expect(subscriptionDoc.users[0].path).to.equal(`${USER_COLLECTION}/${ACCOUNT_ID}`);
            });
            it(`should have user's email`, () => {
                expect(subscriptionDoc.email).not.to.be.empty;
                expect(subscriptionDoc.email).to.equal(`${USER_PAYLOAD.email}`);
            });
            it(`should have subscription type`, () => {
                expect(subscriptionDoc.type).not.to.be.empty;
                expect(subscriptionDoc.type).to.equal(SubscriptionProvider.cloudPayments);
            });
            it(`Shoud update productId  when have it in subscriptions info`, async () => {
                expect(subscriptionDoc.productId).not.to.be.empty;
                expect(subscriptionDoc.productId).to.equal(USER_PAYLOAD.productId);
            })
            it(`Shoud have activeTill date`, async () => {
                expect(subscriptionDoc.activeTill).not.to.be.empty;
                expect(subscriptionDoc.activeTill).to.equal(USER_PAYLOAD.activeTill);
            })
            it(`Shoud have status set active`, async () => {
                expect(subscriptionDoc.status).not.to.be.empty;
                expect(subscriptionDoc.status).to.equal(SubscriptionStatus.active);
            })

        })
    });

    describe('#Log Events to subscriptions', () => {
        let subscriptionDoc, user
        before(async () => {
            try {
                await logUserEvent(ACCOUNT_ID, SubscriptionProvider.cloudPayments, EVENT);
                subscriptionDoc = await getUserSubscriptionByUserId(ACCOUNT_ID);
                user = await getUser(ACCOUNT_ID)
            } catch (e) {
                logger.error(e.message)
            }
        })
        it('shoud have events entry', async () => {
            expect(subscriptionDoc.events).not.to.be.empty;
            expect(get(last(subscriptionDoc.events), 'OperationType')).to.equal(EVENT.OperationType);
        })
    })

    describe('#Change subscription status', () => {
        describe(`##Event 'fail' `, () => {
            let subscriptionDoc;
            const SUBSCRIPTION_TYPE = SubscriptionStatus.billingRetry;
            before('set test user with start subscription and change subscription status', async () => {
                await setNewSubscriptionForUser(ACCOUNT_ID, USER_PAYLOAD, EVENT)
                await changeSubscriptionStatus({accountId: ACCOUNT_ID, status: SUBSCRIPTION_TYPE})
                subscriptionDoc = await getUserSubscriptionByUserId(ACCOUNT_ID);
            })
            it("should have changed status of subscription", async () => {
                expect(subscriptionDoc.status).to.be.equal(SubscriptionStatus.billingRetry);
            })

        })
        describe(`##Event 'recurrent.pastDue' `, () => {
            let subscriptionDoc;
            const SUBSCRIPTION_TYPE = SubscriptionStatus.billingRetry;
            before('set test user with start subscription and change subscription status', async () => {
                await setNewSubscriptionForUser(ACCOUNT_ID, USER_PAYLOAD, EVENT)
                await changeSubscriptionStatus({accountId: ACCOUNT_ID, status: SUBSCRIPTION_TYPE})
                subscriptionDoc = await getUserSubscriptionByUserId(ACCOUNT_ID);
            })
            it("should have changed status of subscription", async () => {
                expect(subscriptionDoc.status).to.be.equal(SUBSCRIPTION_TYPE);
            })

        })
        describe(`##Event 'pay for existing subscription' `, () => {
            let subscriptionDoc;
            const SUBSCRIPTION_TYPE = SubscriptionStatus.active;
            before('set test user with start subscription and change subscription status', async () => {
                await setNewSubscriptionForUser(ACCOUNT_ID, USER_PAYLOAD, EVENT)
                await changeSubscriptionStatus({accountId: ACCOUNT_ID, status: SUBSCRIPTION_TYPE})
                subscriptionDoc = await getUserSubscriptionByUserId(ACCOUNT_ID);
            })
            it("should have changed status of subscription", async () => {
                expect(subscriptionDoc.status).to.be.equal(SUBSCRIPTION_TYPE);
            })

        })
    })
});


xdescribe('Parse date from CP event', () => {
    describe('get date params from request payload', () => {
        const payload = {
            Interval: '12', Period: 'Month', StartDate: '2021-05-25 05:40:41'
        }
        let res
        before(() => {
            res = getPeriodFromPayload(payload)
        })
        it('should have method for getting date', () => {
            expect(res).to.not.be.null;
        })
        it('should have method for getting date', () => {
            expect(res).to.equal(1653446441);
        })
    })
})
