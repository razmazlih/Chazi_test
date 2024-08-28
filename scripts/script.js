import { auth, firestore, storage } from './firebase.js';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    getDocs,
    limit,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
    ref,
    listAll,
    getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

const url = 'https://chazi-server.onrender.com';

async function isIdForUser(userId) {
    const surveysCollectionRef = collection(
        firestore,
        `users/${userId}/surveys`
    );
    const questsCollectionRef = collection(firestore, 'quests');

    const surveysSnapshot = await getDocs(surveysCollectionRef);
    const questsSnapshot = await getDocs(questsCollectionRef);

    const surveysData = surveysSnapshot.docs.map((doc) => doc.data());
    const questsData = questsSnapshot.docs.map((doc) => doc.data());

    const sortFunction = (a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b));
    surveysData.sort(sortFunction);
    questsData.sort(sortFunction);

    const areCollectionsEqual = surveysData.length === questsData.length;

    return areCollectionsEqual;
}

function checkAuthState() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                const userId = user.uid;
                resolve(userId);
            } else {
                window.location.href = 'login.html';
                reject('No user signed in');
            }
        });
    });
}

async function addMessageToFirebase(userId, type, text) {
    try {
        await addDoc(collection(firestore, `users/${userId}/messages`), {
            type,
            text,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding message to Firebase: ', error);
    }
}

async function getProfilePicUrl(userId) {
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    return userData.profilePicUrl;
}

async function loadMessagesFromFirebase(userId) {
    const q = query(
        collection(firestore, `users/${userId}/messages`),
        orderBy('timestamp')
    );
    const myUrl = await getProfilePicUrl(userId);
    const chatWindow = document.querySelector('.chat-window');

    onSnapshot(q, (snapshot) => {
        chatWindow.innerHTML = '';
        snapshot.forEach((doc) => {
            const messageData = doc.data();
            addMessage(messageData.type, messageData.text, myUrl);
        });
    });
}

async function waitForUserInput(userId) {

    const myUrl = await getProfilePicUrl(userId);

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

        // הסרת מאזינים קיימים (אם קיימים)
        inputBar.removeEventListener('keypress', handleEnterKey);
        sendButton.removeEventListener('click', handleUserInput);

        // הוספת מאזינים
        inputBar.addEventListener('keypress', handleEnterKey);
        sendButton.addEventListener('click', handleUserInput);
    });
}

function addMessage(type, text, picUrl, timestamp) {
    const message = document.createElement('div');
    message.classList.add('message', type);
    const imgSrc =
        type === 'sent' || type === 'sentGif' ? picUrl : 'images/bot_image.png';
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
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 1000);
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

async function getLifeSummary(userId) {
    const docRef = doc(firestore, `users/${userId}/summary/mySummary`);
    const docSnap = await getDoc(docRef);
    const selfSummary = docSnap.data().content;
    return selfSummary;
}

async function getBestTwoQuestions(userInput, questions) {
    const response = await fetch(`${url}/choose-questions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_input: userInput,
            questions: questions,
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.selected_questions;
}

async function getSolutionAnswer(
    userProblem,
    systemQuestionsAnswers,
    userLifeSummary = null
) {
    const response = await fetch(`${url}/generate-solution`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_problem: userProblem,
            system_questions_answers: systemQuestionsAnswers,
            user_life_summary: userLifeSummary,
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.solution;
}

async function addEventListeners(userId) {
    const inputBar = document.querySelector('.input-bar input');
    const sendButton = document.querySelector('.send-button');
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

    // sendButton.addEventListener('click', () => {
    //     const messageText = inputBar.value.trim();
    //     if (messageText) {
    //         addMessage('sent', messageText);
    //         addMessageToFirebase(userId, 'sent', messageText);
    //         inputBar.value = '';
    //         getBotResponse(userId, messageText);
    //     }
    // });

    // inputBar.addEventListener(
    //     'keypress',
    //     debounce((e) => {
    //         if (e.key === 'Enter') {
    //             const messageText = inputBar.value.trim();
    //             if (messageText) {
    //                 addMessage('sent', messageText);
    //                 addMessageToFirebase(userId, 'sent', messageText);
    //                 inputBar.value = '';
    //                 getBotResponse(userId, messageText);
    //             }
    //         }
    //     }, 300)
    // );

    giffButton.addEventListener('click', () => {
        const stickersPopup = document.getElementById('stickers-popup');
        stickersPopup.classList.toggle('show');
        stickersPopup.classList.toggle('hidden');
    });

    const isSurvey = await isIdForUser(userId);

    if (!isSurvey) {
        setTimeout(() => {
            const popup = document.getElementById('popup');
            const getToKnowButton = document.getElementById('get-to-know');
            const maybeLaterButton = document.getElementById('maybe-later');

            popup.classList.remove('hidden');
            popup.classList.add('show');

            getToKnowButton.addEventListener('click', () => {
                window.location.href = 'survey.html';
            });

            maybeLaterButton.addEventListener('click', () => {
                popup.classList.remove('show');
                popup.classList.add('hide');
            });
        }, 3000);
    }
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

async function checkWorkProblem(message) {
    try {
        const response = await fetch(`${url}/check_work_issue`, {
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
        return data.work_related;
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
        return [];
    }
}

async function startConversation(userId) {
    let botMessage = 'היי אני חזי, איך אני יכול לעזור לך היום?';
    addMessage('received', botMessage);

    let userProblem = await waitForUserInput(userId);

    let isProblem = await checkWorkProblem(userProblem);    

    while (!isProblem) {
        botMessage = 'האם יש לך בעיה בעבודה שאני אוכל לעזור?';
        addMessage('received', botMessage);
        addMessageToFirebase(userId, 'received', botMessage);

        userProblem = await waitForUserInput(userId);

        isProblem = await checkWorkProblem(userProblem);
    }

    const questionPool = await getAllProblemQuestions();

    const selectedQuestions = await getBestTwoQuestions(
        userProblem,
        questionPool
    );

    let questionsList = selectedQuestions.split("XXX");
    console.log(questionsList);

    addMessage('received', questionsList[0]);
    addMessageToFirebase(userId, 'received', questionsList[0]);
    const userAnswer1 = await waitForUserInput(userId);

    addMessage('received', questionsList[1]);
    addMessageToFirebase(userId, 'received', questionsList[1]);
    const userAnswer2 = await waitForUserInput(userId);

    addMessage('received', 'חזי בונה לך תשובה עכשיו...');

    const solution = await getSolutionAnswer(
        userProblem,
        `${selectedQuestions[0]}: ${userAnswer1}, ${selectedQuestions[1]}: ${userAnswer2}`,
        await getLifeSummary(userId)
    );

    addMessage('received', solution);
    addMessageToFirebase(userId, 'received', solution);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userId = await checkAuthState();
        if (!userId) {
            throw new Error('User ID not found');
        }

        // Loading messages
        try {
            await loadMessagesFromFirebase(userId);
        } catch (error) {
            console.error('Error loading messages:', error);
            // Optionally display an error message to the user
        }

        // Adding event listeners
        try {
            await addEventListeners(userId);
        } catch (error) {
            console.error('Error adding event listeners:', error);
            // Optionally display an error message to the user
        }

        // Start the conversation
        try {
            await startConversation(userId);
        } catch (error) {
            console.error('Error starting conversation:', error);
            // Optionally display an error message to the user
        }
    } catch (error) {
        console.error('Error checking auth state or initializing page:', error);
        // Redirect to login page or display an error message
        window.location.href = 'login.html';
    }
});
