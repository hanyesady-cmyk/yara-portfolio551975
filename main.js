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
    onSnapshot,
    arrayUnion
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

// Global Video Modal Functions (Linked directly to HTML inline onclick)
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
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Mobile Menu Toggle
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
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
            if (likeSpan) {
                likeSpan.textContent = data.likes || 0;
            }
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
                
                const commentDeviceId = data.deviceId || deviceId;
                const isOwner = (commentDeviceId === deviceId);

                let repliesHTML = '';
                if (data.replies && data.replies.length > 0) {
                    repliesHTML = '<div class="replies-container">';
                    data.replies.forEach(reply => {
                        repliesHTML += `
                            <div class="reply-card">
                                <div class="reply-header">
                                    <span><b>${escapeHTML(reply.name)}</b></span>
                                    <span>${reply.date || ""}</span>
                                </div>
                                <div class="reply-text">${escapeHTML(reply.message)}</div>
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
                    ${repliesHTML}
                `;
                commentsContainer.appendChild(card);
            });
        });
    }

    // 7. Global Event Delegation (Likes, Delete, Edit, Reply)
    document.addEventListener('click', async (e) => {
        // Likes Click
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
                await updateDoc(doc(db, "projects", projectId), { 
                    likes: increment(1) 
                });
                localStorage.setItem(storageKey, "true");
            } catch (error) {
                console.error("Error adding like:", error);
            }
        }

        // Delete Comment
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const commentId = deleteBtn.dataset.id;
            if (confirm("متأكد إنك عايز تحذف الكومنت ده؟")) {
                try {
                    await deleteDoc(doc(db, "comments", commentId));
                } catch (error) {
                    console.error("Error deleting comment:", error);
                }
            }
        }

        // Edit Comment
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const commentId = editBtn.dataset.id;
            let newText = prompt("عدل تعليقك:");
            if (newText !== null && newText.trim() !== "") {
                try {
                    await updateDoc(doc(db, "comments", commentId), { 
                        message: newText.trim() 
                    });
                } catch (error) {
                    console.error("Error updating comment:", error);
                }
            }
        }

        // Reply to Comment
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            const commentId = replyBtn.dataset.id;
            let replyName = prompt("اسمك للرد:");
            if (!replyName || !replyName.trim()) return;

            let replyMsg = prompt("الرد بتاعك:");
            if (!replyMsg || !replyMsg.trim()) return;

            try {
                await updateDoc(doc(db, "comments", commentId), {
                    replies: arrayUnion({
                        name: replyName.trim(),
                        message: replyMsg.trim(),
                        date: new Date().toLocaleDateString()
                    })
                });
            } catch (error) {
                console.error("Error adding reply:", error);
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
