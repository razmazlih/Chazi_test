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
		if (document.querySelector('.red-alert-login')) {
			return
		}
        const formLogin = document.getElementById('login-form');
		const alertMessage = document.createElement("p");
		alertMessage.innerHTML = "האימייל או סיסמא לא נכונים";
		alertMessage.classList.add("red-alert-login");
		formLogin.appendChild(alertMessage);
    }
}

document.getElementById('login-form').addEventListener('submit', loginUser);
