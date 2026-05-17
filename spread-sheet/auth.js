import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';


// auth with JWT
const auth = new JWT({
  keyFile: '../discord-tracker-496601-f345007d1174.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});


//client, used for api calls, contains sheets
const doc = new GoogleSpreadsheet('clupXMzoZ9tYnOoQxGkJWl8AW0OritfqqwvY', serviceAccountAuth);







async function run() {
// loads doc properties first, google-apreadsheet inits empty untill this
  await doc.loadInfo(); 
  
// page 1 - Data Log
  const dogLog = doc.sheetsByTitle['dogLog'];
  
// page 2 - Events
  const events = doc.sheetsByTitle['eventst'];

  // Read data from the targeted page
  const rows = await dogLog.getRows();
  console.log(rows[0].get('users'));
}
run();


// URL
// https://docs.google.com/spreadsheets/d/1CHhotx_clupXMzoZ9tYnOoQxGkJWl8AW0OritfqqwvY/edit?gid=0#gid=0



// get in MAIN.JS