import { storage } from './firebase.js';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    listAll,
    deleteObject,
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

const dropZone = document.getElementById('dropZone');
const gifFilesInput = document.getElementById('gifFiles');

// Handle drag-and-drop
dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    const files = event.dataTransfer.files;
    gifFilesInput.files = files;
});

dropZone.addEventListener('click', () => {
    gifFilesInput.click();
});

// Upload multiple GIFs
document.getElementById('uploadGifForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const gifFiles = gifFilesInput.files;
    if (!gifFiles.length) {
        showMessage('אנא בחר או גרור קבצי GIF');
        return;
    }

    let uploadedCount = 0;

    for (let i = 0; i < gifFiles.length; i++) {
        const gifFile = gifFiles[i];
        const gifRef = ref(storage, `giff/${gifFile.name}`);
        const uploadTask = uploadBytesResumable(gifRef, gifFile);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                // Optional: handle progress
            },
            (error) => {
                console.error('Error uploading GIF:', error);
                showMessage('שגיאה בהעלאת GIF');
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then(() => {
                    uploadedCount++;
                    if (uploadedCount === gifFiles.length) {
                        showMessage('כל קבצי ה-GIF הועלו בהצלחה');
                        loadGifs(); // Reload GIFs after all uploads are complete
                    }
                });
            }
        );
    }
});

// Load existing GIFs from Firebase Storage
function loadGifs() {
    const gifContainer = document.getElementById('gifContainer');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');
    gifContainer.innerHTML = '';

    const gifsRef = ref(storage, 'giff/');
    listAll(gifsRef)
        .then((res) => {
            res.items.forEach((itemRef) => {
                getDownloadURL(itemRef).then((url) => {
                    const gifItem = document.createElement('div');
                    gifItem.classList.add('gif-item');

                    const gifImage = document.createElement('img');
                    gifImage.src = url;
                    gifImage.alt = 'GIF';

                    // Add a unique reference to the item for deletion
                    gifItem.setAttribute('data-ref', itemRef.fullPath);

                    // Selection mechanism
                    gifItem.addEventListener('click', () => {
                        gifItem.classList.toggle('selected');
                        updateDeleteButtonState();
                    });

                    gifItem.appendChild(gifImage);
                    gifContainer.appendChild(gifItem);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading GIFs:', error);
            showMessage('שגיאה בטעינת GIFs');
        });
}

// Update the state of the "Delete Selected" button
function updateDeleteButtonState() {
    const selectedItems = document.querySelectorAll('.gif-item.selected');
    const deleteSelectedButton = document.getElementById('deleteSelectedButton');
    deleteSelectedButton.disabled = selectedItems.length === 0;
}

// Delete selected GIFs
document.getElementById('deleteSelectedButton').addEventListener('click', () => {
    const selectedItems = document.querySelectorAll('.gif-item.selected');
    const promises = [];

    selectedItems.forEach((item) => {
        const itemRef = item.getAttribute('data-ref');
        if (itemRef) {
            const gifRef = ref(storage, itemRef);
            promises.push(deleteObject(gifRef));
        }
    });

    Promise.all(promises)
        .then(() => {
            showMessage('כל ה-GIFs שנבחרו נמחקו בהצלחה');
            loadGifs(); // Reload GIFs after deletion
        })
        .catch((error) => {
            console.error('Error deleting GIFs:', error);
            showMessage('שגיאה במחיקת GIFs');
        });
});

document.getElementById('back').addEventListener('click', () => {
    window.location.href = 'admin_dashboard.html';
});

// Show message to the user
function showMessage(message) {
    const messageContainer = document.getElementById('message');
    messageContainer.textContent = message;
    setTimeout(() => {
        messageContainer.textContent = '';
    }, 3000);
}

// Load GIFs when the page is loaded
window.onload = () => {
    loadGifs();
};