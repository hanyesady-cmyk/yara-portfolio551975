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

// Firebase Config الخاصة بمشروعك
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

// ================= USER IDENTIFIER (لضمان تعديل وحذف تعليقك فقط) =================
let currentUserId = localStorage.getItem('portfolio_user_id');
if (!currentUserId) {
    currentUserId = 'user_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('portfolio_user_id', currentUserId);
}

// ================= NAVBAR =================
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    document.querySelectorAll("#navLinks a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
        });
    });
}

// ================= ACTIVE LINK ON SCROLL =================
const sections = document.querySelectorAll("section");
const navItems = document.querySelectorAll("nav ul li a");

window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
        const top = section.offsetTop - 150;
        const height = section.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
            current = section.id;
        }
    });

    navItems.forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("href") === "#" + current) {
            item.classList.add("active");
        }
    });
});

// ================= SCROLL REVEAL ANIMATION =================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll(".scroll-reveal").forEach(item => observer.observe(item));

// ================= VIDEO MODAL =================
const modal = document.getElementById("videoModal");
const player = document.getElementById("videoPlayer");

window.openVideo = (src) => {
    if (!player || !modal) return;
    player.src = src;
    modal.classList.add("active");
    player.play();
};

window.closeVideo = () => {
    if (!player || !modal) return;
    player.pause();
    player.currentTime = 0;
    player.src = "";
    modal.classList.remove("active");
};

if (modal) {
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeVideo();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeVideo();
});

// ================= PROJECT LIKES =================
async function initializeProjects() {
    document.querySelectorAll(".project-like").forEach(async (button) => {
        const id = button.dataset.id;
        const ref = doc(db, "projects", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
            await setDoc(ref, { likes: 0 });
        }
    });
}
initializeProjects();

onSnapshot(collection(db, "projects"), (snapshot) => {
    snapshot.forEach(project => {
        const data = project.data();
        const likeSpan = document.querySelector(`[data-id="${project.id}"] .project-likes`);
        if (likeSpan) {
            likeSpan.textContent = data.likes || 0;
        }
    });
});

document.querySelectorAll(".project-like").forEach(button => {
    button.addEventListener("click", async () => {
        const id = button.dataset.id;
        const storageKey = "liked_" + id;
        if (localStorage.getItem(storageKey)) {
            alert("You already liked this project ❤️");
            return;
        }
        await updateDoc(doc(db, "projects", id), { likes: increment(1) });
        localStorage.setItem(storageKey, "true");
    });
});

// ================= COMMENTS SYSTEM =================
const commentsRef = collection(db, "comments");
const commentsContainer = document.getElementById("commentsContainer");
const commentForm = document.getElementById("commentForm");
const commentName = document.getElementById("commentName");
const commentMessage = document.getElementById("commentMessage");

if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!commentName || !commentMessage) return;
        if (commentName.value.trim() === "" || commentMessage.value.trim() === "") return;

        await addDoc(commentsRef, {
            userId: currentUserId, // ربط التعليق بمالكه
            name: commentName.value.trim(),
            message: commentMessage.value.trim(),
            likes: 0,
            createdAt: serverTimestamp()
        });

        commentForm.reset();
    });
}

onSnapshot(query(commentsRef, orderBy("createdAt", "desc")), (snapshot) => {
    if (!commentsContainer) return;
    commentsContainer.innerHTML = "";
    snapshot.forEach(commentDoc => {
        createCommentUI(commentDoc);
    });
});

function createCommentUI(commentDoc) {
    const data = commentDoc.data();
    const id = commentDoc.id;
    const card = document.createElement("div");
    card.className = "comment-card scroll-reveal show";

    const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";
    const isOwner = data.userId === currentUserId;

    card.innerHTML = `
        <div class="comment-header">
            <div class="comment-user-info">
                <div class="avatar">${data.name.charAt(0).toUpperCase()}</div>
                <div class="comment-info">
                    <h3>${escapeHTML(data.name)}</h3>
                    <span class="comment-date">${dateStr}</span>
                </div>
            </div>
            ${isOwner ? `
            <div class="comment-owner-actions">
                <button class="edit-comment-btn" onclick="updateComment('${id}', '${data.userId}')">تعديل</button>
                <button class="delete-comment-btn" onclick="deleteComment('${id}', '${data.userId}')">حذف</button>
            </div>` : ''}
        </div>
        <p class="comment-text">${escapeHTML(data.message)}</p>
        <div class="comment-actions">
            <button class="comment-like" data-id="${id}">
                <i class="fa-solid fa-heart"></i> <span>${data.likes || 0}</span>
            </button>
            <button class="reply-btn" data-id="${id}">
                <i class="fa-solid fa-reply"></i> Reply
            </button>
        </div>
        <div class="reply-box" id="reply-box-${id}" style="display:none;">
            <input type="text" placeholder="Your Name" class="reply-name">
            <textarea placeholder="Write a reply..." class="reply-message"></textarea>
            <button class="sendReply" data-id="${id}">Send Reply</button>
        </div>
        <div class="replies" id="replies-${id}"></div>
    `;

    commentsContainer.appendChild(card);
    loadReplies(id);
}

// ================= UPDATE & DELETE COMMENT FUNCTIONS =================
window.deleteComment = async function(commentId, commentUserId) {
    if (commentUserId !== currentUserId) {
        alert("عذراً، لا يمكنك حذف تعليق شخص آخر!");
        return;
    }

    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        try {
            await deleteDoc(doc(db, "comments", commentId));
        } catch (error) {
            console.error("Error deleting comment: ", error);
            alert("حدث خطأ أثناء الحذف.");
        }
    }
};

window.updateComment = async function(commentId, commentUserId) {
    if (commentUserId !== currentUserId) {
        alert("عذراً، لا يمكنك تعديل تعليق شخص آخر!");
        return;
    }

    let newText = prompt("قم بتعديل تعليقك:");
    if (newText !== null) {
        let trimmedText = newText.trim();
        if (trimmedText !== "") {
            try {
                await updateDoc(doc(db, "comments", commentId), {
                    message: trimmedText
                });
            } catch (error) {
                console.error("Error updating comment: ", error);
                alert("حدث خطأ أثناء التعديل.");
            }
        } else {
            alert("لا يمكن أن يكون التعليق فارغاً!");
        }
    }
};

// ================= REPLIES SYSTEM =================
function loadReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    if (!repliesContainer) return;
    const repliesRef = collection(db, "comments", commentId, "replies");

    onSnapshot(query(repliesRef, orderBy("createdAt", "asc")), (snapshot) => {
        repliesContainer.innerHTML = "";
        snapshot.forEach(replyDoc => {
            const data = replyDoc.data();
            const id = replyDoc.id;
            const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";

            const replyEl = document.createElement("div");
            replyEl.className = "reply";
            replyEl.innerHTML = `
                <div class="comment-header">
                    <div class="avatar">${data.name.charAt(0).toUpperCase()}</div>
                    <div class="comment-info">
                        <h3>${escapeHTML(data.name)}</h3>
                        <span class="comment-date">${dateStr}</span>
                    </div>
                </div>
                <p class="comment-text">${escapeHTML(data.message)}</p>
                <div class="comment-actions">
                    <button class="reply-like" data-comment="${commentId}" data-reply="${id}">
                        <i class="fa-solid fa-heart"></i> <span>${data.likes || 0}</span>
                    </button>
                </div>
            `;
            repliesContainer.appendChild(replyEl);
        });
    });
}

// Global Event Delegation for Dynamic Elements (Likes & Replies)
document.addEventListener("click", async (e) => {
    // Like Comment
    const commentLikeBtn = e.target.closest(".comment-like");
    if (commentLikeBtn) {
        const id = commentLikeBtn.dataset.id;
        const key = "commentLike_" + id;
        if (localStorage.getItem(key)) {
            alert("Already liked ❤️");
            return;
        }
        await updateDoc(doc(db, "comments", id), { likes: increment(1) });
        localStorage.setItem(key, "true");
        return;
    }

    // Toggle Reply Box
    const replyToggleBtn = e.target.closest(".reply-btn");
    if (replyToggleBtn) {
        const id = replyToggleBtn.dataset.id;
        const box = document.getElementById(`reply-box-${id}`);
        if(box) {
            box.style.display = box.style.display === "none" ? "flex" : "none";
        }
        return;
    }

    // Send Reply
    const sendReplyBtn = e.target.closest(".sendReply");
    if (sendReplyBtn) {
        const commentId = sendReplyBtn.dataset.id;
        const nameInput = document.querySelector(`#reply-box-${commentId} .reply-name`);
        const messageInput = document.querySelector(`#reply-box-${commentId} .reply-message`);

        if (!nameInput || !messageInput) return;
        if (nameInput.value.trim() === "" || messageInput.value.trim() === "") return;

        await addDoc(collection(db, "comments", commentId, "replies"), {
            name: nameInput.value.trim(),
            message: messageInput.value.trim(),
            likes: 0,
            createdAt: serverTimestamp()
        });

        nameInput.value = "";
        messageInput.value = "";
        const replyBox = document.getElementById(`reply-box-${commentId}`);
        if(replyBox) replyBox.style.display = "none";
        return;
    }

    // Like Reply
    const replyLikeBtn = e.target.closest(".reply-like");
    if (replyLikeBtn) {
        const commentId = replyLikeBtn.dataset.comment;
        const replyId = replyLikeBtn.dataset.reply;
        const key = "replyLike_" + replyId;
        if (localStorage.getItem(key)) {
            alert("Already liked ❤️");
            return;
        }
        await updateDoc(doc(db, "comments", commentId, "replies", replyId), { likes: increment(1) });
        localStorage.setItem(key, "true");
        return;
    }
});

// Helper for Security (Prevent XSS)
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Dynamic Footer Year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
