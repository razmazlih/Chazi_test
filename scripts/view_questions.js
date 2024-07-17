import { firestore } from './firebase.js';
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
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
                <button class="delete-button" data-id="${
                    doc.id
                }" data-question="${questionData.question}">מחק</button>
            `;
            questionsContainer.appendChild(questionElement);
        });

        const deleteButtons = document.querySelectorAll('.delete-button');
        deleteButtons.forEach((button) => {
            button.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const question = e.target.getAttribute('data-question');
                try {
                    await deleteDoc(doc(firestore, 'quests', id));
                    await deleteAnswersForQuestion(question);
                    e.target.parentElement.remove();
                    alert('השאלה והתשובות נמחקו בהצלחה!');
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

async function deleteAnswersForQuestion(question) {
    try {
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        usersSnapshot.forEach(async (userDoc) => {
            const userId = userDoc.id;
            const surveysQuery = query(
                collection(firestore, `users/${userId}/surveys`),
                where('quest', '==', question)
            );
            const surveysSnapshot = await getDocs(surveysQuery);
            surveysSnapshot.forEach(async (surveyDoc) => {
                await deleteDoc(
                    doc(firestore, `users/${userId}/surveys`, surveyDoc.id)
                );
            });
        });
    } catch (error) {
        console.error('Error deleting answers for question: ', error);
    }
}

loadQuestions();
