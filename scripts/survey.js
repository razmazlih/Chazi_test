import { auth, firestore, secretKey } from './firebase.js';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const questionsContainer = document.getElementById('questionsContainer');
const surveyForm = document.getElementById('surveyForm');
const messageElement = document.getElementById('message');
const nextButton = document.getElementById('nextButton');
const submitButton = document.querySelector('.custom-submit-button');
let currentQuestionIndex = 0;
let questions = [];
const questionsMap = {};

async function loadQuestions() {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        const answeredQuestions = new Set();
        const surveysCollectionRef = collection(
            firestore,
            `users/${user.uid}/surveys`
        );
        const surveysSnapshot = await getDocs(surveysCollectionRef);

        surveysSnapshot.forEach((doc) => {
            const data = doc.data();
            answeredQuestions.add(data.quest);
        });

        const querySnapshot = await getDocs(collection(firestore, 'quests'));
        querySnapshot.forEach((doc) => {
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

function showQuestion() {
    questionsContainer.innerHTML = '';
    if (currentQuestionIndex < questions.length) {
        const questionData = questions[currentQuestionIndex];
        const questionElement = document.createElement('div');
        questionElement.classList.add('custom-question-item');
        questionElement.innerHTML = `
            <p><strong>שאלה:</strong> ${questionData.question}</p>
            <div class="custom-radio-group">
                ${
                    questionData.answerType === 'בחירה-מרובה'
                        ? questionData.answer
                              .map(
                                  (choice) => `
                            <label class="custom-radio-label">
                                <input type="radio" name="question-${questionData.id}" value="${choice}" required>
                                <span class="custom-radio-button"></span>
                                ${choice}
                            </label>
                        `
                              )
                              .join('')
                        : `<input type="text" name="question-${questionData.id}" class="custom-input-field" required>`
                }
            </div>
        `;
        questionsContainer.appendChild(questionElement);

        // Add animation class after a short delay to trigger the transition
        setTimeout(() => {
            questionElement.classList.add('show');
        }, 10);

        nextButton.style.display = 'block';
        submitButton.style.display = 'none';
    } else {
        nextButton.style.display = 'none';
        submitButton.style.display = 'block';
    }
}

nextButton.addEventListener('click', async () => {
    handleNextQuestion();
});

surveyForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentQuestionIndex < questions.length) {
            handleNextQuestion();
        } else {
            surveyForm.submit();
        }
    }
});

async function handleNextQuestion() {
    const formData = new FormData(surveyForm);
    const questionId = questions[currentQuestionIndex].id;
    const answer = formData.get(`question-${questionId}`);

    if (!answer) {
        alert('אנא מלא את התשובה לשאלה הנוכחית');
        return;
    }

    try {
        const user = auth.currentUser;
        const surveysCollectionRef = collection(
            firestore,
            `users/${user.uid}/surveys`
        );
        await addDoc(surveysCollectionRef, {
            quest: questionsMap[questionId],
            answer: answer,
            timestamp: serverTimestamp(),
        });

        // Remove the current question with animation
        const currentQuestionElement = questionsContainer.querySelector('.custom-question-item');
        currentQuestionElement.classList.remove('show');
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, 500); // Match the transition duration

    } catch (error) {
        console.error('Error submitting answer: ', error);
        alert('שגיאה בשליחת התשובה. נסה שוב.');
    }
}

async function getSummary(userId) {
    const surveysCollectionRef = collection(firestore, `users/${userId}/surveys`);
    const surveysSnapshot = await getDocs(surveysCollectionRef);

    const answers = [];
    surveysSnapshot.forEach(doc => {
        const data = doc.data();
        answers.push({
            myQuestion: data.quest,
            myAnswer: data.answer,
        });
    });

    const functionUrl = 'https://europe-west1-chazi-b7b36.cloudfunctions.net/summarizeQA';

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const body = JSON.stringify({
        userId: userId,
        answers: answers,
    });

    const requestOptions = {
        method: 'POST',
        headers: headers,
        body: body,
    };

    try {
        const response = await fetch(functionUrl, requestOptions);
        if (!response.ok) {
            console.error('Server response:', response);
            throw new Error(`Server error: ${response.status}`);
        }
        const result = await response.json();
        return result.summary;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function createSummaryDocument(userId) {
    const summary = await getSummary(userId)

    const summaryDocRef = doc(firestore, `users/${userId}/summary/mySummary`);
    await setDoc(summaryDocRef, { content: summary, timestamp: serverTimestamp() });
}

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
        await createSummaryDocument(user.uid);
        alert('התשובות נקלטו בהצלחה!');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error submitting answers: ', error);
        messageElement.textContent = 'שגיאה בשליחת התשובות.';
        messageElement.style.color = 'red';
    }

    surveyForm.reset();
});

auth.onAuthStateChanged((user) => {
    if (user) {
        loadQuestions();
    } else {
        window.location.href = 'login.html';
    }
});

const backButton = document.getElementById('back');
backButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});