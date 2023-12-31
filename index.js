require("any-date-parser");
const { JWT } = require("google-auth-library");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const TelegramBot = require("node-telegram-bot-api");
const http = require("http");
const cron = require("node-cron");

let { TOKEN, SPREADSHEET, CHAT, EMAIL, KEY } = process.env;
KEY = KEY.replaceAll("\\n", "\n");
const bot = new TelegramBot(TOKEN, { "polling": true });

let bdays = [];

(async () => {
    const client = new JWT({
        "email": EMAIL,
        "key": KEY,
        "scopes": [
            "https://www.googleapis.com/auth/spreadsheets"
        ]
    });
    const doc = new GoogleSpreadsheet(SPREADSHEET, client);
    await doc.loadInfo();

    // Timezone is GMT, so we have to adjust for MSK
    // So 7:00 becomes 10:00 and 21:00 on December 31st becomes midnight on January 1st

    cron.schedule("0 7 * * *", async () => {
        bdays = [];
        const sheet = doc.sheetsByIndex[0];
        await sheet.loadCells("A1:B999");
        for(let i = 0; i < 999; i++) {
            let date = sheet.getCell(i, 0)?.formattedValue?.replace(/\s+/g, "");
            if(!date) continue;
            date = Date.fromString(date);
            const name = sheet.getCell(i, 1)?.formattedValue;
            if(!name) continue;
            bdays.push([date.getDate(), date.getMonth(), name]);
        }
        console.log(bdays);
        const now = new Date();
        for(let i of bdays)
            if(now.getDate() == i[0] && now.getMonth() == i[1])
                bot.sendMessage(parseInt(CHAT), "Сегодня день рождения у " + i[2] + "! Поздравьте его/её!");
    });
    cron.schedule("0 21 31 12 *", async () => {
        bot.sendMessage(parseInt(CHAT), "С Новым Годом!");
    });
})();

http.createServer((req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });
    res.end(JSON.stringify(bdays));
}).listen(8080);