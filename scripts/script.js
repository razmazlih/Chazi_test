import { auth, firestore } from './firebase.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid;
            loadMessagesFromFirebase(userId);
            addEventListeners(userId);
        } else {
            window.location.href = 'login.html';
        }
    });
}

async function addMessageToFirebase(userId, type, text) {
    try {
        await addDoc(collection(firestore, `users/${userId}/messages`), {
            type,
            text,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding message to Firebase: ", error);
    }
}

function loadMessagesFromFirebase(userId) {
    const q = query(collection(firestore, `users/${userId}/messages`), orderBy('timestamp'));
    const chatWindow = document.querySelector('.chat-window');
    onSnapshot(q, (snapshot) => {
        chatWindow.innerHTML = '';
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            addMessage(messageData.type, messageData.text, messageData.timestamp);
        });
    });
}

function addMessage(type, text, timestamp) {
    const message = document.createElement('div');
    message.classList.add('message', type);
    const imgSrc = type === 'sent' ? 'images/user.png' : 'images/bot.png';
    const timeString = timestamp ? new Date(timestamp.seconds * 1000).toLocaleTimeString('he-IL') : '';
    message.innerHTML = `<img src="${imgSrc}" alt="${type}"><div class="message-content"><p>${text}</p><span class="timestamp">${timeString}</span></div>`;
    const chatWindow = document.querySelector('.chat-window');
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
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
    const logoutButton = document.getElementById('logout-button');

    sendButton.addEventListener('click', () => {
        const messageText = inputBar.value.trim();
        if (messageText) {
            addMessage('sent', messageText);
            addMessageToFirebase(userId, 'sent', messageText);
            inputBar.value = '';
        }
    });

    inputBar.addEventListener('keypress', debounce((e) => {
        if (e.key === 'Enter') {
            const messageText = inputBar.value.trim();
            if (messageText) {
                addMessage('sent', messageText);
                addMessageToFirebase(userId, 'sent', messageText);
                inputBar.value = '';
            }
        }
    }, 300));

    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
        });
    });
}

document.addEventListener('DOMContentLoaded', checkAuthState);