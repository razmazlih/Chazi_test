import { firestore } from './firebase.js';
import { collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

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
        const messagesCollection = collection(firestore, `users/${userId}/messages`);
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

            if (messageData.type === 'received') {
                senderElement.textContent = "חזי: ";
                contentElement.textContent = messageData.text;
            } else if (messageData.type === 'sent') {
                senderElement.textContent = "נשלח: ";
                contentElement.style.color = "red";
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