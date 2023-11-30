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
        const response = await fetch('doc/petNames.json');
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
        // Skip adding the pet if the timer has expired
        if (pet.timeLeft <= 0) {
            return;
        }

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
        timeLeftCell.textContent = formatTimeLeft(pet.timeLeft); // Format time left
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
        const response = await fetch('doc/time_zones.json');
        if (!response.ok) throw new Error('Failed to fetch time zones.');
        const data = await response.json();
        const timeZoneSelect = document.getElementById('time-zone');

        // Using Object.entries to iterate over key-value pairs
        Object.entries(data).forEach(([timeZone, offset]) => {
            let option = document.createElement('option');
            option.value = timeZone; // Set the value to the key (time zone)
            option.textContent = `${timeZone} (UTC${offset})`; // Include the offset in the text
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
    const lightTheme = document.getElementById('light-theme');
    const darkTheme = document.getElementById('dark-theme');

    if (darkTheme.disabled) {
        darkTheme.disabled = false;
        lightTheme.disabled = true;
    } else {
        darkTheme.disabled = true;
        lightTheme.disabled = false;
    }
}

function saveThemePreference() {
    const currentTheme = document.getElementById('dark-theme').disabled ? 'light' : 'dark';
    localStorage.setItem('preferredTheme', currentTheme);
}

function applySavedThemePreference() {
    const preferredTheme = localStorage.getItem('preferredTheme');
    if (preferredTheme) {
        if (preferredTheme === 'dark') {
            // Enable dark theme
        } else {
            // Enable light theme
        }
    }
}

// Call this function when the page loads
applySavedThemePreference();

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
        const response = await fetch('doc/list-pets');
        if (!response.ok) throw new Error('Failed to fetch pets.');
        const pets = await response.json();
        displayPets(pets); // This will update the display, including removing expired pets
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setTimeout(() => periodicallyFetchPets().catch(err => console.error(err)), 30000); // Poll every 30 seconds
    }
}
