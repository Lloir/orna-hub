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

function displayPets(pets) {
    const petsTableBody = document.querySelector('#pets-table tbody');
    petsTableBody.innerHTML = ''; // Clear existing rows

    pets.forEach(pet => {
        const row = document.createElement('tr');

        // Pet Name
        const petNameCell = document.createElement('td');
        petNameCell.textContent = pet.petName;
        row.appendChild(petNameCell);

        // User Name
        const userNameCell = document.createElement('td');
        userNameCell.textContent = pet.playerName;
        row.appendChild(userNameCell);

        // Time Zone
        const timeZoneCell = document.createElement('td');
        timeZoneCell.textContent = pet.timeZone;
        row.appendChild(timeZoneCell);

        // Time Left
        const timeLeftCell = document.createElement('td');
        timeLeftCell.textContent = formatTimeLeft(pet.timeLeft); // Assumes timeLeft is in milliseconds
        row.appendChild(timeLeftCell);

        petsTableBody.appendChild(row);
    });
}

function formatTimeLeft(milliseconds) {
    if (milliseconds <= 0) {
        return 'Expired';
    }

    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Padding seconds with zero for consistent formatting
    seconds = seconds.toString().padStart(2, '0');

    return `${minutes}m ${seconds}s`;
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
    const petNameInput = document.getElementById('petNameInput');
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


function showModal() {
    const modal = document.querySelector('.modal');
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modalElement = document.querySelector('.modal');
    if (modalElement) {
        const bootstrapModal = bootstrap.Modal.getInstance(modalElement); // Get the Bootstrap modal instance
        if (bootstrapModal) {
            bootstrapModal.hide(); // Use Bootstrap's method to hide the modal
        }
    }
}

function updateTimerDisplay(petId, timeLeft) {
    const timerElement = document.getElementById(`timer-${petId}`);
    if (!timerElement) return;

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = ((timeLeft % 60000) / 1000).toFixed(0);
    timerElement.textContent = `${minutes}m ${seconds}s`;
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
