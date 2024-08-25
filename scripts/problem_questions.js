import { firestore } from './firebase.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

document.getElementById('addProblemQuestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const question = document.getElementById('question').value;
    const messageElement = document.getElementById('message');

    try {
        const existingQuestionQuery = query(
            collection(firestore, 'problem_questions'),
            where('question', '==', question)
        );
        const existingQuestionSnapshot = await getDocs(existingQuestionQuery);

        if (!existingQuestionSnapshot.empty) {
            alert('שאלה זו כבר קיימת!');
            return;
        }

        const docData = {
            question: question,
            timestamp: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'problem_questions'), docData);
        alert('שאלת בעיה נוספה בהצלחה!');
        loadProblemQuestions();
    } catch (error) {
        console.error('Error adding document: ', error);
        messageElement.textContent = 'שגיאה בהוספת שאלת בעיה.';
        messageElement.style.color = 'red';
    }

    document.getElementById('addProblemQuestionForm').reset();
});

const problemQuestionsContainer = document.getElementById('problemQuestionsContainer');
const questionCountElement = document.createElement('p');
questionCountElement.id = 'questionCount';
problemQuestionsContainer.parentNode.insertBefore(questionCountElement, problemQuestionsContainer);

async function loadProblemQuestions() {
    problemQuestionsContainer.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(firestore, 'problem_questions'));
        const questionCount = querySnapshot.size;
        questionCountElement.textContent = `סך הכל שאלות: ${questionCount}`;

        querySnapshot.forEach((doc) => {
            const questionData = doc.data();
            const questionElement = document.createElement('div');
            questionElement.classList.add('question-item');
            questionElement.innerHTML = `
                <p><strong>שאלה:</strong> ${questionData.question}</p>
                <button class="delete-button" data-id="${doc.id}" data-question="${questionData.question}">מחק</button>
            `;
            problemQuestionsContainer.appendChild(questionElement);
        });

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach((button) => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const question = e.target.getAttribute('data-question');
                try {
                    await deleteDoc(doc(firestore, 'problem_questions', id));
                    e.target.parentElement.remove();
                    alert('השאלה נמחקה בהצלחה!');
                    loadProblemQuestions();
                } catch (error) {
                    console.error('Error removing document: ', error);
                    alert('שגיאה במחיקת השאלה.');
                }
            });
        });
    } catch (error) {
        console.error('Error loading questions: ', error);
    }
}

loadProblemQuestions();