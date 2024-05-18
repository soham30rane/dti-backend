import AsyncLock from 'async-lock';
const lock = new AsyncLock();

// Initialize your resource object
let myResource = {};

// Function to increment user count
async function incrementUserCount(quizCode, userId) {
    return new Promise((resolve, reject) => {
        lock.acquire(`${quizCode}:${userId}`, function(done) {
            if (!myResource[quizCode]) {
                myResource[quizCode] = {};
            }
            if (!myResource[quizCode][userId]) {
                myResource[quizCode][userId] = 0;
            }
            myResource[quizCode][userId]++;
            console.log(myResource)
            done();
            resolve();
        });
    });
}

// Function to decrement user count
async function decrementUserCount(quizCode, userId) {
    return new Promise((resolve, reject) => {
        lock.acquire(`${quizCode}:${userId}`, function(done) {
            if (myResource[quizCode] && myResource[quizCode][userId]) {
                myResource[quizCode][userId]--;
                if (myResource[quizCode][userId] === 0) {
                    delete myResource[quizCode][userId];
                }
            }
            console.log(myResource)
            done();
            resolve();
        });
    });
}

// Function to count online users for a quiz
function countOnline(quizCode) {
    if (!myResource[quizCode]) {
        return 0;
    }
    let onlineCount = 0;
    Object.values(myResource[quizCode]).forEach(count => {
        if (count >= 1) {
            onlineCount++;
        }
    });
    return onlineCount;
}

// Export functions
export  const incLiveCount = incrementUserCount;
export  const dcrLiveCount = decrementUserCount;
export  const getOnlineCount = countOnline;

