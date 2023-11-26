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
                // Here you might want to clear the form or handle UI updates.
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        function fetchKingdomsAndUpdateTable() {
            fetch('/list-kingdoms') // Replace with your actual endpoint
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
                // Create and append table cells for kingdom data
                row.innerHTML = `
            <td>${kingdom.kingdomName}</td>
            <td>${kingdom.kingdomType}</td>
            <td>${kingdom.faction}</td>
            <td>${kingdom.discordRequired}</td>
            <td>${kingdom.timeZone}</td>
            <td>${kingdom.otherInfo}</td>
        `;
                tableBody.appendChild(row);
            });
        }


    });
});
