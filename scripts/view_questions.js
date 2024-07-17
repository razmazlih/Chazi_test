import { firestore } from './firebase.js';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

const questionsContainer = document.getElementById('questionsContainer');

async function loadQuestions() {
    try {
        const querySnapshot = await getDocs(collection(firestore, 'quests'));
        querySnapshot.forEach((doc) => {
            const questionData = doc.data();
            const questionElement = document.createElement('div');
            questionElement.classList.add('question-item');
            questionElement.innerHTML = `
                <p><strong>שאלה:</strong> ${questionData.question}</p>
                <p><strong>סוג תשובה:</strong> ${questionData.answerType}</p>
                ${
                    questionData.answerType === 'בחירה-מרובה'
                        ? `<p><strong>אופציות:</strong> ${questionData.answer.join(
                              ', '
                          )}</p>`
                        : ''
                }
                <button class="delete-button" data-id="${doc.id}">מחק</button>
            `;
            questionsContainer.appendChild(questionElement);
        });

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach((button) => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                try {
                    await deleteDoc(doc(firestore, 'quests', id));
                    e.target.parentElement.remove();
                    alert('השאלה נמחקה בהצלחה!');
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

loadQuestions();
