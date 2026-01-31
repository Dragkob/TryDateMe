console.log(`  ___  _  _____  ___         _____ _____   _____   _ _____ ___ __  __ ___ 
 |   \\| |/ / _ \\| _ )  ___  |_   _| _ \\ \\ / /   \\ /_\\_   _| __|  \\/  | __|
 | |) | ' < (_) | _ \\ |___|   | | |   /\\ V /| |) / _ \\| | | _|| |\\/| | _| 
 |___/|_|\\_\\___/|___/         |_| |_|\\_|_| |___/_/ \\_|_| |___|_|  |_|___|
                                                                          `);

// Extract room code from the URL
function getRoomCode() {
    const path = window.location.pathname;
    const match = path.match(/\/room\/(.+)/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

// Fetch room details from the THM API
async function fetchRoomDetails(roomCode) {
    const apiUrl = `https://tryhackme.com/api/v2/rooms/details?roomCode=${roomCode}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching room details:", error);
        return null;
    }
}

// Listener for the popup script - Fetch on click
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getRoomDates") {
        const roomCode = getRoomCode();
        if (!roomCode) {
            sendResponse({ error: "Could not get room code from URL." });
            return;
        }

        const cacheKey = `room_dates_${roomCode}`;

        chrome.runtime.sendMessage({ action: "getLocalStorage", keys: [cacheKey, 'cacheDurationDays'] }, async (result) => {
            const cacheDurationDays = result.cacheDurationDays || 1;
            const CACHE_DURATION = cacheDurationDays * 86400000;
            const cachedData = result[cacheKey];
            const now = Date.now();

            if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
                sendResponse({
                    title: cachedData.title,
                    id: cachedData.id,
                    code: cachedData.code,
                    created: cachedData.created,
                    published: cachedData.published
                });
                return;
            }

            const roomDetails = await fetchRoomDetails(roomCode);
            if (roomDetails) {
                const dataToCache = {
                    title: roomDetails.title,
                    id: roomDetails._id,
                    code: roomDetails.code,
                    created: roomDetails.created,
                    published: roomDetails.published,
                    timestamp: now
                };
                chrome.runtime.sendMessage({ action: "setLocalStorage", data: { [cacheKey]: dataToCache } });
                sendResponse({
                    title: roomDetails.title,
                    id: roomDetails._id,
                    code: roomDetails.code,
                    created: roomDetails.created,
                    published: roomDetails.published
                });
            } else {
                console.error("content.js: Failed to fetch room details.");
                sendResponse({ error: "Could not fetch room details." });
            }
        });

        return true;
    }
});
