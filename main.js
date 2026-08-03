import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    increment,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

// Global Video Modal Functions
window.openVideo = function(videoUrl) {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (modal && player) {
        player.src = videoUrl;
        modal.classList.add('active');
        player.play();
    }
};

window.closeVideo = function() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (modal && player) {
        player.pause();
        player.src = "";
        modal.classList.remove('active');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Footer Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 2. Mobile Menu Toggle
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // 3. Device ID Management
    let deviceId = localStorage.getItem('portfolio_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('portfolio_device_id', deviceId);
    }

    // 4. Projects Likes Initialization & Sync
    document.querySelectorAll(".project-like").forEach(async (button) => {
        const id = button.dataset.id;
        if (!id) return;
        const ref = doc(db, "projects", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, { likes: 0 });
        }
    });

    onSnapshot(collection(db, "projects"), (snapshot) => {
        snapshot.forEach(project => {
            const data = project.data();
            const likeSpan = document.querySelector(`[data-id="${project.id}"] .project-likes`);
            if (likeSpan) likeSpan.textContent = data.likes || 0;
        });
    });

    // 5. Comments Form Submission
    const commentsRef = collection(db, "comments");
    const commentForm = document.getElementById('commentForm');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentName = document.getElementById('commentName');
    const commentMessage = document.getElementById('commentMessage');

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!commentName.value.trim() || !commentMessage.value.trim()) return;

            try {
                await addDoc(commentsRef, {
                    deviceId: deviceId,
                    name: commentName.value.trim(),
                    message: commentMessage.value.trim(),
                    likes: 0,
                    likedBy: [],
                    replies: [],
                    createdAt: serverTimestamp()
                });
                commentForm.reset();
            } catch (error) {
                console.error("Error adding comment: ", error);
            }
        });
    }

    // 6. Render Comments Dynamically
    if (commentsContainer) {
        onSnapshot(query(commentsRef, orderBy("createdAt", "desc")), (snapshot) => {
            commentsContainer.innerHTML = "";
            if (snapshot.empty) {
                commentsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 14px;">No comments yet.</p>`;
                return;
            }

            snapshot.forEach(commentDoc => {
                const data = commentDoc.data();
                const id = commentDoc.id;
                const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";
                const isOwner = (data.deviceId === deviceId);
                const commentLikes = data.likes || 0;

                let repliesHTML = '';
                if (data.replies && data.replies.length > 0) {
                    repliesHTML = '<div class="replies-container">';
                    data.replies.forEach((reply, rIndex) => {
                        const replyLikes = reply.likes || 0;
                        repliesHTML += `
                            <div class="reply-card">
                                <div class="reply-header">
                                    <span><b>${escapeHTML(reply.name)}</b></span>
                                    <span>${reply.date || ""}</span>
                                </div>
                                <div class="reply-text">${escapeHTML(reply.message)}</div>
                                <div class="comment-actions">
                                    <button class="action-btn reply-like-btn" data-comment-id="${id}" data-reply-index="${rIndex}">
                                        ❤️ <span>${replyLikes}</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    repliesHTML += '</div>';
                }

                const card = document.createElement('div');
                card.className = 'comment-card';
                card.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-user-info">
                            <div class="avatar">${data.name.charAt(0).toUpperCase()}</div>
                            <div class="comment-info">
                                <h3>${escapeHTML(data.name)}</h3>
                                <span class="comment-date">${dateStr}</span>
                            </div>
                        </div>
                        <div class="comment-actions">
                            <button class="reply-btn" data-id="${id}">Reply</button>
                            ${isOwner ? `
                                <button class="edit-btn" data-id="${id}">Edit</button>
                                <button class="delete-btn" data-id="${id}">Delete</button>
                            ` : ''}
                        </div>
                    </div>
                    <p class="comment-text">${escapeHTML(data.message)}</p>
                    <div class="comment-actions">
                        <button class="action-btn comment-like-btn" data-id="${id}">
                            ❤️ <span>${commentLikes}</span>
                        </button>
                    </div>
                    <div id="reply-box-${id}"></div>
                    ${repliesHTML}
                `;
                commentsContainer.appendChild(card);
            });
        });
    }

    // 7. Global Event Delegation
    document.addEventListener('click', async (e) => {
        // Project Likes
        const likeBtn = e.target.closest('.project-like');
        if (likeBtn) {
            const projectId = likeBtn.dataset.id;
            if (!projectId) return;
            const storageKey = `liked_${projectId}`;
            if (localStorage.getItem(storageKey)) {
                alert("You already liked this project ❤️");
                return;
            }
            try {
                await updateDoc(doc(db, "projects", projectId), { likes: increment(1) });
                localStorage.setItem(storageKey, "true");
            } catch (err) { console.error(err); }
        }

        // Comment Like
        const cLikeBtn = e.target.closest('.comment-like-btn');
        if (cLikeBtn) {
            const commentId = cLikeBtn.dataset.id;
            const ref = doc(db, "comments", commentId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const commentData = snap.data();
                const likedBy = commentData.likedBy || [];
                if (likedBy.includes(deviceId)) {
                    alert("You already liked this comment ❤️");
                    return;
                }
                try {
                    await updateDoc(ref, {
                        likes: increment(1),
                        likedBy: [...likedBy, deviceId]
                    });
                } catch (err) { console.error(err); }
            }
        }

        // Reply Like
        const rLikeBtn = e.target.closest('.reply-like-btn');
        if (rLikeBtn) {
            const commentId = rLikeBtn.dataset.commentId;
            const rIndex = parseInt(rLikeBtn.dataset.replyIndex);
            const ref = doc(db, "comments", commentId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                let replies = data.replies || [];
                if (replies[rIndex]) {
                    // Check if already liked reply by this device
                    const rLikedBy = replies[rIndex].likedBy || [];
                    if (rLikedBy.includes(deviceId)) {
                        alert("You already liked this reply ❤️");
                        return;
                    }
                    replies[rIndex].likes = (replies[rIndex].likes || 0) + 1;
                    replies[rIndex].likedBy = [...rLikedBy, deviceId];
                    try {
                        await updateDoc(ref, { replies: replies });
                    } catch (err) { console.error(err); }
                }
            }
        }

        // Delete Comment
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const commentId = deleteBtn.dataset.id;
            if (confirm("متأكد إنك عايز تحذف الكومنت ده؟")) {
                try { await deleteDoc(doc(db, "comments", commentId)); } catch (err) { console.error(err); }
            }
        }

        // Edit Comment
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const commentId = editBtn.dataset.id;
            let newText = prompt("عدل تعليقك:");
            if (newText !== null && newText.trim() !== "") {
                try { await updateDoc(doc(db, "comments", commentId), { message: newText.trim() }); } catch (err) { console.error(err); }
            }
        }

        // Toggle YouTube-style Inline Reply Box
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            const commentId = replyBtn.dataset.id;
            const boxContainer = document.getElementById(`reply-box-${commentId}`);
            
            // If already open, close it
            if (boxContainer.innerHTML.trim() !== "") {
                boxContainer.innerHTML = "";
                return;
            }

            // Close any other open reply boxes
            document.querySelectorAll('[id^="reply-box-"]').forEach(el => el.innerHTML = "");

            boxContainer.innerHTML = `
                <div class="inline-reply-box">
                    <input type="text" id="replyName_${commentId}" placeholder="Your Name" required>
                    <textarea id="replyMsg_${commentId}" placeholder="Write a reply..." required></textarea>
                    <div class="reply-form-btns">
                        <button type="button" class="cancel-reply-btn" data-id="${commentId}">Cancel</button>
                        <button type="button" class="submit-reply-btn" data-id="${commentId}">Reply</button>
                    </div>
                </div>
            `;
        }

        // Cancel Reply
        const cancelBtn = e.target.closest('.cancel-reply-btn');
        if (cancelBtn) {
            const commentId = cancelBtn.dataset.id;
            document.getElementById(`reply-box-${commentId}`).innerHTML = "";
        }

        // Submit Reply
        const submitReplyBtn = e.target.closest('.submit-reply-btn');
        if (submitReplyBtn) {
            const commentId = submitReplyBtn.dataset.id;
            const nameInput = document.getElementById(`replyName_${commentId}`);
            const msgInput = document.getElementById(`replyMsg_${commentId}`);

            if (!nameInput.value.trim() || !msgInput.value.trim()) {
                alert("من فضلك اكتب الاسم والرد!");
                return;
            }

            const ref = doc(db, "comments", commentId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const currentReplies = snap.data().replies || [];
                const newReply = {
                    name: nameInput.value.trim(),
                    message: msgInput.value.trim(),
                    date: new Date().toLocaleDateString(),
                    likes: 0,
                    likedBy: []
                };

                try {
                    await updateDoc(ref, {
                        replies: [...currentReplies, newReply]
                    });
                    document.getElementById(`reply-box-${commentId}`).innerHTML = "";
                } else {
                    // fallback
                } catch (err) {
                    console.error("Error adding reply:", err);
                }
            }
        }
    });
});

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}
