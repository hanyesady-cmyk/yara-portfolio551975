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
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Mobile Menu Toggle
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');

if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuBtn.classList.toggle('fa-xmark');
    });
}

// Scroll Reveal Animation (Intersection Observer)
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
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
    if (modal && player) {
        player.src = videoSrc;
        modal.classList.add('active');
        player.play();
    }
};

window.closeVideo = function() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (modal && player) {
        player.pause();
        player.src = '';
        modal.classList.remove('active');
    }
};

// Project Likes Handling (Hybrid: LocalStorage for instant persistence + Firebase background sync)
const projectLikes = document.querySelectorAll('.project-like');
projectLikes.forEach((button, index) => {
    const projectId = button.getAttribute('data-id') || `project_${index}`;
    const likesSpan = button.querySelector('.project-likes');
    
    if (!likesSpan) return;

    // 1. استرجاع العدد والحالة من التخزين المحلي فوراً عشان يثبت وما يختفيش مع الـ Refresh
    const savedLikes = localStorage.getItem(`portfolio_likes_${projectId}`);
    const isLiked = localStorage.getItem(`portfolio_liked_${projectId}`);

    if (savedLikes !== null) {
        likesSpan.textContent = savedLikes;
    }
    
    if (isLiked === 'true') {
        button.classList.add('liked');
    }

    // 2. إدارة الضغط على اللايك ومنع التكرار العشوائي
    button.addEventListener('click', async () => {
        let currentLikes = parseInt(likesSpan.textContent) || 0;

        if (!button.classList.contains('liked')) {
            currentLikes++;
            button.classList.add('liked');
            localStorage.setItem(`portfolio_liked_${projectId}`, 'true');
        } else {
            currentLikes = Math.max(0, currentLikes - 1);
            button.classList.remove('liked');
            localStorage.removeItem(`portfolio_liked_${projectId}`);
        }

        // تحديث فورى على الشاشة وفي التخزين المحلي
        likesSpan.textContent = currentLikes;
        localStorage.setItem(`portfolio_likes_${projectId}`, currentLikes);

        // محاولة التحديث في الـ Firebase في الخلفية
        try {
            const projectRef = doc(db, "projects_likes", projectId);
            const snap = await getDoc(projectRef);
            if (snap.exists()) {
                await updateDoc(projectRef, { likes: currentLikes });
            } else {
                import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(async ({ setDoc }) => {
                    await setDoc(projectRef, { likes: currentLikes });
                });
            }
        } catch (e) {
            console.log("Firebase background sync note: saved locally.");
        }
    });
});

// Firebase Comments Form Submission
const commentForm = document.getElementById('commentForm');
const commentsContainer = document.getElementById('commentsContainer');

if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('commentName');
        const msgInput = document.getElementById('commentMessage');
        
        if (!nameInput || !msgInput) return;
        
        const name = nameInput.value.trim();
        const message = msgInput.value.trim();

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
                alert("Could not post comment. Please check Firebase Firestore Rules.");
            }
        }
    });
}

// Real-time Comments Fetching (Reads all comments without restrictive sorting)
try {
    const commentsRef = collection(db, "comments");
    onSnapshot(commentsRef, (snapshot) => {
        if (!commentsContainer) return;
        commentsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            commentsContainer.innerHTML = '<p style="text-align:center; color:#777; padding: 20px;">No comments yet. Be the first to comment!</p>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const commentData = docSnap.data();
            const commentId = docSnap.id;
            
            const commentCard = document.createElement('div');
            commentCard.className = 'comment-card scroll-reveal active';
            
            const initial = commentData.name ? commentData.name.charAt(0).toUpperCase() : 'U';
            let dateStr = 'Recent';
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
        <button class="reply-card" style="border:none; background:none; text-align:right; width:100%; cursor:default;">
            <div class="reply-header">
                <strong>${escapeHtml(r.name)}</strong>
                <span>${r.date || ''}</span>
            </div>
            <p class="reply-text">${escapeHtml(r.message)}</p>
        </button>
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
