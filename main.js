import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    increment, 
    serverTimestamp, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Set Footer Year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuBtn.classList.toggle('fa-xmark');
    });
}

// Video Modal Logic
window.openVideo = function(videoSrc) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    player.src = videoSrc;
    modal.classList.add('active');
    player.play();
};

window.closeVideo = function() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    player.pause();
    player.src = '';
    modal.classList.remove('active');
};

// Project Likes Handling
const projectLikes = document.querySelectorAll('.project-like');
projectLikes.forEach(button => {
    const projectId = button.getAttribute('data-id');
    const likesSpan = button.querySelector('.project-likes');
    
    // Load local storage initial count if available
    let storedLikes = localStorage.getItem(`like_${projectId}`) || 0;
    likesSpan.textContent = storedLikes;
    if (localStorage.getItem(`liked_${projectId}`)) {
        button.classList.add('liked');
    }

    button.addEventListener('click', () => {
        let currentLikes = parseInt(likesSpan.textContent);
        if (!button.classList.contains('liked')) {
            currentLikes++;
            button.classList.add('liked');
            localStorage.setItem(`liked_${projectId}`, 'true');
        } else {
            currentLikes--;
            button.classList.remove('liked');
            localStorage.removeItem(`liked_${projectId}`);
        }
        likesSpan.textContent = currentLikes;
        localStorage.setItem(`like_${projectId}`, currentLikes);
    });
});

// Firebase Comments & Replies Logic
const commentForm = document.getElementById('commentForm');
const commentsContainer = document.getElementById('commentsContainer');

if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('commentName').value.trim();
        const message = document.getElementById('commentMessage').value.trim();

        if (name && message) {
            try {
                await addDoc(collection(db, "comments"), {
                    name: name,
                    message: message,
                    likes: 0,
                    timestamp: serverTimestamp(),
                    replies: []
                });
                commentForm.reset();
            } catch (error) {
                console.error("Error adding comment: ", error);
            }
        }
    });
}

// Real-time Comments Fetching
const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
    commentsContainer.innerHTML = '';
    snapshot.forEach((docSnap) => {
        const commentData = docSnap.data();
        const commentId = docSnap.id;
        
        const commentCard = document.createElement('div');
        commentCard.className = 'comment-card';
        
        const initial = commentData.name ? commentData.name.charAt(0).toUpperCase() : 'U';
        const dateStr = commentData.timestamp ? new Date(commentData.timestamp.toDate()).toLocaleDateString() : 'Just now';

        commentCard.innerHTML = `
            <div class="comment-header">
                <div class="comment-user-info">
                    <div class="avatar">${initial}</div>
                    <div class="comment-info">
                        <h3>${escapeHtml(commentData.name)}</h3>
                        <span class="comment-date">${dateStr}</span>
                    </div>
                </div>
            </div>
            <p class="comment-text">${escapeHtml(commentData.message)}</p>
            <div class="comment-actions">
                <button class="comment-like-btn" onclick="likeComment('${commentId}', ${commentData.likes || 0})">
                    ❤️ <span>${commentData.likes || 0}</span>
                </button>
                <button class="reply-btn" onclick="toggleReplyBox('${commentId}')"><i class="fa-solid fa-reply"></i> Reply</button>
                <button class="delete-btn" onclick="deleteComment('${commentId}')"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
            <div id="reply-box-${commentId}" style="display:none;" class="inline-reply-box">
                <input type="text" id="reply-name-${commentId}" placeholder="Your Name" required>
                <textarea id="reply-msg-${commentId}" placeholder="Write a reply..." required></textarea>
                <div>
                    <button class="submit-reply-btn" onclick="submitReply('${commentId}')">Post Reply</button>
                    <button class="cancel-reply-btn" onclick="toggleReplyBox('${commentId}')">Cancel</button>
                </div>
            </div>
            <div class="replies-container" id="replies-${commentId}">
                ${renderReplies(commentData.replies || [], commentId)}
            </div>
        `;
        commentsContainer.appendChild(commentCard);
    });
});

window.likeComment = async function(commentId, currentLikes) {
    const commentRef = doc(db, "comments", commentId);
    try {
        await updateDoc(commentRef, {
            likes: currentLikes + 1
        });
    } catch (error) {
        console.error("Error liking comment: ", error);
    }
};

window.deleteComment = async function(commentId) {
    if (confirm("Are you sure you want to delete this comment?")) {
        try {
            await deleteDoc(doc(db, "comments", commentId));
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    }
};

window.toggleReplyBox = function(commentId) {
    const box = document.getElementById(`reply-box-${commentId}`);
    box.style.display = box.style.display === 'none' ? 'flex' : 'none';
};

window.submitReply = async function(commentId) {
    const nameInput = document.getElementById(`reply-name-${commentId}`);
    const msgInput = document.getElementById(`reply-msg-${commentId}`);
    const name = nameInput.value.trim();
    const message = msgInput.value.trim();

    if (name && message) {
        try {
            const commentRef = doc(db, "comments", commentId);
            const commentSnap = await getDocs(collection(db, "comments")); // or target specific doc
            // To properly append to array in Firestore:
            const targetDoc = docSnap => docSnap.id === commentId;
            // Simplified fetch & update for replies array:
            // Fetch current document data first
            import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(async ({ getDoc }) => {
                const snap = await getDoc(commentRef);
                if (snap.exists()) {
                    const data = snap.data();
                    const replies = data.replies || [];
                    replies.push({ name, message, date: new Date().toLocaleDateString() });
                    await updateDoc(commentRef, { replies });
                    nameInput.value = '';
                    msgInput.value = '';
                    document.getElementById(`reply-box-${commentId}`).style.display = 'none';
                }
            });
        } catch (error) {
            console.error("Error adding reply: ", error);
        }
    }
};

function renderReplies(repliesArray) {
    if (!repliesArray || repliesArray.length === 0) return '';
    return repliesArray.map(r => `
        <div class="reply-card">
            <div class="reply-header">
                <strong>${escapeHtml(r.name)}</strong>
                <span>${r.date || ''}</span>
            </div>
            <p class="reply-text">${escapeHtml(r.message)}</p>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;")
               .replace(/'/g, "&#039;");
}
