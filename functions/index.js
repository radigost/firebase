const functions = require('firebase-functions');
const admin = require('firebase-admin');


const CryptoJS = require("crypto-js");
const crypto = require("crypto")



admin.initializeApp();
const db = admin.firestore();



// Cloud Payments Events 

const hashInBase64 = (payload) => {
    const secret = process.env.API_SECRET
    // console.log("API - %s",secret);
    // console.log("PAYLOAD - %s",payload);
    // // TODO check IPs 
    // const hash = CryptoJS.HmacSHA256(payload, secret);
    // console.log("HASH - %s",hash);
    // const res= CryptoJS.enc.Base64.stringify(hash);
    // console.log("hashed result - %s",res)

    return crypto.createHmac("sha256", secret)
        .update(payload)
        .digest("base64");

}



exports.pay = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        response.send({ "code": 13 })
    }
    else {
        try {
            const HMAC = request.header('Content-HMAC');
            const hashedBody = hashInBase64(Buffer.from(request.rawBody, 'utf-8'));
            if (hashedBody === HMAC) {
                const { AccountId, Email, OperationType } = request.body;
                const testSubPosting = db.collection('testSubPosting');
                const documentReference = testSubPosting.doc(AccountId);
                await documentReference.set({ AccountId, OperationType, Email, body: request.body })
                response.send({ "code": 0 });
            }
            else {
                console.error("Checksum of POST body %s is not equal to Content-HMAC : %s", hashedBody, HMAC)
                response.status(401).send({ "code": 13 });
            }
        }
        catch (e) {
            console.error("Error happened", e.message);
            response.send({ "code": 13 })
        }
    }
});

exports.recurrent = functions.https.onRequest(async (request, response) => {
    if (request.method !== 'POST') {
        response.send({ "code": 13 })
    }
    else {
        try {
            const { AccountId, Email, OperationType } = request.body;
            const testSubPosting = db.collection('testSubPosting');
            const documentReference = testSubPosting.doc(AccountId);
            await documentReference.set({ subscription: { AccountId, OperationType, Email, body: request.body } })
            response.send({ "code": 0 });
        }
        catch (e) {
            response.send({ "code": 13 })
        }
    }
});
