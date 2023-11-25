const express = require('express');
const config = require('./config.json');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const redis = require('redis');
const fs = require('fs');
const app = express();

const redisHost = config.redis.host;
const redisPort = config.redis.port;
const port = config.server.port;

// Create Redis client
const client = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

client.on('error', (err) => console.log('Redis Client Error', err));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000 // Limit each IP to 100 requests per windowMs
});

// Connect to Redis
client.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.error('Redis Connection Error:', err);
});

// Use express.json() instead of body-parser
app.use(limiter);
app.use(express.json());
app.use(express.static('public'));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get('/', (req, res) => {
    fs.readFile(__dirname + '/index.html', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('An error occurred');
        }
        res.send(data);
    });
});

// Endpoint to remove a pet
app.delete('/remove-pet/:petName/:playerName', async (req, res) => {    const { petName, playerName } = req.params;
    const petKey = `pet:${petName}:${playerName}`;

    try {
        // Check if the pet exists
        const petExists = await client.exists(petKey);
        if (!petExists) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Delete the pet from Redis
        await client.del(petKey);

        // Optionally, remove the petKey from the list 'pets'
        await client.lRem('pets', 0, petKey);

        res.status(200).send('Pet removed successfully');
    } catch (error) {
        console.error('Error removing pet:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-pet-post', async (req, res) => {
    const { petName, playerName, timeZone, totalMinutes } = req.body;
    const petKey = `pet:${petName}:${playerName}`;

    const timestamp = Date.now(); // Current timestamp in milliseconds
    await client.hSet(petKey, {
        'petName': petName,
        'playerName': playerName,
        'timeZone': timeZone,
        'totalMinutes': totalMinutes,
        'timestamp': timestamp // Add the timestamp
    });
    await client.expire(petKey, 86400); // Optional: set a TTL for automatic deletion
    await client.lPush('pets', petKey);
    res.status(200).send('Pet post added successfully');
});

app.post('/update-timer', async (req, res) => {
    const { petName, playerName, totalMinutes } = req.body;
    const petKey = `pet:${petName}:${playerName}`;

    try {
        await client.hSet(petKey, 'totalMinutes', totalMinutes);
        res.status(200).send('Timer updated successfully');
    } catch (error) {
        console.error('Error updating timer:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Define a new route for fetching time-left data for a pet by its ID
app.get('/get-time-left/:petId', async (req, res) => {
    try {
        const petId = req.params.petId;

        // Assuming you have the pet data stored in Redis
        // You can use the petId to retrieve the pet's data
        const petKey = `pet:${petId}`;
        const petData = await client.hGetAll(petKey);

        if (!petData) {
            // If pet data is not found, return an error response
            return res.status(404).json({ error: 'Pet not found' });
        }

        // Calculate the time left in minutes based on your pet data
        // Here, we assume that the pet data has a field called 'totalMinutes'
        const timeLeftMinutes = parseInt(petData.totalMinutes || 0);

        // Return the time left data as a JSON response
        res.json({ totalMinutes: timeLeftMinutes });
    } catch (error) {
        console.error('Error fetching time left data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/list-pets', async (req, res) => {
    try {
        const keys = await client.lRange('pets', 0, -1);
        const pets = await Promise.all(keys.map(async (key) => {
            const petDetails = await client.hGetAll(key);
            return { id: key, ...petDetails };
        }));
        res.json(pets);
    } catch (error) {
        console.error('Error retrieving pets:', error);
        res.status(500).send('Internal Server Error');
    }
});
// Function to delete pets based on a condition
async function deletePetsByCondition() {
    try {
        const keys = await client.keys('pet:*');
        for (const key of keys) {
            const petDetails = await client.hGetAll(key);
            if (petDetails.shouldBeDeleted === '1') {
                await client.del(key);
                console.log(`Deleted pet: ${key}`);
            }
        }
    } catch (error) {
        console.error('Error in deleting pets by condition:', error);
    }
}

// Cron job to check for pets to be deleted based on condition
cron.schedule('* * * * *', () => {
    console.log('Checking for pets to delete based on condition');
    deletePetsByCondition();
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
