import { auth, firestore } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

async function registerUser(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(firestore, 'users', user.uid), {
            name,
            email
        });

        alert('Registration successful! Redirecting to chat...');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error registering user:', error);
        alert(`Error: ${error.message}`);
    }
}

document.getElementById('register-form').addEventListener('submit', registerUser);