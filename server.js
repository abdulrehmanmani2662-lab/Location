const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

function validNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

app.post("/api/location", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      accuracy,
      consent
    } = req.body;

    // Require explicit consent from the website.
    if (consent !== true) {
      return res.status(400).json({
        error: "Location consent is required."
      });
    }

    if (
      !validNumber(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        error: "Invalid latitude."
      });
    }

    if (
      !validNumber(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        error: "Invalid longitude."
      });
    }

    if (
      !validNumber(accuracy) ||
      accuracy < 0
    ) {
      return res.status(400).json({
        error: "Invalid accuracy."
      });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("Telegram credentials are missing.");
      return res.status(500).json({
        error: "Server configuration error."
      });
    }

    const mapsUrl =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    const message =
      `📍 Location shared with consent\n\n` +
      `Latitude: ${latitude.toFixed(6)}\n` +
      `Longitude: ${longitude.toFixed(6)}\n` +
      `Accuracy: ${Math.round(accuracy)} m\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      `🗺️ ${mapsUrl}`;

    const telegramUrl =
      `https://api.telegram.org/bot${token}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    if (!telegramResponse.ok) {
      console.error(
        "Telegram error:",
        await telegramResponse.text()
      );

      return res.status(502).json({
        error: "Telegram request failed."
      });
    }

    res.json({
      success: true
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Internal server error."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
