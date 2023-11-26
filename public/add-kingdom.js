document.addEventListener('DOMContentLoaded', function() {
    const addKingdomForm = document.getElementById('add-kingdom-form');

    addKingdomForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            kingdomName: document.getElementById('kingdom-name-modal').value.trim(),
            kingdomType: document.getElementById('kingdom-type-modal').value,
            faction: document.getElementById('faction-modal').value,
            discordRequired: document.getElementById('discord-required-modal').checked,
            timeZone: document.getElementById('time-zone-modal').value.trim(),
            otherInfo: document.getElementById('other-info-modal').value.trim()
        };

        fetch('/add-kingdom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                alert(data);
                fetchKingdomsAndUpdateTable();
                // Optional: Clear the form here if needed
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    function fetchKingdomsAndUpdateTable() {
        fetch('/list-kingdoms')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(kingdoms => {
                updateKingdomsTable(kingdoms);
            })
            .catch(error => {
                console.error('Error fetching kingdoms:', error);
            });
    }

    function updateKingdomsTable(kingdoms) {
        const tableBody = document.getElementById('kingdoms-table').querySelector('tbody');
        tableBody.innerHTML = '';
        kingdoms.forEach(kingdom => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${kingdom.kingdomName}</td>
                <td>${kingdom.kingdomType}</td>
                <td>${kingdom.faction}</td>
                <td>${kingdom.discordRequired === 'true' ? 'Yes' : 'No'}</td>
                <td>${kingdom.timeZone}</td>
                <td>${kingdom.otherInfo}</td>
            `;
            tableBody.appendChild(row);
        });
    }
});
