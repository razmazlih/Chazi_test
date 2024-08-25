import { firestore } from './firebase.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
    doc,
    query,
    where,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

document.getElementById('answerType').addEventListener('change', () => {
    const answerType = document.getElementById('answerType').value;
    if (answerType === 'טקסט') {
        document.getElementById('multipleChoiceContainer').style.display =
            'none';
    } else if (answerType === 'בחירה-מרובה') {
        document.getElementById('multipleChoiceContainer').style.display =
            'block';
    }
});

document
    .getElementById('addQuestionForm')
    .addEventListener('submit', async (e) => {
        e.preventDefault();

        const question = document.getElementById('question').value;
        const answerType = document.getElementById('answerType').value;
        let answer = null;

        if (answerType === 'בחירה-מרובה') {
            answer = [
                document.getElementById('choice1').value,
                document.getElementById('choice2').value,
                document.getElementById('choice3').value,
                document.getElementById('choice4').value,
            ].filter((choice) => choice !== '');
        }

        const messageElement = document.getElementById('message');

        try {
            const docData = {
                question: question,
                answerType: answerType,
                timestamp: serverTimestamp(),
            };

            if (answerType === 'בחירה-מרובה') {
                docData.answer = answer;
            }

            await addDoc(collection(firestore, 'quests'), docData);
            alert('השאלה נוספה בהצלחה!');
        } catch (error) {
            console.error('Error adding document: ', error);
            messageElement.textContent = 'שגיאה בהוספת השאלה.';
            messageElement.style.color = 'red';
        }

        document.getElementById('addQuestionForm').reset();
        document.getElementById('multipleChoiceContainer').style.display =
            'none';

        loadQuestions();
    });

async function loadQuestions() {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';

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
