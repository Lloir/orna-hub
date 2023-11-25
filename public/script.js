document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    periodicallyFetchPets();
    populatePetNames();
    populateTimeZones();
});

function setupEventListeners() {
    const addPetButton = document.getElementById('add-pet-button');
    const closeModalButton = document.getElementById('close-modal');
    const addPetForm = document.getElementById('pet-form');
    const themeToggleButton = document.getElementById('theme-toggle');

    if (addPetButton) addPetButton.addEventListener('click', showModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    if (addPetForm) addPetForm.addEventListener('submit', handleAddPetFormSubmit);
    if (themeToggleButton) themeToggleButton.addEventListener('click', toggleTheme);
}

async function populatePetNames() {
    try {
        const response = await fetch('petNames.json');
        if (!response.ok) throw new Error('Failed to fetch pet names.');
        const data = await response.json();
        const petSelect = document.getElementById('petNameInput');
        data.petNames.forEach(petName => {
            let option = document.createElement('option');
            option.value = petName;
            option.textContent = petName;
            petSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function populateTimeZones() {
    try {
        const response = await fetch('time_zones.json');
        if (!response.ok) throw new Error('Failed to fetch time zones.');
        const data = await response.json();
        const timeZoneSelect = document.getElementById('time-zone');
        data.forEach(timeZone => {
            let option = document.createElement('option');
            option.value = timeZone.zone;
            option.textContent = timeZone.zone;
            timeZoneSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleAddPetFormSubmit(event) {
    event.preventDefault();
    const petNameInput = document.getElementById('pet-names');
    const playerNameInput = document.getElementById('player-name');
    const timeZoneInput = document.getElementById('time-zone');
    const hoursInput = document.getElementById('time-left-hours');
    const minutesInput = document.getElementById('time-left-minutes');

    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;
    const totalMinutes = hours * 60 + minutes;

    const petData = {
        petName: petNameInput.value,
        playerName: playerNameInput.value.trim(),
        timeZone: timeZoneInput.value,
        totalMinutes: totalMinutes
    };

    try {
        const response = await fetch('/add-pet-post', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(petData)
        });

        if (response.ok) {
            alert('Pet added successfully!');
            closeModal();
            await fetchPets(); // Refresh the list of pets
        } else {
            alert('Failed to add pet. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the pet.');
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle("dark-mode");
    const newTheme = body.classList.contains("dark-mode") ? "dark" : "light";
    setCookie("theme", newTheme, 365);
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

async function fetchPets() {
    try {
        const response = await fetch('/list-pets');
        if (!response.ok) throw new Error('Failed to fetch pets.');
        const pets = await response.json();
        displayPets(pets);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching pets.');
    }
}

async function displayPets(pets) {
    const tbody = document.getElementById('pets-table').querySelector('tbody');
    tbody.innerHTML = '';

    pets.forEach(pet => {
        const petId = `${encodeURIComponent(pet.petName)}__${encodeURIComponent(pet.playerName)}`;
        console.log(`Displaying pet: ${pet.petName}, Time left: ${pet.totalMinutes}`);
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${pet.petName}</td>
            <td>${pet.playerName}</td>
            <td>${pet.timeZone}</td>
            <td id="timer-${petId}"></td>
        `;
        updateTimer(petId, pet.totalMinutes);
    });
}

function showModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.style.display = 'none';
}

function updateTimer(petId, totalMinutes) {
    const timerElement = document.getElementById(`timer-${petId}`);
    console.log(`Updating timer for: ${petId}, Element found: ${timerElement !== null}, Total minutes: ${totalMinutes}`);
    if (!timerElement || isNaN(totalMinutes) || totalMinutes <= 0) return;

    let seconds = totalMinutes * 60;
    const interval = setInterval(() => {
        seconds--;
        const minutes = Math.floor(seconds / 60);
        if (seconds <= 0) {
            clearInterval(interval);
            timerElement.textContent = 'Time is up';
            const [encodedPetName, encodedPlayerName] = petId.split('__');
            const petName = decodeURIComponent(encodedPetName);
            const playerName = decodeURIComponent(encodedPlayerName);
            removePetData(petName, playerName);
        } else {
            timerElement.textContent = `${minutes} minutes`;
        }
    }, 1000);
}

async function removePetData(petName, playerName) {
    try {
        const url = `/remove-pet/${encodeURIComponent(petName)}/${encodeURIComponent(playerName)}`;
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`Failed to remove pet: ${petName} of player: ${playerName}`);
        }
        console.log(`Pet ${petName} of player ${playerName} removed successfully.`);
    } catch (error) {
        console.error('Error removing pet:', error);
    }
}

async function periodicallyFetchPets() {
    try {
        await fetchPets();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setTimeout(() => periodicallyFetchPets().catch(err => console.error(err)), 30000); // Poll every 30 seconds
    }
}
