const crypto = require("crypto")
const functions = require('firebase-functions');

// security
const hashInBase64 = (payload) => {
    const secret = functions.config().cloudpayments.api_secret;

    return crypto.createHmac("sha256", secret)
        .update(payload)
        .digest("base64");
}

const isSignedByCloudPayments = (request) => {
    const HMAC = request.header('Content-HMAC');
    const hashedBody = hashInBase64(Buffer.from(request.rawBody, 'utf-8'));
    const res = hashedBody === HMAC;

    if (!res) {
        console.error("Checksum of POST body %s is not equal to Content-HMAC : %s", hashedBody, HMAC)
    }
    return res;
}

module.exports = {isSignedByCloudPayments};