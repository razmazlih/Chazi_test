import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html';
    } catch (error) {
        const messageLogin = document.getElementById('message-login');
        messageLogin.innerHTML =
            "<p class='red-alert-login'> האימייל או סיסמא לא נכונים </p>";
        console.error('Error logging in user:', error);
    }
}

document.getElementById('login-form').addEventListener('submit', loginUser);
