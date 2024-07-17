import { auth, firestore } from './firebase.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

async function doesCollectionExist(userId) {
    const surveysCollectionRef = collection(
        firestore,
        `users/${userId}/surveys`
    );
    const questsCollectionRef = collection(firestore, 'quests');

    const surveysSnapshot = await getDocs(surveysCollectionRef);
    const questsSnapshot = await getDocs(questsCollectionRef);

    const surveysData = surveysSnapshot.docs.map((doc) => doc.data());
    const questsData = questsSnapshot.docs.map((doc) => doc.data());

    const sortFunction = (a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b));
    surveysData.sort(sortFunction);
    questsData.sort(sortFunction);

    const areCollectionsEqual = surveysData.length === questsData.length;

    if (areCollectionsEqual) {
        return true;
    }
    return false;
}

function checkAuthState() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const userId = user.uid;
                resolve(userId);
            } else {
                window.location.href = 'login.html';
                reject('No user signed in');
            }
        });
    });
}

async function addMessageToFirebase(userId, type, text) {
    try {
        await addDoc(collection(firestore, `users/${userId}/messages`), {
            type,
            text,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding message to Firebase: ', error);
    }
}

async function getProfilePicUrl(userId) {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    return userData.profilePicUrl;
}

async function loadMessagesFromFirebase(userId) {
    const q = query(
        collection(firestore, `users/${userId}/messages`),
        orderBy('timestamp')
    );
    const myUrl = await getProfilePicUrl(userId);
    const chatWindow = document.querySelector('.chat-window');

    onSnapshot(q, (snapshot) => {
        chatWindow.innerHTML = ''; // Clear chat window
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            addMessage(messageData.type, messageData.text, myUrl);
        });
    });
}

function addMessage(type, text, picUrl, timestamp) {
    const message = document.createElement('div');
    message.classList.add('message', type);
    const imgSrc = type === 'sent' ? picUrl : 'images/bot_image.png';
    const timeString = timestamp
        ? new Date(timestamp.seconds * 1000).toLocaleTimeString('he-IL')
        : '';
    message.innerHTML = `<img src="${imgSrc}" alt="${type}"><div class="${type} message-content"><p>${text}</p><span class="timestamp">${timeString}</span></div>`;
    const chatWindow = document.querySelector('.chat-window');
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// XXXXXXXXXX
function simulateBotResponse(userId) {
    setTimeout(() => {
        const botResponse = 'היי, אני חזי - העוזר האישי שלך';
        addMessage('received', botResponse);
        addMessageToFirebase(userId, 'received', botResponse);
    }, 1000); // השהייה של שנייה אחת (1000 מילישניות)
}
// XXXXXXXXXX

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function addEventListeners(userId) {
    const inputBar = document.querySelector('.input-bar input');
    const sendButton = document.querySelector('.send-button');
    const logoutButton = document.getElementById('logout-button');

    sendButton.addEventListener('click', () => {
        const messageText = inputBar.value.trim();
        if (messageText) {
            addMessage('sent', messageText);
            addMessageToFirebase(userId, 'sent', messageText);
            inputBar.value = '';
            // XXXXXXXXXX
            simulateBotResponse(userId); // קריאה לפונקציה שמדמה תשובה
            // XXXXXXXXXX
        }
    });

    inputBar.addEventListener(
        'keypress',
        debounce((e) => {
            if (e.key === 'Enter') {
                const messageText = inputBar.value.trim();
                if (messageText) {
                    addMessage('sent', messageText);
                    addMessageToFirebase(userId, 'sent', messageText);
                    inputBar.value = '';
                    // XXXXXXXXXX
                    simulateBotResponse(userId); // קריאה לפונקציה שמדמה תשובה
                    // XXXXXXXXXX
                }
            }
        }, 300)
    );

    logoutButton.addEventListener('click', () => {
        auth.signOut()
            .then(() => {
                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = await checkAuthState();
        loadMessagesFromFirebase(userId);
        addEventListeners(userId);

        const isSurvey = await doesCollectionExist(userId);

        if (!isSurvey) {
            const popup = document.getElementById('popup');
            const getToKnowButton = document.getElementById('get-to-know');
            const maybeLaterButton = document.getElementById('maybe-later');

            popup.classList.remove('hidden');
            getToKnowButton.addEventListener('click', () => {
                window.location.href = 'survey.html';
            });
            maybeLaterButton.addEventListener('click', () => {
                popup.classList.add('hidden');
            });
        }
    } catch (error) {
        console.error(
            'Error checking auth state or getting survey document:',
            error
        );
    }
});
