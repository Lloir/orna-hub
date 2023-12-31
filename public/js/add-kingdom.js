document.addEventListener('DOMContentLoaded', function() {
    const addKingdomForm = document.getElementById('add-kingdom-form');
    if (addKingdomForm) addKingdomForm.addEventListener('submit', handleAddKingdomFormSubmit);
    fetchKingdomsAndUpdateTable(); // Fetch existing kingdoms on page load
});

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

async function handleAddKingdomFormSubmit(event) {
    event.preventDefault();

    const formData = {
        kingdomName: document.getElementById('kingdom-name-modal').value.trim(),
        kingdomType: document.getElementById('kingdom-type-modal').value,
        faction: document.getElementById('faction-modal').value,
        discordRequired: document.getElementById('discord-required-modal').checked,
        timeZone: document.getElementById('time-zone-modal').value.trim(),
        otherInfo: document.getElementById('other-info-modal').value.trim()
    };

    try {
        const response = await fetch('/add-kingdom', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Failed to add kingdom.');
        alert('Kingdom added successfully!');
        await fetchKingdomsAndUpdateTable(); // Refresh the list of kingdoms
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the kingdom.');
    }
}

async function fetchKingdomsAndUpdateTable() {
    try {
        const response = await fetch('/list-kingdoms');
        if (!response.ok) throw new Error('Failed to fetch kingdoms.');
        const kingdoms = await response.json();
        updateKingdomsTable(kingdoms);
    } catch (error) {
        console.error('Error fetching kingdoms:', error);
        alert('An error occurred while fetching kingdoms.');
    }
}

function updateKingdomsTable(kingdoms) {
    const tableBody = document.getElementById('kingdoms-table').querySelector('tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    kingdoms.forEach(kingdom => {
        const row = document.createElement('tr');

        // Replace underscores with spaces for display
        const formattedType = kingdom.kingdomType.replace(/_/g, ' ');
        const formattedFaction = kingdom.faction.replace(/_/g, ' ');

        row.innerHTML = `
            <td>${kingdom.kingdomName}</td>
            <td>${formattedType}</td>
            <td>${formattedFaction}</td>
            <td>${kingdom.discordRequired ? 'Yes' : 'No'}</td>
            <td>${kingdom.timeZone}</td>
            <td>${kingdom.otherInfo}</td>
        `;

        tableBody.appendChild(row);
    });
}