const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Root folder se index.html serve karega
app.use(express.static(__dirname));
app.use(express.json());

app.post("/api/location", async (req, res) => {
  try {
    const { latitude, longitude, accuracy, consent } = req.body;

    if (consent !== true) {
      return res.status(400).json({
        ok: false,
        error: "Consent required"
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return res.status(400).json({
        ok: false,
        error: "Invalid coordinates"
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Telegram environment variables missing");

      return res.status(500).json({
        ok: false,
        error: "Telegram configuration missing"
      });
    }

    const mapUrl =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    const message =
`📍 Location Shared

Latitude: ${latitude}
Longitude: ${longitude}
Accuracy: ${Math.round(accuracy || 0)} meters

🗺️ ${mapUrl}`;

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      }
    );

    const telegramData = await telegramResponse.json();

    console.log("Telegram status:", telegramResponse.status);
    console.log(
      "Telegram response:",
      JSON.stringify(telegramData)
    );

    if (!telegramResponse.ok || !telegramData.ok) {
      return res.status(502).json({
        ok: false,
        error: "Telegram rejected the message"
      });
    }

    res.json({
      ok: true,
      message: "Location sent successfully"
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
