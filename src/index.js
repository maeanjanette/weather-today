const apiKey = "2a6c08410f44ce2149f03a0511abc953";
const unit = "metric";
const conditions = new Map();
conditions.set("2\\d\\d", { name: "Thunderstorm", icon: "stormy.svg" });
conditions.set("3\\d\\d", { name: "Drizzle", icon: "drizzle.svg" });
conditions.set("5\\d\\d", { name: "Rain", icon: "rainy.svg" });
conditions.set("6\\d\\d", { name: "Snow", icon: "snowy.svg" });
conditions.set("7\\d\\d", { name: "Atmosphere", icon: "windy.svg" });
conditions.set("8\\d[1-4]", { name: "Clouds", icon: "cloudy.svg" });
conditions.set("800", { name: "Clear", icon: "sunny.svg" });

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const searchForm = document.querySelector("#search-city-form");
const currentLocation = document.querySelector("#pin-location-icon");

const dateTime = document.querySelector("#date-time-info");
const currentCity = document.querySelector("#current-city");
const currentTemp = document.querySelector("#current-temperature");
const currentWeather = document.querySelector("#current-weather");
const currentWeatherIcon = document.querySelector("#current-weather-icon");
const currentHi = document.querySelector("#current-hi");
const currentLo = document.querySelector("#current-lo");
const currentFeelsLike = document.querySelector("#current-feels-like");
const currentHumidity = document.querySelector("#current-humidity");
const currentWind = document.querySelector("#current-wind");

const forecastDateList = document.querySelectorAll(".row-forecast .date-info");
const forecastHi = document.querySelectorAll(".forecast-hi .temperature");
const forecastLo = document.querySelectorAll(".forecast-lo .temperature");
const forecastIcon = document.querySelectorAll(".forecast-icon");

const celsiusUnit = document.querySelector("#celsius-unit");
const fahrenheitUnit = document.querySelector("#fahrenheit-unit");

function capitalize(searchedCityName) {
  let words = searchedCityName.split(" ");
  let capitalizedWords = [];

  words.forEach((word) => {
    capitalizedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
  });

  return capitalizedWords.join(" ");
}

function toFahrenheit(temp) {
  temp = temp.replace("°", "");
  return Math.round((temp * 9) / 5 + 32);
}

function toCelsius(temp) {
  temp = temp.replace("°", "");
  return Math.round(((temp - 32) * 5) / 9);
}

function formatUnit(event) {
  let units = document.querySelectorAll(".unit");
  units.forEach((unit) => unit.setAttribute("style", "font-weight: 300"));
  event.target.setAttribute("style", "font-weight: 700");
}

function convertTemp(event) {
  formatUnit(event);
  let eventUnit = event.target.innerHTML;
  let temperatures = document.querySelectorAll(".temperature");
  temperatures.forEach((temp) => {
    if (eventUnit === "°C") {
      temp.innerHTML = toCelsius(temp.innerHTML);
    } else {
      temp.innerHTML = toFahrenheit(temp.innerHTML);
    }
  });
}

function updateForecastInfo(response) {
  let forecastList = response.data.list;
  for (let i = 0; i < 5; i++) {
    forecastHi[i].innerHTML = Math.round(forecastList[i * 8].main.temp_max);
    forecastLo[i].innerHTML = Math.round(forecastList[i * 8].main.temp_min);

    let icon = getWeatherIcon(forecastList[i * 8].weather[0].id);
    forecastIcon[i].src = `img/${icon}`;
  }
}

function updateForecastDate(now) {
  for (let i = 0; i < forecastDateList.length; i++) {
    let day = days[now.getDay() + (i + 1)];
    let date = `${now.getMonth() + 1}/${now.getDate() + (i + 1)}`;
    forecastDateList[i].innerHTML = `${day} ${date}`;
  }
}

function updateForecast(now, cityName) {
  updateForecastDate(now);

  cityName = cityName.toLowerCase();
  let forecastApi = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=${unit}&appid=${apiKey}`;

  axios.get(forecastApi).then(updateForecastInfo);
}

function convertWindSpeed(rawWind) {
  return Math.round(rawWind * 3.6);
}

function updateWind(wind) {
  let windSpeed = convertWindSpeed(wind.speed);
  currentWind.innerHTML = windSpeed;
}

function getWeatherIcon(weatherId) {
  let filteredKeys = [...conditions.keys()].filter((key) =>
    new RegExp(key).test(weatherId)
  );

  let key = filteredKeys[0];
  return conditions.get(key).icon;
}

function updateWeatherDesc(weatherDesc) {
  let weatherId = weatherDesc[0].id;
  let icon = getWeatherIcon(weatherId);

  currentWeather.innerHTML = capitalize(weatherDesc[0].description);
  currentWeatherIcon.src = `img/${icon}`;
}

function updateWeather(weather) {
  currentTemp.innerHTML = Math.round(weather.temp);
  currentHi.innerHTML = Math.round(weather.temp_max);
  currentLo.innerHTML = Math.round(weather.temp_min);
  currentFeelsLike.innerHTML = Math.round(weather.feels_like);
  currentHumidity.innerHTML = weather.humidity;
}

function updateCity(cityName) {
  currentCity.innerHTML = capitalize(cityName);
}

function convertAndFormatTime(defaultTime) {
  let hours = defaultTime.getHours();
  let minutes = defaultTime.getMinutes();
  let ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  let formattedTime = `${hours}:${minutes} ${ampm}`;
  return formattedTime;
}

function updateDateTime(now) {
  let time = convertAndFormatTime(now);

  dateTime.innerHTML = `${days[now.getDay()]}, ${
    months[now.getMonth()]
  } ${now.getDate()} ${time}`;
}

function computeCurrentTime(timezone) {
  let now = new Date();

  let nowTimezoneOffset = now.getTimezoneOffset() * 60 * 1000;
  let utcMillis = Date.now();
  let timezoneNow = utcMillis + nowTimezoneOffset + timezone * 1000;

  return new Date(timezoneNow);
}

function updatePage(response) {
  let data = response.data;
  updateCity(data.name);
  updateWeather(data.main);
  updateWeatherDesc(data.weather);
  updateWind(data.wind);

  let now = computeCurrentTime(data.timezone);
  updateDateTime(now);
  updateForecast(now, data.name);
}

function searchCityWeather(event) {
  event.preventDefault();
  let cityName = document.querySelector("#search").value;
  cityName = cityName.trim();
  cityName = cityName.toLowerCase();
  let weatherApi = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=${unit}&appid=${apiKey}`;

  axios.get(weatherApi).then(updatePage);
}

function showCurrentWeather(position) {
  let latitude = position.coords.latitude;
  let longitude = position.coords.longitude;

  let geoWeatherApi = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${apiKey}`;

  axios.get(geoWeatherApi).then(updatePage);
}

function locateUser() {
  navigator.geolocation.getCurrentPosition(showCurrentWeather);
}

locateUser();

searchForm.addEventListener("submit", searchCityWeather);
currentLocation.addEventListener("click", locateUser);
celsiusUnit.addEventListener("click", convertTemp);
fahrenheitUnit.addEventListener("click", convertTemp);
