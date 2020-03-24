const nytPageUrl = 'https://cors-anywhere.herokuapp.com/https://www.nytimes.com/interactive/2020/us/coronavirus-us-cases.html';
const maxDiffMs = 1000 * 60 * 60;

const version = '1.2.0';

if (localStorage.version !== version) {
  localStorage.clear();
  localStorage.version = version;
}

const elements = {
  yourLocation: document.querySelector('#your-location'),
  confirmed: document.querySelector("#confirmed"),
  deaths: document.querySelector("#deaths"),
  locationButton: document.querySelector('#locationButton'),
  refreshButton: document.querySelector('#refreshButton'),
  lastDataRequest: document.querySelector('#lastDataRequest'),
  locationError: document.querySelector('#locationError'),
  casesError: document.querySelector('#casesError'),
  active: document.querySelector('#active'),
  distanceSelect: document.querySelector('#distanceSelect'),
  locationTableBody: document.querySelector('tbody'),
};

function getData() {
  const cacheDiff = Date.now() - localStorage.cacheTime;
  elements.lastDataRequest.textContent = new Date(+localStorage.cacheTime || Date.now()).toLocaleString();
  if (localStorage.cacheTime && cacheDiff < maxDiffMs && localStorage.nytData) return Promise.resolve(JSON.parse(localStorage.nytData));
  return fetch(nytPageUrl)
    .then(response => response.text())
    .then(html => {
      const page = document.createElement('div');
      page.innerHTML = html;
      const link = page.querySelector('link[rel="preload"]');
      const baseUrl = link.getAttribute('href').match(/https\:\/\/static01\.nyt\.com\/newsgraphics\/2020\/01\/21\/china-coronavirus\/(.*)\/build\/js\/main\.js/);
      const buildId = baseUrl[1];
      const url = `https://static01.nyt.com/newsgraphics/2020/01/21/china-coronavirus/${buildId}/build/js/chunks/model-lite.js`;
      return fetch(url)
      .then(response => response.text())
      .then(js => {
        js = js.replace(/export {(.*)/, '');
        eval(js);
        const data = {
          countries,
          us_cases,
          us_counties,
        };
        const cases = {};
        cases.us_cases = data.us_counties.map(({
          county_id: id,
          confirmed,
          deaths,
          lat: latitude,
          lon: longitude,
          county,
          postal
        }) => ({
          id,
          confirmed,
          deaths,
          latitude,
          longitude,
          name: `${county} ${postal === 'LA' ? 'Parish' : postal === 'AK' ? 'Borough' : 'County'}, ${postal}`
        }));
        cases.world_cases = data.countries.map(({
          nyt_id: id,
          unique: name,
          confirmed,
          deaths,
          lat: latitude,
          lon: longitude,
        }) => ({
          id,
          confirmed,
          deaths,
          latitude,
          longitude,
          name,
        }))
        localStorage.cacheTime = Date.now();
        localStorage.nytData = JSON.stringify(cases);
        return cases;
      });
    });
}

let firstRun = true;
function getDistances([locations, location]) {
  const items = locations.us_cases.concat(locations.world_cases.filter(item => item.name !== 'US'));
  const distances = items
    .map((item) => {
    item.distance_kms = getDistance(location.latitude, location.longitude, item.latitude, item.longitude);
    item.distance_miles = item.distance_kms * 0.6213712;
    const row = document.createElement('tr');
    const classNames = {
      distance_miles: 'blue',
      name: 'purple',
      confirmed: 'yellow',
      deaths: 'red',
    };
    ['distance_miles', 'name', 'confirmed', 'deaths']
      .forEach(prop => {
        const column = document.createElement('td');
        if (prop === 'distance_miles') {
          column.textContent = item[prop].toFixed(1);
        } else if (prop === 'Last_Update') {
          column.textContent = new Date(item[prop]).toLocaleString();
        } else {
          column.textContent = item[prop];
        }
        column.classList.add(classNames[prop]);
        row.appendChild(column);
      });
    item.element = row;
    return item;
  });
  distances.sort((a, b) => a.distance_kms - b.distance_kms);
  if (firstRun) {
    elements.distanceSelect.value = 500;
    firstRun = false;
  }
  const maxDistance = +elements.distanceSelect.value;
  const total = distances.reduce((total, item) => {
    if (item.distance_miles < maxDistance) {
      Object.keys(total).forEach(prop => {
        if (prop === 'locations') return;
        total[prop] += item[prop];
      });
      total.locations.push(item);
    }
    return total;
  }, {
    confirmed: 0,
    deaths: 0,
    locations: []
  });
  total.distance_miles = maxDistance;

  return {
    location,
    closest: total // distances[0],
  };
}

function getDistance(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
}

function getIPLocation() {
  const cacheDiff = Date.now() - localStorage.cacheTime;
  if (localStorage.cacheTime && localStorage.cacheLocation && cacheDiff < maxDiffMs) return Promise.resolve(JSON.parse(localStorage.cacheLocation));
  return fetch('https://ipapi.co/json/')
    .then(response => response.json())
    .then(json => {
      localStorage.cacheLocation = JSON.stringify(json);
      localStorage.cacheTime = Date.now();
      return json;
    }).catch(error => {
      delete localStorage.cacheLocation;
      return {
        city: 'Unknown'
      };
    });
}

function getLocationFromCoords(coords) {
  const lookup = `${coords.latitude}, ${coords.longitude}`;
  if (localStorage[lookup]) return Promise.resolve(JSON.parse(localStorage[lookup]));
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`;
  return fetch(url)
    .then(res => res.json())
    .then(json => {
      const location = {
        city: json.address.city || json.address.village,
        region_code: json.address.state,
        county: json.address.county,
        country: json.address.country_code.toUpperCase(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      localStorage[lookup] = JSON.stringify(location);
      return location;
    })
    .catch(() => ({
      city: location,
      region_code: '',
      country: '',
      latitude: coords.latitude,
      longitude: coords.longitude,
    }))
}

function getLocation(useFineLocation) {
  if (localStorage.useFineLocation === 'true' || useFineLocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((location) => {
        localStorage.useFineLocation = true;
        elements.locationButton.style.display = 'none';
        resolve(getLocationFromCoords(location.coords));
      }, () => {
        localStorage.useFineLocation = false;
        elements.locationButton.style.display = '';
        resolve(getIPLocation());
      }, {
        timeout: 10000,
      });
    });
  }
  return getIPLocation();
}

function setAllCaseInfo(value) {
  elements.confirmed.textContent = value;
  elements.deaths.textContent = value;
  elements.lastDataRequest.textContent = 'Never';
}

function showInfo({ location, closest }) {
  const unknown = 'Unknown';
  if (location.city === unknown) {
    elements.locationError.style.display = '';
    elements.yourLocation.textContent = unknown;
    setAllCaseInfo(unknown);
  } else if (!closest) {
    elements.yourLocation.textContent = [location.city, location.region_code, location.country].filter(i => i).join(', ');
    setAllCaseInfo(unknown);
    elements.casesError.style.display = '';
  } else {
    if (location.country === 'US') {
      elements.yourLocation.textContent = [location.county || location.city, location.region_code].filter(i => i).join(', ');
    } else {
      elements.yourLocation.textContent = [location.city, location.region_code, location.country].filter(i => i).join(', ');
    }
    elements.locationTableBody.innerHTML = '';
    closest
      .locations.forEach(location => {
        elements.locationTableBody.appendChild(location.element);
      });
    elements.confirmed.textContent = closest.confirmed;
    elements.deaths.textContent = closest.deaths;
  }
}

function render(useFineLocation) {
  elements.locationError.style.display = 'none';
  elements.casesError.style.display = 'none';
  Promise.all([
    getData(),
    getLocation(useFineLocation),
  ])
    .then(getDistances)
    .then(showInfo);

  setTimeout(render, maxDiffMs);
}

render(false);

elements.locationButton.addEventListener('click', () => {
  render(true);
  elements.locationButton.style.display = 'none';
});

elements.refreshButton.addEventListener('click', () => {
  delete localStorage.cacheData;
  delete localStorage.cacheTime;
  render();
});

elements.distanceSelect.addEventListener('input', (event) => {
  render();
});
