import { auth, firestore } from './firebase.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import {
    collection,
    getDoc,
    doc,
    getDocs,
    query,
    orderBy,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('logout').addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            window.location.href = '../login.html';
        })
        .catch((error) => {
            console.error('Error logging out:', error);
        });
});

async function checkAdmin(user) {
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== 'מנהל') {
            window.location.href = '../index.html';
        } else {
            loadUsers();
        }
    } else {
        window.location.href = '../index.html';
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        checkAdmin(user).catch((error) => {
            console.error('Error checking admin status:', error);
        });
    } else {
        window.location.href = '../login.html';
    }
});

async function loadUsers() {
    const usersCollection = collection(firestore, 'users');
    const usersQuery = query(usersCollection, orderBy('role'));
    const usersSnapshot = await getDocs(usersQuery);
    const usersList = usersSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    const currentUser = auth.currentUser.uid;
    const usersTableBody = document
        .getElementById('users-table')
        .getElementsByTagName('tbody')[0];
    usersTableBody.innerHTML = '';

    usersList.forEach((user) => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = user.name;
        row.appendChild(nameCell);

        const emailCell = document.createElement('td');
        emailCell.textContent = user.email;
        row.appendChild(emailCell);

        const roleCell = document.createElement('td');
        roleCell.style.cursor = currentUser === user.uid ? 'not-allowed' : 'pointer';
        roleCell.style.color = user.role === 'מנהל' ? '#d94f0b' : '#007bff';
        roleCell.innerHTML = `<span>${user.role}</span> <i class="fas fa-edit"></i>`;
        if (currentUser !== user.uid) {
            roleCell.onclick = async () => {
                const newRole = user.role === 'מנהל' ? 'משתמש' : 'מנהל';
                roleCell.innerHTML = `<span>${newRole}</span> <i class="fas fa-edit"></i>`;
                roleCell.style.color = newRole === 'מנהל' ? '#d94f0b' : '#007bff';
                try {
                    await updateRole(user.id, newRole);
                } catch (error) {
                    console.error('Error updating role:', error);
                    roleCell.innerHTML = `<span>${user.role}</span> <i class="fas fa-edit"></i>`;
                    roleCell.style.color = user.role === 'מנהל' ? '#d94f0b' : '#007bff';
                }
            };
        }
        row.appendChild(roleCell);

        const profilePicCell = document.createElement('td');
        const profilePicImg = document.createElement('img');
        profilePicImg.src = user.profilePicUrl;
        profilePicImg.alt = 'Profile Picture';
        profilePicImg.classList.add('profile-pic');
        profilePicCell.appendChild(profilePicImg);
        row.appendChild(profilePicCell);

        const chatCell = document.createElement('td');
        const chatButton = document.createElement('button');
        chatButton.textContent = 'צפייה בשיחה';
        chatButton.classList.add('admin-action-button');
        chatButton.onclick = () => {
            window.location.href = `view_chat.html?userId=${user.uid}`;
        };
        chatCell.appendChild(chatButton);
        row.appendChild(chatCell);

        const surveyCell = document.createElement('td');
        const surveyButton = document.createElement('button');
        surveyButton.textContent = 'צפייה בסקר';
        surveyButton.classList.add('admin-action-button');
        surveyButton.onclick = () => {
            window.location.href = `view_survey.html?userId=${user.uid}`;
        };
        surveyCell.appendChild(surveyButton);
        row.appendChild(surveyCell);

        usersTableBody.appendChild(row);
    });
}

async function updateRole(userId, newRole) {
    const userDocRef = doc(firestore, 'users', userId);
    await updateDoc(userDocRef, { role: newRole });
}
// Placeholder for GIF editing logic
// Add any specific functionality related to GIF editing in this section
document.getElementById('edit-gif-button')?.addEventListener('click', () => {
    window.location.href = 'gif_editor.html';
});