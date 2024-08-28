import { firestore, storage } from './firebase.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    limit,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
    ref,
    listAll,
    getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

const url = 'https://europe-west1-chazi-b7b36.cloudfunctions.net';


async function checkAuthState() {
    let userId = localStorage.getItem("userId");

    if (!userId) {
        try {
            const docRef = await addDoc(collection(firestore, "guests"), {
                createdAt: new Date()
            });

            userId = docRef.id;
            localStorage.setItem("userId", userId);

            return userId;
        } catch (error) {
            console.error("שגיאה ביצירת משתמש חדש:", error);
        }
    } else {
        return userId;
    }
}

async function waitForUserInput(userId) {

    const myUrl = './images/my_image.png';

    return new Promise((resolve) => {
        const inputBar = document.querySelector('.input-bar input');
        const sendButton = document.querySelector('.send-button');

        function handleUserInput() {
            const userMessage = inputBar.value.trim();
            if (userMessage) {
                addMessage('sent', userMessage, myUrl);
                addMessageToFirebase(userId, 'sent', userMessage);
                inputBar.value = '';
                inputBar.removeEventListener('keypress', handleEnterKey);
                sendButton.removeEventListener('click', handleUserInput);
                resolve(userMessage);
            }
        }

        function handleEnterKey(event) {
            if (event.key === 'Enter') {
                handleUserInput();
            }
        }

        inputBar.removeEventListener('keypress', handleEnterKey);
        sendButton.removeEventListener('click', handleUserInput);

        inputBar.addEventListener('keypress', handleEnterKey);
        sendButton.addEventListener('click', handleUserInput);
    });
}

async function checkWorkProblem(message) {
    try {
        const response = await fetch(`${url}/isWorkRelatedIssue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data.isWorkRelated;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

async function getAllProblemQuestions() {
    try {
        const questionsCollectionRef = collection(
            firestore,
            'problem_questions'
        );
        const querySnapshot = await getDocs(questionsCollectionRef);

        const questionsList = [];

        querySnapshot.forEach((doc) => {
            questionsList.push(doc.data().question);
        });

        return questionsList;
    } catch (error) {
        console.error('Error fetching problem questions:', error);
        return [
            "אילו בעיות או אתגרים אתה נתקל בהם בעבודה שלך ביום יום?",
            "כיצד אתה ניגש לפתרון בעיות בעבודה, ומהם הכלים או השיטות שאתה משתמש בהם?"
          ];;
    }
}

async function getBestTwoQuestions(userInput, questions) {
    const response = await fetch(`${url}/chooseQuestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userInput: userInput,
            questions: questions,
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.questions;
}

async function getSolutionAnswer(
    userProblem,
    systemQuestionsAnswers,
) {
    const response = await fetch(`${url}/generateSolution`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userProblem: userProblem,
            systemQuestionsAnswers: systemQuestionsAnswers
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.solution;
}

async function startConversation(userId) {
    let botMessage = 'היי אני חזי, איך אני יכול לעזור לך היום?';
    addMessage('received', botMessage);
    addMessageToFirebase(userId, 'received', botMessage);

    let userResponse = await waitForUserInput(userId);

    let isProblem = await checkWorkProblem(userResponse);

    while (!isProblem) {
        botMessage = 'האם יש לך בעיה בעבודה שאני אוכל לעזור?';
        addMessage('received', botMessage);
        addMessageToFirebase(userId, 'received', botMessage);

        userResponse = await waitForUserInput(userId);
        isProblem = await checkWorkProblem(userResponse);
    }

    const questionPool = await getAllProblemQuestions();
    const selectedQuestions = await getBestTwoQuestions(userResponse, questionPool);

    let questionsList = selectedQuestions.split("XXX");

    addMessage('received', questionsList[0]);
    addMessageToFirebase(userId, 'received', questionsList[0]);
    const userAnswer1 = await waitForUserInput(userId);

    addMessage('received', questionsList[1]);
    addMessageToFirebase(userId, 'received', questionsList[1]);
    const userAnswer2 = await waitForUserInput(userId);

    addMessage('received', 'חזי בונה לך תשובה עכשיו...');
    addMessageToFirebase(userId, 'received', 'חזי בונה לך תשובה עכשיו...');
    showPopup();

    const solution = await getSolutionAnswer(
        userResponse,
        `${questionsList[0]}: ${userAnswer1}, ${questionsList[1]}: ${userAnswer2}`
    );

    addMessage('received', solution);
    addMessageToFirebase(userId, 'received', solution);

    setTimeout(() => {
        startConversation(userId)
    }, 3000);
}

async function addMessageToFirebase(userId, type, text) {

    if (text === 'היי אני חזי, איך אני יכול לעזור לך היום?') {
        const messagesCollectionRef = collection(firestore, `guests/${userId}/messages`);
        const q = query(messagesCollectionRef, orderBy('timestamp', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const lastMessage = querySnapshot.docs[0].data().text;

            if (lastMessage === 'היי אני חזי, איך אני יכול לעזור לך היום?') {
                return;
            }
        }
    }

    try {
        await addDoc(collection(firestore, `guests/${userId}/messages`), {
            type,
            text,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding message to Firebase: ', error);
    }
}

async function loadMessagesFromFirebase(userId) {
    const q = query(
        collection(firestore, `guests/${userId}/messages`),
        orderBy('timestamp')
    );
    const myUrl = './images/my_image.png';
    const chatWindow = document.querySelector('.chat-window');

    onSnapshot(q, (snapshot) => {
        chatWindow.innerHTML = ''; // Clear chat window
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            addMessage(messageData.type, messageData.text, myUrl);
        });
    });
}

function addMessage(type, text, picUrl, timestamp) {
    const message = document.createElement('div');
    message.classList.add('message', type);
    const imgSrc =
        type === 'sent' || type === 'sentGif' ? './images/my_image.png' : 'images/bot_image.png';
    const timeString = timestamp
        ? new Date(timestamp.seconds * 1000).toLocaleTimeString('he-IL')
        : '';

    // טיפול בהודעות GIF
    if (type === 'sentGif') {
        message.innerHTML = `
            <img src="${imgSrc}" alt="${type}" class="profile-pic">
            <div class="${type} message-content">
                <img src="${text}" alt="GIF" class="gif-message">
                <span class="timestamp">${timeString}</span>
            </div>
        `;
    } else if (type === 'receivedGif') {
        message.innerHTML = `
            <img src="${imgSrc}" alt="${type}" class="profile-pic">
            <div class="${type} message-content">
                <img src="${text}" alt="GIF" class="gif-message">
                <span class="timestamp">${timeString}</span>
            </div>
        `;
    }
    // טיפול בהודעות רגילות
    else {
        message.innerHTML = `<img src="${imgSrc}" alt="${type}" class="profile-pic"><div class="${type} message-content"><p>${text}</p><span class="timestamp">${timeString}</span></div>`;
    }

    const chatWindow = document.querySelector('.chat-window');
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight
    }, 1000)
}

async function sendRandomGif(userId) {
    try {
        const gifLinks = await getGiffFolderLinks();
        const randomGif = gifLinks[Math.floor(Math.random() * gifLinks.length)];
        addMessage('sentGif', randomGif);
        addMessageToFirebase(userId, 'receivedGif', randomGif);
    } catch (error) {
        console.error('Error sending random GIF:', error);
    }
}

async function addEventListeners(userId) {
    const gifContainer = document.getElementById('stickers-popup');
    const giffButton = document.querySelector('.stickers-button');

    const allGiffLinks = await getGiffFolderLinks();    

    gifContainer.innerHTML = '';

    let imageHtml = '';
    allGiffLinks.forEach((link) => {
        imageHtml += `<img src="${link}" alt="Gif" class="gif-image" style="width: 20%; height: auto; margin: 10px;" data-url="${link}">`;
    });

    gifContainer.innerHTML = imageHtml;

    document.querySelectorAll('.gif-image').forEach((gif) => {
        gif.addEventListener('click', () => {
            const gifUrl = gif.getAttribute('data-url');            
            addMessage('sentGif', gifUrl);
            addMessageToFirebase(userId, 'sentGif', gifUrl);

            const stickersPopup = document.getElementById('stickers-popup');
            stickersPopup.classList.remove('show');
            stickersPopup.classList.add('hidden');

            sendRandomGif(userId);
        });
    });

    giffButton.addEventListener('click', () => {
        const stickersPopup = document.getElementById('stickers-popup');
        stickersPopup.classList.toggle('show');
        stickersPopup.classList.toggle('hidden');
    });
}

async function getGiffFolderLinks() {
    const giffFolderRef = ref(storage, 'giff/');
    let imageLinks = [];

    try {
        // רשימת כל האובייקטים בתיקייה
        const result = await listAll(giffFolderRef);

        const promises = result.items.map(async (itemRef) => {
            const downloadURL = await getDownloadURL(itemRef);
            return downloadURL;
        });

        imageLinks = await Promise.all(promises);

        return imageLinks;
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

async function showPopup() {
    setTimeout(() => {
        const popup = document.getElementById('popup');
        const getToKnowButton = document.getElementById('get-to-know');
        const maybeLaterButton = document.getElementById('maybe-later');
    
        popup.classList.remove('hidden');
        popup.classList.add('show');
    
        getToKnowButton.addEventListener('click', () => {
            window.location.href = 'register.html';
        });
    
        maybeLaterButton.addEventListener('click', () => {
            popup.classList.remove('show');
            popup.classList.add('hide');
        });
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = await checkAuthState();
        loadMessagesFromFirebase(userId);
        addEventListeners(userId);

            await startConversation(userId);
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});
