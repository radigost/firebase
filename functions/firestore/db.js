// db.js

const admin = require("firebase-admin");

let db;

if (process.env.NODE_ENV !== "test") {
    db = admin.firestore();
}

exports.getDb = () => {
    return db;
};

exports.setDb = (database) => {
    db = database;
};
