const admin = require("firebase-admin");

// Load Firebase service account credentials
const serviceAccount = require("../firebase-service-account.json"); // Ensure this file exists

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const messaging = admin.messaging();

// Function to send push notification
const sendPushNotification = async (deviceToken, title, body) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
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
