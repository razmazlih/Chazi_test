import { auth, firestore } from './firebase.js';
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

const questionsContainer = document.getElementById('questionsContainer');
const surveyForm = document.getElementById('surveyForm');
const messageElement = document.getElementById('message');
const nextButton = document.getElementById('nextButton');
const submitButton = document.querySelector('.custom-submit-button');
let currentQuestionIndex = 0;
let questions = [];
const questionsMap = {};

// פונקציה לטעינת השאלות
async function loadQuestions() {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const answeredQuestions = new Set();
        const surveysCollectionRef = collection(firestore, `users/${user.uid}/surveys`);
        const surveysSnapshot = await getDocs(surveysCollectionRef);

        surveysSnapshot.forEach(doc => {
            const data = doc.data();
            answeredQuestions.add(data.quest);
        });

        const querySnapshot = await getDocs(collection(firestore, 'quests'));
        querySnapshot.forEach(doc => {
            const questionData = doc.data();
            if (!answeredQuestions.has(questionData.question)) {
                questionsMap[doc.id] = questionData.question;
                questions.push({ id: doc.id, ...questionData });
            }
        });

        showQuestion();
    } catch (error) {
        console.error('Error loading questions: ', error);
    }
}

// פונקציה להצגת השאלה הנוכחית
function showQuestion() {
    questionsContainer.innerHTML = '';
    if (currentQuestionIndex < questions.length) {
        const questionData = questions[currentQuestionIndex];
        const questionElement = document.createElement('div');
        questionElement.classList.add('question-item');
        questionElement.innerHTML = `
            <p><strong>שאלה:</strong> ${questionData.question}</p>
            ${
                questionData.answerType === 'בחירה-מרובה'
                    ? questionData.answer.map(choice => `
                        <label>
                            <input type="radio" name="question-${questionData.id}" value="${choice}" required>
                            ${choice}
                        </label>
                    `).join('')
                    : `<input type="text" name="question-${questionData.id}" class="input-field" required>`
            }
        `;
        questionsContainer.appendChild(questionElement);
        nextButton.style.display = 'block';
        submitButton.style.display = 'none';
    } else {
        nextButton.style.display = 'none';
        submitButton.style.display = 'block';
    }
}

// מאזין ללחיצה על כפתור "הבא"
nextButton.addEventListener('click', async () => {
    const formData = new FormData(surveyForm);
    const questionId = questions[currentQuestionIndex].id;
    const answer = formData.get(`question-${questionId}`);
    
    if (!answer) {
        alert('אנא מלא את התשובה לשאלה הנוכחית');
        return;
    }
    
    try {
        const user = auth.currentUser;
        const surveysCollectionRef = collection(firestore, `users/${user.uid}/surveys`);
        await addDoc(surveysCollectionRef, {
            quest: questionsMap[questionId],
            answer: answer,
            timestamp: serverTimestamp(),
        });
        currentQuestionIndex++;
        showQuestion();
    } catch (error) {
        console.error('Error submitting answer: ', error);
        alert('שגיאה בשליחת התשובה. נסה שוב.');
    }
});

// מאזין לאירוע שליחה של הטופס
surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const answers = [];
    const formData = new FormData(surveyForm);
    formData.forEach((value, key) => {
        const questionId = key.split('-')[1];
        answers.push({
            myQuestion: questionsMap[questionId],
            myAnswer: value,
        });
    });

    try {
        const surveysCollectionRef = collection(firestore, `users/${user.uid}/surveys`);
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

// מאזין למצב האימות של המשתמש
auth.onAuthStateChanged(user => {
    if (user) {
        loadQuestions();
    } else {
        window.location.href = 'login.html';
    }
});

// מאזין ללחיצה על כפתור "חזרה"
const backButton = document.getElementById('back');
backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});