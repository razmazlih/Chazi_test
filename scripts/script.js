import { auth, firestore, secretKey } from './firebase.js';
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

    return areCollectionsEqual;
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

async function getBotResponse(userId, message) {
    let botResponse;

    try {
        const docRef = doc(firestore, `users/${userId}/summary/mySummary`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const selfSummary = docSnap.data().content;
            botResponse = await sendMessage(message, selfSummary);
        } else {
            botResponse = await sendMessage(message);
        }
    } catch (error) {
        console.error('Error getting document:', error);
    }

    addMessage('received', botResponse);
    addMessageToFirebase(userId, 'received', botResponse);
}

async function sendMessage(userMessage, summary) {
    const functionUrl =
        'https://europe-west1-chazi-b7b36.cloudfunctions.net/sendMessage';

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const body = JSON.stringify({
        message: userMessage,
        summary: summary,
    });

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: body,
    };

    try {
        const response = await fetch(functionUrl, requestOptions);

        if (!response.ok) {
            console.error('Server response:', response);
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        return result.response;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

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

    sendButton.addEventListener('click', () => {
        const messageText = inputBar.value.trim();
        if (messageText) {
            addMessage('sent', messageText);
            addMessageToFirebase(userId, 'sent', messageText);
            inputBar.value = '';
            getBotResponse(userId, messageText);
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
                    getBotResponse(userId, messageText);
                }
            }
        }, 300)
    );
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = await checkAuthState();
        loadMessagesFromFirebase(userId);
        addEventListeners(userId);

        const isSurvey = await doesCollectionExist(userId);

        if (!isSurvey) {
            setTimeout(() => {
                const popup = document.getElementById('popup');
                const getToKnowButton = document.getElementById('get-to-know');
                const maybeLaterButton = document.getElementById('maybe-later');
        
                popup.classList.remove('hidden');
                popup.classList.add('show');
        
                getToKnowButton.addEventListener('click', () => {
                    window.location.href = 'survey.html';
                });
        
                maybeLaterButton.addEventListener('click', () => {
                    popup.classList.remove('show');
                    popup.classList.add('hide');
                    setTimeout(() => {
                        popup.classList.add('hidden');
                        popup.classList.remove('hide');
                    }, 300);
                });
            }, 3000);
        }
    } catch (error) {
        console.error(
            'Error checking auth state or getting survey document:',
            error
        );
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const popup = document.getElementById('popup');
        popup.classList.remove('hidden');
        popup.classList.add('show');
    }, 3000);
});