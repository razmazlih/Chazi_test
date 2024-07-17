import { firestore } from './firebase.js';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

const auth = getAuth();
const questionsContainer = document.getElementById('questionsContainer');
const surveyForm = document.getElementById('surveyForm');
const messageElement = document.getElementById('message');
const questionsMap = {};

async function loadQuestions() {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'quests'));
        querySnapshot.forEach((doc) => {
            const questionData = doc.data();
            questionsMap[doc.id] = questionData.question; // הוספת השאלה למפה
            const questionElement = document.createElement('div');
            questionElement.classList.add('question-item');
            questionElement.innerHTML = `
                <p><strong>שאלה:</strong> ${questionData.question}</p>
                ${
                    questionData.answerType === 'בחירה-מרובה'
                        ? `
                    ${questionData.answer
                        .map(
                            (choice, index) => `
                        <label>
                            <input type="radio" name="question-${doc.id}" value="${choice}" required>
                            ${choice}
                        </label>
                    `
                        )
                        .join('')}
                `
                        : `
                    <input type="text" name="question-${doc.id}" class="input-field" required>
                `
                }
            `;
            questionsContainer.appendChild(questionElement);
        });
    } catch (error) {
        console.error('Error loading questions: ', error);
    }
}

surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
    }

    const answers = [];
    const formData = new FormData(surveyForm);
    formData.forEach((value, key) => {
        const questionId = key.split('-')[1]; // חלוקת המחרוזת על מנת לקבל את ה-ID של השאלה
        answers.push({
            myQuestion: questionsMap[questionId], // הוספת השאלה
            myAnswer: value,
        });
    });

    try {
        const surveysCollectionRef = collection(
            firestore,
            `users/${user.uid}/surveys`
        );
        for (const answer of answers) {
            await addDoc(surveysCollectionRef, {
                quest: answer.myQuestion,
                answer: answer.myAnswer,
                timestamp: serverTimestamp(),
            });
        }
        alert('התשובות נקלטו בהצלחה!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error submitting answers: ', error);
        messageElement.textContent = 'שגיאה בשליחת התשובות.';
        messageElement.style.color = 'red';
    }

    surveyForm.reset();
});

loadQuestions();

const backButton = document.getElementById('back');
backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});
