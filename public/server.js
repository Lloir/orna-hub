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

// Create Redis clients
const client = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
});

const clientDB1 = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`,
    database: 1
});

// Function to connect a Redis client
function connectRedisClient(client, dbName) {
    if (!client.isOpen) {
        client.connect().then(() => console.log(`Connected to Redis ${dbName}`)).catch(console.error);
    } else {
        console.log(`Already connected to Redis ${dbName}`);
    }
}

// Connect Redis clients
connectRedisClient(client, 'DB0');
connectRedisClient(clientDB1, 'DB1');


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

async function calculateRemainingTime(petKey) {
    const petData = await client.hGetAll(petKey);
    if (!petData || !petData.startTime || !petData.duration) return null;

    const startTime = parseInt(petData.startTime);
    const duration = parseInt(petData.duration);
    const currentTime = Date.now();
    let remainingTime = Math.max(startTime + duration - currentTime, 0);

    return remainingTime;
}

// Modify the /list-pets endpoint
app.get('/list-pets', async (req, res) => {
    try {
        const keys = await client.lRange('pets', 0, -1);
        const pets = await Promise.all(keys.map(async (key) => {
            const petDetails = await client.hGetAll(key);
            const remainingTime = await calculateRemainingTime(key);
            return { ...petDetails, timeLeft: remainingTime };
        }));
        res.json(pets);
    } catch (error) {
        console.error('Error retrieving pets:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-pet-post', async (req, res) => {
    const { petName, playerName, timeZone, totalMinutes } = req.body;
    const petKey = `pet:${petName}:${playerName}`;


    const timestamp = Date.now(); // Current timestamp in milliseconds
    const totalDuration = totalMinutes * 60 * 1000; // Convert to milliseconds
    await client.hSet(petKey, {
        'startTime': timestamp,
        'duration': totalDuration,
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

async function calculateRemainingTime(petKey) {
    const petData = await client.hGetAll(petKey);
    if (!petData) return null;

    const startTime = parseInt(petData.startTime);
    const duration = parseInt(petData.duration);
    const currentTime = Date.now();
    let remainingTime = Math.max(startTime + duration - currentTime, 0);

    return remainingTime;
}

app.get('/get-time-left/:petId', async (req, res) => {
    const petId = req.params.petId;
    const petKey = `pet:${petId}`;
    const remainingTime = await calculateRemainingTime(petKey);

    if (remainingTime === null) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json({ timeLeft: remainingTime });
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

// Kingdom stuffs

app.get('/list-kingdoms', async (req, res) => {
    try {
        const keys = await client.keys('kingdom:*'); // Assuming kingdom keys follow this pattern
        const kingdoms = await Promise.all(keys.map(async (key) => {
            return await client.hGetAll(key);
        }));
        res.json(kingdoms);
    } catch (error) {
        console.error('Error retrieving kingdoms:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/add-kingdom', async (req, res) => {
    const { kingdomName, kingdomType, faction, discordRequired, timeZone, otherInfo } = req.body;

    // Validate kingdomName (non-empty, type string, length constraint)
    if (typeof kingdomName !== 'string' || kingdomName.trim().length === 0 || kingdomName.length > 50) {
        return res.status(400).send('Invalid kingdom name');
    }

    // Validate kingdomType (must be one of predefined types)
    const validKingdomTypes = ['casual', 'hardcore', 'in_between'];
    if (!validKingdomTypes.includes(kingdomType)) {
        return res.status(400).send('Invalid kingdom type');
    }

    // Validate faction (must be one of predefined factions)
    const validFactions = ['earthen_legions', 'stormforce', 'kings_of_inferno', 'frozenguard'];
    if (!validFactions.includes(faction)) {
        return res.status(400).send('Invalid faction');
    }

    // Validate discordRequired (must be a boolean)
    if (typeof discordRequired !== 'boolean') {
        return res.status(400).send('Invalid value for Discord requirement');
    }

    // Validate timeZone (simple string check, can be more complex based on requirements)
    if (typeof timeZone !== 'string' || timeZone.length > 50) {
        return res.status(400).send('Invalid time zone');
    }

    // Validate otherInfo (type string, length constraint)
    if (typeof otherInfo !== 'string' || otherInfo.length > 255) {
        return res.status(400).send('Invalid other information');
    }
    // Construct a unique key for the kingdom (for example, using kingdomName)
    const kingdomKey = `kingdom:${kingdomName}`;

    try {
        // Prepare kingdom data, ensuring all values are strings
        const kingdomData = {
            'kingdomName': kingdomName,
            'kingdomType': kingdomType,
            'faction': faction,
            'discordRequired': discordRequired.toString(), // Ensuring boolean is converted to string
            'timeZone': timeZone,
            'otherInfo': otherInfo
        };

        // Use clientDB1 to interact with Redis DB1
        await clientDB1.hSet(kingdomKey, kingdomData);

        res.status(200).send('Kingdom added successfully!');
    } catch (error) {
        console.error('Error adding kingdom:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
