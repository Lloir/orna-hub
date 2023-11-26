document.addEventListener('DOMContentLoaded', function() {
    const addKingdomForm = document.getElementById('add-kingdom-form');

    addKingdomForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            kingdomName: document.getElementById('kingdom-name-modal').value,
            kingdomType: document.getElementById('kingdom-type-modal').value,
            faction: document.getElementById('faction-modal').value,
            discordRequired: document.getElementById('discord-required-modal').checked,
            timeZone: document.getElementById('time-zone-modal').value,
            otherInfo: document.getElementById('other-info-modal').value
        };

        fetch('/add-kingdom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.text())
            .then(data => {
                alert(data); // Alert the response for now
                fetchKingdomsAndUpdateTable(); // Fetch and update the table
                // Clear the form or handle other UI updates here if needed
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });

    function fetchKingdomsAndUpdateTable() {
        fetch('/list-kingdoms') // Make sure this matches your server endpoint
            .then(response => response.json())
            .then(kingdoms => {
                updateKingdomsTable(kingdoms);
            })
            .catch(error => console.error('Error fetching kingdoms:', error));
    }

    function updateKingdomsTable(kingdoms) {
        const tableBody = document.getElementById('kingdoms-table').querySelector('tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        kingdoms.forEach(kingdom => {
            const row = document.createElement('tr');
            // Adjust the following as per the structure of your kingdom data
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
});