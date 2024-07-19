import { auth, firestore } from './firebase.js';
import {
    collection,
    getDoc,
    doc,
    getDocs,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

async function checkAdmin() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== 'מנהל') {
            window.location.href = '../index.html';
        }
    } else {
        window.location.href = '../index.html';
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        checkAdmin().catch((error) => {
            console.error('Error checking admin status:', error);
        });
    } else {
        window.location.href = '../login.html';
    }
});

async function loadSurvey() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const surveyContainer = document.getElementById('survey-container');

    if (!userId) {
        surveyContainer.innerHTML = '<p>לא נמצא מזהה משתמש.</p>';
        return;
    }

    try {
        const summaryDoc = await getDoc(
            doc(firestore, `users/${userId}/summary/mySummary`)
        );
        if (summaryDoc.exists()) {
            const summaryData = summaryDoc.data();
            const summaryElement = document.createElement('div');
            summaryElement.classList.add('survey-summary');
            summaryElement.innerHTML = `<h2>סיכום:</h2><p>${summaryData.content}</p>`;
            surveyContainer.appendChild(summaryElement);
        } else {
            surveyContainer.innerHTML = '<p>לא נמצא סיכום עבור משתמש זה.</p>';
        }

        const surveysCollection = collection(
            firestore,
            `users/${userId}/surveys`
        );
        const querySnapshot = await getDocs(surveysCollection);

        if (querySnapshot.empty) {
            surveyContainer.innerHTML +=
                '<p>משתמש זה עדיין לא ענה על שאלות.</p>';
            return;
        }
        surveyContainer.innerHTML += '<h2>שאלון:</h2>'
        querySnapshot.forEach((doc) => {
            const surveyData = doc.data();
            const surveyElement = document.createElement('div');
            surveyElement.classList.add('survey-item');

            const questionElement = document.createElement('div');
            questionElement.classList.add('survey-question');

            const titleElement = document.createElement('div');
            titleElement.classList.add('survey-question-title');
            titleElement.textContent = `שאלה: ${surveyData.quest}`;

            const answerElement = document.createElement('div');
            answerElement.classList.add('survey-answer');
            answerElement.textContent = `תשובה: ${surveyData.answer}`;

            questionElement.appendChild(titleElement);
            questionElement.appendChild(answerElement);
            surveyElement.appendChild(questionElement);
            surveyContainer.appendChild(surveyElement);
        });
    } catch (error) {
        console.error('Error loading survey:', error);
        surveyContainer.innerHTML = '<p>אירעה שגיאה בטעינת הסקר.</p>';
    }
}

loadSurvey();
