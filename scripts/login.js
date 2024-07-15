import { auth, provider } from './firebase.js';
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    sendEmailVerification,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;

        if (user.emailVerified) {
            window.location.href = 'index.html';
        } else {
            showRedMessage('אימייל לא אומת. נא לאמת את האימייל שלך.', user);
        }
    } catch (error) {
        showRedMessage('האימייל או סיסמא לא נכונים');
    }
}

async function googleLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (user.emailVerified) {
            window.location.href = 'index.html';
        } else {
            showRedMessage('אימייל לא אומת. נא לאמת את האימייל שלך.', user);
        }
    } catch (error) {
        showRedMessage('שגיאה בהתחברות עם גוגל');
    }
}

async function resendVerificationEmail(user) {
    try {
        await sendEmailVerification(user);
        alert('נשלח אימייל אימות מחדש.');
    } catch (error) {
        alert('שגיאה בשליחת אימייל האימות. נא לנסות שוב מאוחר יותר.');
    }
}

function showRedMessage(message, user) {
    if (document.getElementById('message-login')) {
        document.getElementById('message-login').remove();
    }

    const divLoginMessage = document.createElement('div');
    divLoginMessage.id = 'message-login';

    const formLogin = document.getElementById('login-form');
    formLogin.appendChild(divLoginMessage);

    const alertMessage = document.createElement('p');
    alertMessage.innerHTML = message;
    alertMessage.classList.add('red-alert-login');

    divLoginMessage.appendChild(alertMessage);

    if (user) {
        const resendLink = document.createElement('a');
        resendLink.innerHTML = 'שלח שוב קישור לאימות';
        resendLink.href = '#';
        resendLink.onclick = function (e) {
            e.preventDefault();
            resendVerificationEmail(user);
        };
        divLoginMessage.appendChild(resendLink);
    }
}

document.getElementById('login-form').addEventListener('submit', loginUser);
document.getElementById('google-login').addEventListener('click', googleLogin);
