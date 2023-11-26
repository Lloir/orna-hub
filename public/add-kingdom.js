document.addEventListener('DOMContentLoaded', function() {
    const addKingdomForm = document.getElementById('add-kingdom-form');
    if (addKingdomForm) addKingdomForm.addEventListener('submit', handleAddKingdomFormSubmit);
    fetchKingdomsAndUpdateTable(); // Fetch existing kingdoms on page load
});

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
        row.innerHTML = `
            <td>${kingdom.kingdomName}</td>
            <td>${kingdom.kingdomType}</td>
            <td>${kingdom.faction}</td>
            <td>${kingdom.discordRequired ? 'Yes' : 'No'}</td>
            <td>${kingdom.timeZone}</td>
            <td>${kingdom.otherInfo}</td>
        `;
        tableBody.appendChild(row);
    });
}
