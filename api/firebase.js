// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
var firebase = require("firebase/app");
const admin = require('firebase-admin');
const functions = require('firebase-functions');
var log = require('./logger.js');


// Add the Firebase products that you want to use
require("firebase/auth");
log.info("requiring firebase/auth");
require("firebase/database");
log.info("requiring firebase/database");


// TODO: Replace the following with your app's Firebase project configuration
var firebaseConfig = {
    apiKey: "AIzaSyBNMCq_OiijT-Xtpx06-TurDmh_RE9ZnhY",
    authDomain: "recipes-71c4b.firebaseapp.com",
    databaseURL: "https://recipes-71c4b.firebaseio.com",
    projectId: "recipes-71c4b",
    storageBucket: "recipes-71c4b.appspot.com",
    messagingSenderId: "414454595052",
    appId: "1:414454595052:web:a35f538d49f4b77827d4c9",
    measurementId: "G-QF2R2JF843"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

log.info("===================================");
log.info("       Initialized Firebase ");
log.info("===================================");


// admin setup cloud storage db
let serviceAccount = require('../recipes-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let db = admin.firestore();


// pass the object back
exports.firebase = firebase;
exports.db = db;