require("any-date-parser");
const { JWT } = require("google-auth-library");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const TelegramBot = require("node-telegram-bot-api");
const http = require("http");

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
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells("A1:B999");
    for(let i = 0; i < 999; i++) {
        let date = sheet.getCell(i, 0)?.formattedValue?.replace(/\s+/g, "");
        if(!date) break;
        date = Date.fromString(date);
        const name = sheet.getCell(i, 1)?.formattedValue;
        if(!name) break;
        bdays.push([date.getDate(), date.getMonth(), name]);
    }
    console.log(bdays);

    setInterval(async () => {
        const now = new Date();
        for(let i of bdays)
            if(now.getDate() == i[0] && now.getMonth() == i[1])
                bot.sendMessage(parseInt(CHAT), "Сегодня день рождения у " + i[2] + "! Поздравьте его/её!");
    }, 1000 * 60 * 60 * 24)
})();

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("OK");
}).listen(8080);