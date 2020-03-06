parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"A2T1":[function(require,module,exports) {
function t(t,r){return n(t)||o(t,r)||e()}function e(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}function o(t,e){if(Symbol.iterator in Object(t)||"[object Arguments]"===Object.prototype.toString.call(t)){var o=[],n=!0,r=!1,a=void 0;try{for(var c,i=t[Symbol.iterator]();!(n=(c=i.next()).done)&&(o.push(c.value),!e||o.length!==e);n=!0);}catch(l){r=!0,a=l}finally{try{n||null==i.return||i.return()}finally{if(r)throw a}}return o}}function n(t){if(Array.isArray(t))return t}var r="https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc%2CCountry_Region%20asc%2CProvince_State%20asc&resultOffset=0&resultRecordCount=1000&cacheHint=false",a=36e5,c="1.2.0";localStorage.version!==c&&(localStorage.clear(),localStorage.version=c);var i={yourLocation:document.querySelector("#your-location"),closestLocation:document.querySelector("#closest-location"),distance:document.querySelector("#distance"),confirmed:document.querySelector("#confirmed"),deaths:document.querySelector("#deaths"),recovered:document.querySelector("#recovered"),updated:document.querySelector("#updated"),locationButton:document.querySelector("#locationButton"),refreshButton:document.querySelector("#refreshButton"),lastDataRequest:document.querySelector("#lastDataRequest"),locationError:document.querySelector("#locationError"),casesError:document.querySelector("#casesError"),active:document.querySelector("#active")};function l(){var t=Date.now()-localStorage.cacheTime;return i.lastDataRequest.textContent=new Date(+localStorage.cacheTime).toLocaleString(),localStorage.cacheTime&&t<a&&localStorage.cacheData?Promise.resolve(JSON.parse(localStorage.cacheData)):fetch(r).then(function(t){return t.json()}).then(function(t){return localStorage.cacheData=JSON.stringify(t.features),localStorage.cacheTime=Date.now(),i.lastDataRequest.textContent=new Date(+localStorage.cacheTime).toLocaleString(),t.features}).catch(function(){return[]})}function u(e){var o=t(e,2),n=o[0],r=o[1],a=n.filter(function(t){var e=t.attributes;return e.Confirmed-e.Recovered-e.Deaths>0}).map(function(t){var e=t.attributes;return e.Active=e.Confirmed-e.Recovered-e.Deaths,e.distance_kms=s(r.latitude,r.longitude,e.Lat,e.Long_),e.distance_miles=.6213712*e.distance_kms,e});return a.sort(function(t,e){return t.distance_kms-e.distance_kms}),{location:r,closest:a[0]}}function s(t,e,o,n){var r=.017453292519943295,a=Math.cos,c=.5-a((o-t)*r)/2+a(t*r)*a(o*r)*(1-a((n-e)*r))/2;return 12742*Math.asin(Math.sqrt(c))}function d(){var t=Date.now()-localStorage.cacheTime;return localStorage.cacheTime&&localStorage.cacheLocation&&t<a?Promise.resolve(JSON.parse(localStorage.cacheLocation)):fetch("https://ipapi.co/json/").then(function(t){return t.json()}).then(function(t){return localStorage.cacheLocation=JSON.stringify(t),localStorage.cacheTime=Date.now(),t}).catch(function(t){return delete localStorage.cacheLocation,{city:"Unknown"}})}function f(t){var e="".concat(t.latitude,", ").concat(t.longitude);if(localStorage[e])return Promise.resolve(JSON.parse(localStorage[e]));var o="https://nominatim.openstreetmap.org/reverse?format=json&lat=".concat(t.latitude,"&lon=").concat(t.longitude);return fetch(o).then(function(t){return t.json()}).then(function(o){var n={city:o.address.city,region_code:o.address.state,country:o.address.country_code.toUpperCase(),latitude:t.latitude,longitude:t.longitude};return localStorage[e]=JSON.stringify(n),n}).catch(function(){return{city:location,region_code:"",country:"",latitude:t.latitude,longitude:t.longitude}})}function y(t){return"true"===localStorage.useFineLocation||t?new Promise(function(t,e){navigator.geolocation.getCurrentPosition(function(e){localStorage.useFineLocation=!0,i.locationButton.style.display="none",t(f(e.coords))},function(){localStorage.useFineLocation=!1,i.locationButton.style.display="",t(d())},{timeout:1e4})}):d()}function g(t){i.closestLocation.textContent=t,i.distance.textContent=t,i.confirmed.textContent=t,i.deaths.textContent=t,i.recovered.textContent=t,i.active.textContent=t,i.updated.textContent="Never",i.lastDataRequest.textContent="Never"}function m(t){var e=t.location,o=t.closest;"Unknown"===e.city?(i.locationError.style.display="",i.yourLocation.textContent="Unknown",g("Unknown")):o?(i.yourLocation.textContent=[e.city,e.region_code,e.country].filter(function(t){return t}).join(", "),setTimeout(function(){i.closestLocation.textContent=[o.Province_State,o.Country_Region].filter(function(t){return t}).join(", "),i.distance.textContent="".concat(o.distance_miles.toFixed(1)," miles"),i.confirmed.textContent=o.Confirmed,i.active.textContent=o.Active,i.deaths.textContent=o.Deaths,i.recovered.textContent=o.Recovered,i.updated.textContent=new Date(o.Last_Update).toLocaleString()},500)):(i.yourLocation.textContent=[e.city,e.region_code,e.country].filter(function(t){return t}).join(", "),g("Unknown"),i.casesError.style.display="")}function S(t){i.locationError.style.display="none",i.casesError.style.display="none";i.yourLocation.textContent="Loading...",g("Loading..."),Promise.all([l(),y(t)]).then(u).then(m),setTimeout(S,a)}S(!1),i.locationButton.addEventListener("click",function(){S(!0),i.locationButton.style.display="none"}),i.refreshButton.addEventListener("click",function(){delete localStorage.cacheData,delete localStorage.cacheTime,S()});
},{}]},{},["A2T1"], null)