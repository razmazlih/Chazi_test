import { auth, firestore, storage } from './firebase.js';
import { createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
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

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        let profilePicUrl = '';

        if (profilePic) {
            profilePicUrl = await uploadProfilePic(user.uid, profilePic);
        } else {
            profilePicUrl = "./images/my_image.png";
        }

        await setDoc(doc(firestore, 'users', user.uid), {
            name,
            email,
            profilePicUrl
        });

        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error registering user:', error);
    }
}

document.getElementById('register-form').addEventListener('submit', registerUser);