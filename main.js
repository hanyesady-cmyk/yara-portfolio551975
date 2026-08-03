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

// Firebase Config
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

// User Local ID Identifier
function getUserId() {
    let uid = localStorage.getItem("portfolio_user_id");
    if (!uid) {
        uid = "user_" + Math.random().toString(36).substring(2, 9);
        localStorage.setItem("portfolio_user_id", uid);
    }
    return uid;
}

const currentUserId = getUserId();

// ================= NAVBAR =================
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

document.querySelectorAll("#navLinks a").forEach(link => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
    });
});

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
    player.src = src;
    modal.classList.add("active");
    player.play();
};

window.closeVideo = () => {
    player.pause();
    player.currentTime = 0;
    player.src = "";
    modal.classList.remove("active");
};

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeVideo();
});

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

// ================= COMMENTS & REPLIES SYSTEM =================
const commentsRef = collection(db, "comments");
const commentsContainer = document.getElementById("commentsContainer");
const commentForm = document.getElementById("commentForm");
const commentName = document.getElementById("commentName");
const commentMessage = document.getElementById("commentMessage");

commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (commentName.value.trim() === "" || commentMessage.value.trim() === "") return;

    await addDoc(commentsRef, {
        name: commentName.value.trim(),
        message: commentMessage.value.trim(),
        likes: 0,
        userId: currentUserId,
        createdAt: serverTimestamp()
    });

    commentForm.reset();
});

onSnapshot(query(commentsRef, orderBy("createdAt", "desc")), (snapshot) => {
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
    
    // التحقق المباشر من أن الـ userId الخاص بالتعليق يطابق معرف هذا الجهاز
    const isOwner = data.userId === currentUserId;

    card.innerHTML = `
        <div class="comment-header">
            <div class="avatar">${data.name.charAt(0).toUpperCase()}</div>
            <div class="comment-info">
                <h3>${escapeHTML(data.name)}</h3>
                <span class="comment-date">${dateStr}</span>
            </div>
        </div>
        <p class="comment-text" id="comment-text-${id}">${escapeHTML(data.message)}</p>
        
        <div class="comment-actions">
            <button class="like-comment-btn" data-id="${id}">
                ❤️ <span class="comment-likes">${data.likes || 0}</span> Likes
            </button>
            <button class="reply-toggle-btn" data-id="${id}">
                💬 Reply
            </button>
            ${isOwner ? `
                <button class="edit-comment-btn" data-id="${id}">✏️ Edit</button>
                <button class="delete-comment-btn" data-id="${id}">🗑️ Delete</button>
            ` : ""}
        </div>

        <div class="edit-box" id="editBox-${id}" style="display: none; margin-top: 10px;">
            <textarea id="editMsg-${id}" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); color:#fff; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">${data.message}</textarea>
            <button class="saveEdit-btn" data-id="${id}" style="margin-top:5px; padding:6px 14px; background:var(--bs-purple); color:#fff; border:none; border-radius:6px; cursor:pointer;">Save</button>
        </div>

        <div class="reply-box" id="replyBox-${id}" style="display: none;">
            <input type="text" id="replyName-${id}" placeholder="Your Name" required>
            <textarea id="replyMsg-${id}" placeholder="Write a reply..." required></textarea>
            <button class="sendReply" data-id="${id}">Post Reply</button>
        </div>
        <div class="replies" id="repliesContainer-${id}"></div>
    `;

    commentsContainer.appendChild(card);
    setupCommentEvents(id);
    loadReplies(id);
}

function setupCommentEvents(commentId) {
    const card = document.querySelector(`[data-id="${commentId}"]`)?.closest('.comment-card');
    if (!card) return;

    card.querySelector('.like-comment-btn').addEventListener('click', async () => {
        const likeKey = `liked_comment_${commentId}_${currentUserId}`;
        if (localStorage.getItem(likeKey)) {
            alert("You already liked this comment ❤️");
            return;
        }
        await updateDoc(doc(db, "comments", commentId), { likes: increment(1) });
        localStorage.setItem(likeKey, "true");
    });

    card.querySelector('.reply-toggle-btn').addEventListener('click', () => {
        const replyBox = document.getElementById(`replyBox-${commentId}`);
        replyBox.style.display = replyBox.style.display === "none" ? "flex" : "none";
    });

    const deleteBtn = card.querySelector('.delete-comment-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (confirm("Are you sure you want to delete this comment?")) {
                await deleteDoc(doc(db, "comments", commentId));
            }
        });
    }

    const editBtn = card.querySelector('.edit-comment-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const editBox = document.getElementById(`editBox-${commentId}`);
            editBox.style.display = editBox.style.display === "none" ? "block" : "none";
        });
    }

    const saveEditBtn = card.querySelector('.saveEdit-btn');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', async () => {
            const newText = document.getElementById(`editMsg-${commentId}`).value.trim();
            if (!newText) return;
            await updateDoc(doc(db, "comments", commentId), { message: newText });
            document.getElementById(`editBox-${commentId}`).style.display = "none";
        });
    }

    card.querySelector('.sendReply').addEventListener('click', async () => {
        const nameInput = document.getElementById(`replyName-${commentId}`);
        const msgInput = document.getElementById(`replyMsg-${commentId}`);

        if (!nameInput.value.trim() || !msgInput.value.trim()) return;

        const repliesRef = collection(db, "comments", commentId, "replies");
        await addDoc(repliesRef, {
            name: nameInput.value.trim(),
            message: msgInput.value.trim(),
            likes: 0,
            userId: currentUserId,
            createdAt: serverTimestamp()
        });

        nameInput.value = "";
        msgInput.value = "";
        document.getElementById(`replyBox-${commentId}`).style.display = "none";
    });
}

function loadReplies(commentId) {
    const repliesRef = collection(db, "comments", commentId, "replies");
    const repliesContainer = document.getElementById(`repliesContainer-${commentId}`);

    onSnapshot(query(repliesRef, orderBy("createdAt", "asc")), (snapshot) => {
        repliesContainer.innerHTML = "";
        snapshot.forEach(replyDoc => {
            const rData = replyDoc.data();
            const rId = replyDoc.id;
            
            // التحقق المباشر من أن الرد يتبع لنفس الجهاز الحالي
            const isReplyOwner = rData.userId === currentUserId;

            const replyDiv = document.createElement("div");
            replyDiv.className = "reply";
            replyDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <strong style="color:#fff; font-size:13px;">${escapeHTML(rData.name)}</strong>
                    <span style="font-size:11px; color:var(--text-muted);">${rData.createdAt ? rData.createdAt.toDate().toLocaleTimeString() : ""}</span>
                </div>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:8px;" id="reply-text-${rId}">${escapeHTML(rData.message)}</p>
                
                <div class="edit-reply-box" id="editReplyBox-${rId}" style="display:none; margin-bottom:8px;">
                    <input type="text" id="editReplyInput-${rId}" value="${rData.message}" style="width:100%; padding:6px; background:rgba(0,0,0,0.4); color:#fff; border-radius:6px; border:1px solid rgba(255,255,255,0.1); font-size:12px;">
                    <button class="saveReplyEdit" data-cid="${commentId}" data-rid="${rId}" style="margin-top:4px; padding:4px 10px; background:var(--bs-purple); color:#fff; border:none; border-radius:4px; font-size:11px; cursor:pointer;">Save</button>
                </div>

                <div style="display:flex; gap:12px; align-items:center;">
                    <button class="like-reply-btn" data-cid="${commentId}" data-rid="${rId}" style="background:none; border:none; color:var(--bs-cyan); cursor:pointer; font-size:12px;">
                        ❤️ <span class="reply-likes">${rData.likes || 0}</span>
                    </button>
                    ${isReplyOwner ? `
                        <button class="edit-reply-btn" data-rid="${rId}" style="background:none; border:none; color:#f0ad4e; cursor:pointer; font-size:12px;">Edit</button>
                        <button class="delete-reply-btn" data-cid="${commentId}" data-rid="${rId}" style="background:none; border:none; color:#d9534f; cursor:pointer; font-size:12px;">Delete</button>
                    ` : ""}
                </div>
            `;

            repliesContainer.appendChild(replyDiv);
        });

        setupReplyEvents(commentId);
    });
}

function setupReplyEvents(commentId) {
    const container = document.getElementById(`repliesContainer-${commentId}`);
    if (!container) return;

    container.querySelectorAll('.like-reply-btn').forEach(btn => {
        btn.onclick = async () => {
            const rId = btn.dataset.rid;
            const likeKey = `liked_reply_${rId}_${currentUserId}`;
            if (localStorage.getItem(likeKey)) {
                alert("You already liked this reply ❤️");
                return;
            }
            const replyRef = doc(db, "comments", commentId, "replies", rId);
            await updateDoc(replyRef, { likes: increment(1) });
            localStorage.setItem(likeKey, "true");
        };
    });

    container.querySelectorAll('.delete-reply-btn').forEach(btn => {
        btn.onclick = async () => {
            const rId = btn.dataset.rid;
            if (confirm("Delete this reply?")) {
                await deleteDoc(doc(db, "comments", commentId, "replies", rId));
            }
        };
    });

    container.querySelectorAll('.edit-reply-btn').forEach(btn => {
        btn.onclick = () => {
            const rId = btn.dataset.rid;
            const editBox = document.getElementById(`editReplyBox-${rId}`);
            editBox.style.display = editBox.style.display === "none" ? "block" : "none";
        };
    });

    container.querySelectorAll('.saveReplyEdit').forEach(btn => {
        btn.onclick = async () => {
            const rId = btn.dataset.rid;
            const newMsg = document.getElementById(`editReplyInput-${rId}`).value.trim();
            if (!newMsg) return;
            const replyRef = doc(db, "comments", commentId, "replies", rId);
            await updateDoc(replyRef, { message: newMsg });
            document.getElementById(`editReplyBox-${rId}`).style.display = "none";
        };
    });
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
