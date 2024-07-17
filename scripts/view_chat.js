import { auth, firestore } from './firebase.js';
import {
    collection,
    query,
    doc,
    getDoc,
    getDocs,
    orderBy,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

async function checkAdmin() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== 'מנהל') {
            window.location.href = '../index.html';
        }
    } else {
        window.location.href = '../index.html';
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        checkAdmin().catch((error) => {
            console.error('Error checking admin status:', error);
        });
    } else {
        window.location.href = '../login.html';
    }
});

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

async function loadChat() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const chatContainer = document.getElementById('chat-container');

    if (!userId) {
        chatContainer.innerHTML = '<p>לא נמצא מזהה משתמש.</p>';
        return;
    }

    try {
        const messagesCollection = collection(
            firestore,
            `users/${userId}/messages`
        );
        const q = query(messagesCollection, orderBy('timestamp'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            chatContainer.innerHTML = '<p>אין שיחות זמינות למשתמש זה.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const messageData = doc.data();
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');

            const senderElement = document.createElement('div');
            senderElement.classList.add('chat-message-sender');

            const contentElement = document.createElement('div');
            contentElement.classList.add('chat-message-content');

            const timestamp = new Date(messageData.timestamp.seconds * 1000);
            const formattedDate = timestamp.toLocaleDateString('he-IL');
            const formattedTime = timestamp.toLocaleTimeString('he-IL');

            if (messageData.type === 'received') {
                senderElement.textContent = `חזי: (${formattedDate} ${formattedTime}) `;
                contentElement.textContent = messageData.text;
            } else if (messageData.type === 'sent') {
                senderElement.textContent = `נשלח: (${formattedDate} ${formattedTime}) `;
                contentElement.style.color = 'red';
                contentElement.textContent = messageData.text;
            }

            messageElement.appendChild(senderElement);
            messageElement.appendChild(contentElement);
            chatContainer.appendChild(messageElement);
        });
    } catch (error) {
        console.error('Error loading chat:', error);
        chatContainer.innerHTML = '<p>אירעה שגיאה בטעינת השיחה.</p>';
    }
}

loadChat();
