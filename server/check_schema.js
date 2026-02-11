const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    console.log("--- Comments Schema ---");
    db.each("SELECT sql FROM sqlite_master WHERE type='table' AND name='Comments'", (err, row) => {
        console.log(row.sql);
    });

    console.log("\n--- Dependencies Schema ---");
    db.each("SELECT sql FROM sqlite_master WHERE type='table' AND name='Dependencies'", (err, row) => {
        console.log(row.sql);
    });
});

db.close();
