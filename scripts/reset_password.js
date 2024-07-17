import { auth } from './firebase.js';
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

async function forgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;

    try {
        await sendPasswordResetEmail(auth, email);
        alert('קישור לאיפוס הסיסמא נשלח לאימייל שלך.');
        window.location.href = './login.html';
    } catch (error) {
        showRedMessage('שגיאה בשליחת קישור לאיפוס הסיסמא.');
    }
}

document
    .getElementById('forgot-password-form')
    .addEventListener('submit', forgotPassword);

function showRedMessage(message) {
    if (document.getElementById('message-login')) {
        document.getElementById('message-login').remove();
    }

    const divLoginMessage = document.createElement('div');
    divLoginMessage.id = 'message-login';

    const formLogin = document.getElementById('forgot-password-form');
    formLogin.appendChild(divLoginMessage);

    const alertMessage = document.createElement('p');
    alertMessage.innerHTML = message;
    alertMessage.classList.add('red-alert-login');

    divLoginMessage.appendChild(alertMessage);
}
