import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDoc,
    doc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    query, 
    orderBy, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzw31yi2dStayYCjJiCS8sTtIsQ3OHlY8",
    authDomain: "ga-for-windows-99879.firebaseapp.com",
    projectId: "ga-for-windows-99879",
    storageBucket: "ga-for-windows-99879.firebasestorage.app",
    messagingSenderId: "590172219222",
    appId: "1:590172219222:web:0202ac673e26a56c1a58f7"
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

// Scroll Reveal Animation (Intersection Observer)
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, observerOptions);

document.querySelectorAll('.scroll-reveal').forEach(el => {
    observer.observe(el);
});

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

// Project Likes Handling via Firebase (Real-time sync)
const projectLikes = document.querySelectorAll('.project-like');
projectLikes.forEach(button => {
    const projectId = button.getAttribute('data-id');
    const likesSpan = button.querySelector('.project-likes');
    
    // Listen to project likes in real-time from Firestore collection "projects_likes"
    const projectRef = doc(db, "projects_likes", projectId);
    
    onSnapshot(projectRef, (docSnap) => {
        if (docSnap.exists()) {
            likesSpan.textContent = docSnap.data().likes || 0;
        } else {
            // Initialize if not exists
            likesSpan.textContent = 0;
        }
    }, (error) => {
        console.log("Project likes sync info: ", error);
    });

    button.addEventListener('click', async () => {
        try {
            const snap = await getDoc(projectRef);
            let currentLikes = 0;
            if (snap.exists()) {
                currentLikes = snap.data().likes || 0;
                await updateDoc(projectRef, { likes: currentLikes + 1 });
            } else {
                // Import setDoc dynamically if needed or handle creation
                import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(async ({ setDoc }) => {
                    await setDoc(projectRef, { likes: 1 });
                });
            }
            button.classList.add('liked');
        } catch (error) {
            console.error("Error updating project like: ", error);
        }
    });
});

// Firebase Comments Form Submission
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
                alert("Could not post comment. Check Firebase Firestore Rules.");
            }
        }
    });
}

// Real-time Comments & Likes Fetching from Firebase
try {
    const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        if (!commentsContainer) return;
        commentsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            commentsContainer.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No comments yet. Be the first to comment!</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const commentData = docSnap.data();
            const commentId = docSnap.id;
            
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card scroll-reveal active';
            
            const initial = commentData.name ? commentData.name.charAt(0).toUpperCase() : 'U';
            let dateStr = 'Just now';
            if (commentData.timestamp && commentData.timestamp.toDate) {
                dateStr = commentData.timestamp.toDate().toLocaleDateString();
            }

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
                    ${renderReplies(commentData.replies || [])}
                </div>
            `;
            commentsContainer.appendChild(commentCard);
        });
    }, (error) => {
        console.error("Firestore snapshot error: ", error);
        if(commentsContainer) {
            commentsContainer.innerHTML = '<p style="text-align:center; color:red;">Failed to load comments. Please check Firebase Firestore Rules.</p>';
        }
    });
} catch (err) {
    console.error("Comments initialization error: ", err);
}

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
    if (box) {
        box.style.display = box.style.display === 'none' ? 'flex' : 'none';
    }
};

window.submitReply = async function(commentId) {
    const nameInput = document.getElementById(`reply-name-${commentId}`);
    const msgInput = document.getElementById(`reply-msg-${commentId}`);
    if (!nameInput || !msgInput) return;
    
    const name = nameInput.value.trim();
    const message = msgInput.value.trim();

    if (name && message) {
        try {
            const commentRef = doc(db, "comments", commentId);
            const snap = await getDoc(commentRef);
            if (snap.exists()) {
                const data = snap.data();
                const replies = data.replies || [];
                replies.push({ 
                    name: name, 
                    message: message, 
                    date: new Date().toLocaleDateString() 
                });
                await updateDoc(commentRef, { replies });
                nameInput.value = '';
                msgInput.value = '';
                document.getElementById(`reply-box-${commentId}`).style.display = 'none';
            }
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
