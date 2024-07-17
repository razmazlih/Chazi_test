import { firestore } from './firebase.js';
import {
    collection,
    addDoc,
    serverTimestamp,
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
            messageElement.textContent = 'השאלה נוספה בהצלחה!';
            messageElement.style.color = 'green';
        } catch (error) {
            console.error('Error adding document: ', error);
            messageElement.textContent = 'שגיאה בהוספת השאלה.';
            messageElement.style.color = 'red';
        }

        document.getElementById('addQuestionForm').reset();
        document.getElementById('multipleChoiceContainer').style.display =
            'none';
    });
