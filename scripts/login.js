import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

async function loginUser(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login successful! Redirecting to chat...');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging in user:', error);
        alert(`Error: ${error.message}`);
    }
}

document.getElementById('login-form').addEventListener('submit', loginUser);