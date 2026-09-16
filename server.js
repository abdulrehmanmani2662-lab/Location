const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(__dirname));

app.post("/api/location", async (req,res) => {

    try{

        const {
            latitude,
            longitude,
            accuracy,
            consent
        } = req.body;

        if(consent !== true){
            return res.status(400).json({
                ok:false,
                error:"Location consent required"
            });
        }

        if(
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ){
            return res.status(400).json({
                ok:false,
                error:"Invalid location data"
            });
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if(!token || !chatId){

            console.error("Telegram variables missing");

            return res.status(500).json({
                ok:false,
                error:"Telegram configuration missing"
            });
        }

        const map =
            `https://www.google.com/maps?q=${latitude},${longitude}`;

        const message =
`📍 LOCATION SHARED

Latitude: ${latitude}
Longitude: ${longitude}
Accuracy: ${Math.round(accuracy || 0)} meters

🗺️ Google Maps:
${map}`;

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    chat_id:chatId,
                    text:message
                })
            }
        );

        const telegramData =
            await telegramResponse.json();

        console.log(
            "Telegram status:",
            telegramResponse.status
        );

        console.log(
            "Telegram response:",
            JSON.stringify(telegramData)
        );

        if(!telegramData.ok){

            return res.status(502).json({
                ok:false,
                error:
                    telegramData.description ||
                    "Telegram rejected request"
            });
        }

        return res.json({
            ok:true
        });

    }catch(error){

        console.error("Server error:",error);

        return res.status(500).json({
            ok:false,
            error:"Server error"
        });
    }
});

app.listen(PORT,()=>{
    console.log(
        `Server running on port ${PORT}`
    );
});
