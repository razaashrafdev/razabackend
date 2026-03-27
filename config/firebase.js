/**
 * Firebase configuration (optional)
 *
 * This backend currently authenticates using JWT + environment variables.
 * We keep Firebase config here in case you want to later extend the backend
 * to use Firebase services.
 */

const firebaseConfig = {
  apiKey: "AIzaSyCPJqG53maj5B2hcxH5jdF7gO9w8wzN3wk",
  authDomain: "portfolio-9a03c.firebaseapp.com",
  projectId: "portfolio-9a03c",
  storageBucket: "portfolio-9a03c.firebasestorage.app",
  messagingSenderId: "940664491313",
  appId: "1:940664491313:web:c831104669a9ca259eb410",
  measurementId: "G-J2Z5ZG3KNE",
};

module.exports = {
  firebaseConfig,
};

