const request = require('request');
const cheerio = require('cheerio');
const TeleBot = require('telebot');
const schedule = require('node-schedule');

const bot = new TeleBot('');

let lounaatData = {};
let lounaatArray = ["mauno-electrocity", "mauno", "sodexo-ict", "unica-dental", "china-jade", "snack-city", "alabama",
"herkutus", "unica-delica", "unica-deli-pharma", "unica-mikro", "turun-upseerikerho",
"sodexo-old-mill", "sodexo-lemminkaisenkatu", "kupittaan-paviljonki", "unica-brygge", "juvenes-monttu",
"unica-assarin-ullakko", "mauno-deli", "delhi-darbar", "ravintola-kuori", "unica-tottisalmi", "veritas-stadion",
"unica-galilei", "gado-gado-lunch-party", "hus-lindman", "cafe-fanriken", "cafe-karen", "pinella", "m-kitchen-cafe"];

/*request('https://www.lounaat.info/lounas/sodexo-ict/turku', function (error, response, html) {
  if (!error && response.statusCode == 200) {
    let $ = cheerio.load(html);
    $('.item-body').each(function(i, element){
      let a = $(this).find('.dish');
      console.log(a.text());
    });
  }
});*/



async function getLounaatData(lounaatArray) {
    
    let o = 0;    
    let lounasLista = {};
    for (const item of lounaatArray) {
        
        lounasLista[item] = {};
     
        request('https://www.lounaat.info/lounas/'+item.replace('ä','a').replace('ö','o')+'/turku', async function (error, response, html) {
            if(!error && response.statusCode == 200) {
            let $ = await cheerio.load(html);
            
            await $('#menu').find('.item').each(function(i,element) {
                
                lounasLista[item][$(this).find('.item-header').text()] = $(this).find('.dish').text();
                
                
            });
            
            
            o++;
            if (o == lounaatArray.length) {
                
                lounaatData = lounasLista;
                formatAndSendData(lounaatData);
            }
            } else {
                console.log(error + ' ' + response.statusCode);
            }
        });
        
    }
    
    
   
}


function deleteData(date, data) {
    for (var item in data) {
        for(var paiva in data[item]) {
            if(paiva.includes(date)) {
                delete data[item][paiva];
            }
        }
    }
    lounaatData = data;
    
}

function formatAndSendData(data) {
 for (var item in data) {
     
     for (var subItem in data[item]) {
         if (data[item][subItem] == '') {
         delete data[item][subItem];
         }
     }
     
 }
  lounaatData = data;
  
  //searchForMsg(lounaatData, msg);
  console.log('data sent');
  
}

function formatLounasPaikka(string) {
    var arr = string.split('-');
    for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i][0].toUpperCase() + arr[i].slice(1);
    }
    return arr.join(" ");
}

function searchForMsg(data, msg) {
    let found = false;
    for (var lounasPaikka in data) {
        for (var paiva in data[lounasPaikka]) {
            
            if(data[lounasPaikka][paiva].toLowerCase().includes(msg.text.toLowerCase())) {
                msg.reply.text('Hakusanalla: "' + msg.text + '" löytyy ruokaa seuraavasta ravintolasta: \n'
                + formatLounasPaikka(lounasPaikka)
                + '\n' + paiva + '\n' + 'https://www.lounaat.info/lounas/'+lounasPaikka.replace('ä','a').replace('ö','o')+'/turku');
                found = true;
                
            }
            
        }
    }
    if (!found) {
        msg.reply.text('Hakusanalla: "' + msg.text + '" ei löytynyt mitään');
    }
}

async function runApp() {
    getLounaatData(lounaatArray);
    var job = schedule.scheduleJob('00 30 05 * * 1', function () {
       getLounaatData(lounaatArray);
       console.log(job.nextInvocation());
    });
    var deleteMonday = schedule.scheduleJob('00 00 01 * * 2', function() {
        deleteData('Maanantai', lounaatData);
        console.log(deleteMonday.nextInvocation());
    });
    var deleteTuesday = schedule.scheduleJob('00 00 01 * * 3', function() {
        deleteData('Tiistai', lounaatData);
        console.log(deleteTuesday.nextInvocation());
    });
    var deleteWednesday = schedule.scheduleJob('00 00 01 * * 4', function() {
        deleteData('Keskiviikko', lounaatData);
        console.log(deleteWednesday.nextInvocation());
    });
    var deleteThursday = schedule.scheduleJob('00 00 01 * * 5', function() {
        deleteData('Torstai', lounaatData);
        console.log(deleteThursday.nextInvocation());
    });
    var deleteFriday = schedule.scheduleJob('00 00 01 * * 6', function() {
        deleteData('Perjantai', lounaatData);
        console.log(deleteFriday.nextInvocation());
    });
    var deleteSaturday = schedule.scheduleJob('00 00 01 * * 7', function() {
        deleteData('Lauantai', lounaatData);
        console.log(deleteSaturday.nextInvocation());
    });
    console.log(job.nextInvocation());
    console.log(new Date());
    
}

runApp();
bot.on('text', (msg) => {
    console.log('message received');
    if(msg.text !== "/start") {
    searchForMsg(lounaatData, msg);
    console.log('Message Sent!')
    }
  
    
});
bot.on('/start', (msg) => {
   msg.reply.text('Tällä voit etsiä Turun alueen lounaita. Kirjoita ruoan nimi, jota haluat etsiä.'); 
});
bot.start();
