'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; ////in km
    this.duration = duration; // in min
    this.click = 0;
  }

  _setDecription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  _click() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDecription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDecription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

///////// APLICATION ACRCHITECTOR
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getLocalStorage();
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        console.log('Could not get your position');
      }
    );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);
    console.log(this.#map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(object => {
      this._renderWorkoutMarker(object);
    });
  }
  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !positiveInputs(distance, duration, cadence)
      )
        return alert(`not correct`);

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !positiveInputs(distance, duration)
      )
        return alert(`not correct`);
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this._renderWorkoutMarker(this.#workouts[this.#workouts.length - 1]);
    this._renderWorkout(this.#workouts[this.#workouts.length - 1]);
    this._hideForm();
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workoutLast) {
    L.marker(workoutLast.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          closeOnClick: false,
          autoClose: false,
          className: `${
            workoutLast.type === 'cycling' ? 'cycling-popup' : 'running-popup'
          }`,
        })
      )
      .setPopupContent(
        `${workoutLast.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'} ${
          workoutLast.description
        }`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title"> ${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevation}</span>
      <span class="workout__unit">m</span>
    </div>
  </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _clickToCurrentWorkout(e) {
    const currentElement = e.target.closest('.workout');
    if (!currentElement) return;
    const currentData = currentElement.dataset.id;
    console.log(currentData);
    const currentObject = this.#workouts.find(el => el.id == currentData);
    console.log(currentObject);
    this.#map.setView(currentObject.coords, 13, {
      animate: true,
      pan: { duration: 2 },
    });

    // currentObject._click();
    // console.log(currentObject.click);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(object => {
      this._renderWorkout(object);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
app._getPosition();
inputType.addEventListener('change', app._toggleElevationField.bind(app));
form.addEventListener('submit', app._newWorkout.bind(app));
containerWorkouts.addEventListener(
  'click',
  app._clickToCurrentWorkout.bind(app)
);
