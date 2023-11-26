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
    });
});
