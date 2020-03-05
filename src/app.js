const url = 'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc%2CCountry_Region%20asc%2CProvince_State%20asc&resultOffset=0&resultRecordCount=1000&cacheHint=false';
const maxDiffMs = 1000 * 60 * 60;

const version = '1.1.0';

if (localStorage.version !== version) {
  localStorage.clear();
  localStorage.version = version;
}

const elements = {
  yourLocation: document.querySelector('#your-location'),
  closestLocation: document.querySelector('#closest-location'),
  distance: document.querySelector("#distance"),
  confirmed: document.querySelector("#confirmed"),
  deaths: document.querySelector("#deaths"),
  recovered: document.querySelector("#recovered"),
  updated: document.querySelector('#updated'),
  locationButton: document.querySelector('#locationButton'),
  refreshButton: document.querySelector('#refreshButton'),
  lastDataRequest: document.querySelector('#lastDataRequest'),
  locationError: document.querySelector('#locationError'),
  casesError: document.querySelector('#casesError'),
  active: document.querySelector('#active'),
};

function getData() {
  const cacheDiff = Date.now() - localStorage.cacheTime;
  elements.lastDataRequest.textContent = new Date(+localStorage.cacheTime).toLocaleString();
  if (localStorage.cacheTime && cacheDiff < maxDiffMs && localStorage.cacheData) return Promise.resolve(JSON.parse(localStorage.cacheData));
  return fetch(url)
    .then(response => response.json())
    .then(json => {
      localStorage.cacheData = JSON.stringify(json.features);
      localStorage.cacheTime = Date.now();
      elements.lastDataRequest.textContent = new Date(+localStorage.cacheTime).toLocaleString();
      return json.features;
    }).catch(() => {
      return [];
    });
}

function getDistances([features, location]) {
  const distances = features
    .filter(({ attributes }) => (attributes.Confirmed - attributes.Recovered) > 0)
    .map(({ attributes }) => {
    attributes.Active = attributes.Confirmed - attributes.Recovered;
    attributes.distance_kms = getDistance(location.latitude, location.longitude, attributes.Lat, attributes.Long_);
    attributes.distance_miles = attributes.distance_kms * 0.6213712;
    return attributes;
  });
  distances.sort((a, b) => a.distance_kms - b.distance_kms);
  return {
    location,
    closest: distances[0],
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

function getLocation(useFineLocation) {
  if (localStorage.useFineLocation === 'true' || useFineLocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((location) => {
        localStorage.useFineLocation = true;
        elements.locationButton.style.display = 'none';
        resolve(location.coords);
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
  elements.closestLocation.textContent = value;
  elements.distance.textContent = value;
  elements.confirmed.textContent = value;
  elements.deaths.textContent = value;
  elements.recovered.textContent = value;
  elements.active.textContent = value;
  elements.updated.textContent = 'Never';
  elements.lastDataRequest.textContent = 'Never';
}

function showInfo({ location, closest }) {
  const unknown = 'Unknown';
  if (location.city === unknown) {
    elements.locationError.style.display = '';
    elements.yourLocation.textContent = unknown;
    setAllCaseInfo(unknown);
  } else if (!closest) {
    if (localStorage.useFineLocation === 'true') {
      elements.yourLocation.textContent = [location.latitude.toFixed(4), location.longitude.toFixed(4)].join(', ');
    } else {
      elements.yourLocation.textContent = [location.city, location.region_code, location.country].join(', ');
    }
    setAllCaseInfo(unknown);
    elements.casesError.style.display = '';
  } else {
    if (localStorage.useFineLocation === 'true') {
      elements.yourLocation.textContent = [location.latitude.toFixed(4), location.longitude.toFixed(4)].join(', ');
    } else {
      elements.yourLocation.textContent = [location.city, location.region_code, location.country].join(', ');
    }
    setTimeout(() => {
      elements.closestLocation.textContent = [closest.Province_State, closest.Country_Region].filter(i => i).join(', ');
      elements.distance.textContent = `${closest.distance_miles.toFixed(1)} miles`;
      elements.confirmed.textContent = closest.Confirmed;
      elements.active.textContent = closest.Active;
      elements.deaths.textContent = closest.Deaths;
      elements.recovered.textContent = closest.Recovered;
      elements.updated.textContent = new Date(closest.Last_Update).toLocaleString();  
    }, 500);
  }
}

function render(useFineLocation) {
  elements.locationError.style.display = 'none';
  elements.casesError.style.display = 'none';
  const loading = 'Loading...';
  elements.yourLocation.textContent = loading;
  elements.closestLocation.textContent = loading;
  elements.distance.textContent = loading;
  elements.confirmed.textContent = loading;
  elements.deaths.textContent = loading;
  elements.recovered.textContent = loading;
  elements.updated.textContent = loading;  
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
