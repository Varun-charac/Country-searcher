require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const request = require("request");
const worldClock = require(__dirname+"/worldClock.js");

const app = express();

let countryList = []; //restcountries  API response
let countryAndCityList = [], citiesList = []; //countriesnow API response
let name, capital, population, demonym, flagUrl,
    currencyCode, currencyName, currencySymbol,
    timezone, dateTimeArr, area, language, nativeName;
let temp, description, icon, iconUrl; //openweathermap API
let cityName = "";
let loadHome = false;

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  //access countries and its cities from countriesnow.space
  if(!loadHome) {
    https.get("https://countriesnow.space/api/v0.1/countries", function(response) {
      let chunks = [];
      response.on("data", function(data) {
        chunks.push(data);
      }).on("end", function() {
        let data = Buffer.concat(chunks);
        let countryAndCityInfo = JSON.parse(data);
        countryAndCityList = countryAndCityInfo.data;
      });
    });
    //access country list from restcountries.eu
    https.get("https://restcountries.eu/rest/v2/all", function(response) {
      let chunks = [];
      response.on("data", function(data) {
        chunks.push(data);
      }).on("end", function() {
        let data = Buffer.concat(chunks);
        countryList = JSON.parse(data);
        res.render('index', {countryList: countryList});
      });
    });
    loadHome = true;
  } else {
    res.render('index', {countryList: countryList});
  }
});

app.get("/country-info/:cName", function(req, res) {
  const countryName = req.params.cName;
  const countryUrl = "https://restcountries.eu/rest/v2/name/" + countryName + "?fullText=true";
  let chunks = [];

  https.get(countryUrl, function(response) {
    console.log(response.statusCode);
    if(response.statusCode != 404) {

      response.on("data", function(data) {
        chunks.push(data);

      }).on("end", function() {
        let data = Buffer.concat(chunks);
        let countryInfo = JSON.parse(data);
        name = countryInfo[0].name;
        capital = countryInfo[0].capital;
        population = Intl.NumberFormat('en-US').format(countryInfo[0].population);
        demonym = countryInfo[0].demonym;
        flagUrl = countryInfo[0].flag;
        currencyCode = countryInfo[0].currencies[0].code;
        currencyName = countryInfo[0].currencies[0].name;
        currencySymbol = countryInfo[0].currencies[0].symbol;
        timezone = countryInfo[0].timezones;
        dateTimeArr = worldClock.getDateTime(timezone);
        area = Intl.NumberFormat('en-US').format(countryInfo[0].area);
        language = countryInfo[0].languages[0].name;
        nativeName = countryInfo[0].languages[0].nativeName;
        cityName=""; temp=""; description=""; iconUrl = "";

        for(let i=0; i<countryAndCityList.length; i++) {
          if(countryName.includes(countryAndCityList[i].country)) {
            citiesList = countryAndCityList[i].cities;
            let unique = citiesList.filter(function(value, index, self) {
              return self.indexOf(value) === index;
            });
            citiesList = unique;
            res.render('country-info', {name: name, capital: capital, population: population, demonym: demonym, flag: flagUrl,
                                        currency: currencyName, currencyCode: currencyCode, currencySymbol: currencySymbol,
                                        timezone: timezone, dateTimeArr: dateTimeArr, area: area, language: language, nativeName: nativeName,
                                        temp: temp, description: description, iconUrl: iconUrl,
                                        citiesList: citiesList, cityName: cityName});
            break;
          }
          else if(i == countryAndCityList.length-1) {
            citiesList = [];
            res.render('country-info', {name: name, capital: capital, population: population, demonym: demonym, flag: flagUrl,
                                        currency: currencyName, currencyCode: currencyCode, currencySymbol: currencySymbol,
                                        timezone: timezone, dateTimeArr: dateTimeArr, area: area, language: language, nativeName: nativeName,
                                        temp: temp, description: description, iconUrl: iconUrl,
                                        citiesList: citiesList, cityName: cityName});
          }
        }

      });

    } else if(response.statusCode == 404) {res.send("Sorry found no matching result.");}
  });

});

app.post("/", function(req, res) {
    const countryName = req.body.cName;
    res.redirect("/country-info/"+countryName);
});

app.post("/country-info/:cName", function(req, res) {
  let cityName = req.body.cty;
  let weatherUrl = "https://api.openweathermap.org/data/2.5/weather?q="+cityName+"&appid="+process.env.API_KEY+"&units=metric";
  https.get(weatherUrl, function(response) {
    response.on("data", function(data) {

      console.log(response.statusCode);
      if(response.statusCode != 404) {
        let weatherData = JSON.parse(data);
        temp = weatherData.main.temp;
        description = weatherData.weather[0].description;
        icon = weatherData.weather[0].icon;
        iconUrl = "http://openweathermap.org/img/wn/"+icon+"@2x.png";

        res.render('country-info', {name: name, capital: capital, population: population, demonym: demonym, flag: flagUrl,
                                    currency: currencyName, currencyCode: currencyCode, currencySymbol: currencySymbol,
                                    timezone: timezone, dateTimeArr: dateTimeArr, area: area, language: language, nativeName: nativeName,
                                    temp: temp, description: description, iconUrl: iconUrl,
                                    citiesList: citiesList, cityName: cityName});
      } else if(response.statusCode == 404){
        res.render('country-info', {name: name, capital: capital, population: population, demonym: demonym, flag: flagUrl,
                                    currency: currencyName, currencyCode: currencyCode, currencySymbol: currencySymbol,
                                    timezone: timezone, dateTimeArr: dateTimeArr, area: area, language: language, nativeName: nativeName,
                                    temp: "", description: "No info available", iconUrl: "",
                                    citiesList: citiesList, cityName: cityName});
      }
    });
  });
});


app.listen(3000, function() {
  console.log("Server running on port 3000");
});
