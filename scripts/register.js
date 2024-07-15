import { auth, firestore, storage } from './firebase.js';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

async function uploadProfilePic(userId, file) {
    const storageRef = ref(storage, `profilePics/${userId}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
}

async function registerUser(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const profilePic = document.getElementById('profile-pic').files[0];

    if (password.length < 6) {
        showRedMessage("הסיסמא צריכה להכיל 6 תוים לפחות");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let profilePicUrl = '';

        if (profilePic) {
            profilePicUrl = await uploadProfilePic(user.uid, profilePic);
        } else {
            profilePicUrl = './images/my_image.png';
        }

        await setDoc(doc(firestore, 'users', user.uid), {
            name,
            email,
            profilePicUrl,
        });

        // שליחת אימייל לאימות
        await sendEmailVerification(user);
        alert("נשלח אימייל לאימות. נא לאמת את האימייל שלך.");

        window.location.href = 'index.html';
    } catch (error) {
        showRedMessage("אנא בחר אימייל אחר - האימייל בשימוש");
    }
}

function showRedMessage(message) {
    if (document.querySelector('.red-alert-login')) {
        document.querySelector('.red-alert-login').remove();
    }
    const formLogin = document.getElementById('register-form');
    const alertMessage = document.createElement("p");
    alertMessage.innerHTML = message;
    alertMessage.classList.add("red-alert-login");
    formLogin.appendChild(alertMessage);
}

document.getElementById('register-form').addEventListener('submit', registerUser);