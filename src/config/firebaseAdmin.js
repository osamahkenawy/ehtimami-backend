const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

const sendPushNotification = async (deviceToken, title, body) => {
  const message = {
    notification: { title, body },
    token: deviceToken,
  };

  try {
    await messaging.send(message);
    console.log("✅ Push notification sent successfully");
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
  }
};

module.exports = { sendPushNotification };
