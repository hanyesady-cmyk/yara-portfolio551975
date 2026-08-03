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

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. MOBILE MENU TOGGLE
    // ==========================================
    const menuBtn = document.getElementById('menuBtn');
    const navUl = document.querySelector('nav ul');

    if (menuBtn && navUl) {
        menuBtn.addEventListener('click', () => {
            navUl.classList.toggle('active');
            menuBtn.classList.toggle('fa-xmark');
        });

        navUl.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                navUl.classList.remove('active');
                if (menuBtn) menuBtn.classList.remove('fa-xmark');
            });
        });
    }

    // ==========================================
    // 2. SCROLL ACTIVE LINK
    // ==========================================
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav ul li a");

    window.addEventListener("scroll", () => {
        let current = "";
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= sectionTop - 60) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").substring(1) === current) {
                link.classList.add("active");
            }
        });
    });

    // ==========================================
    // 3. PROJECT LIKES & FIREBASE SYNC
    // ==========================================
    async function initializeProjects() {
        document.querySelectorAll(".project-like").forEach(async (button) => {
            const id = button.dataset.id;
            if(!id) return;
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

    // ==========================================
    // 4. COMMENTS SYSTEM (Firebase + Edit/Delete Same Device)
    // ==========================================
    let deviceId = localStorage.getItem('portfolio_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('portfolio_device_id', deviceId);
    }

    const commentsRef = collection(db, "comments");
    const commentForm = document.getElementById('commentForm');
    const commentsContainer = document.getElementById('commentsContainer');
    const commentName = document.getElementById('commentName');
    const commentMessage = document.getElementById('commentMessage');

    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!commentName || !commentMessage) return;
            if (commentName.value.trim() === "" || commentMessage.value.trim() === "") return;

            try {
                await addDoc(commentsRef, {
                    deviceId: deviceId,
                    name: commentName.value.trim(),
                    message: commentMessage.value.trim(),
                    likes: 0,
                    createdAt: serverTimestamp()
                });
                commentForm.reset();
            } catch (error) {
                console.error("Error adding comment: ", error);
            }
        });
    }

    if (commentsContainer) {
        onSnapshot(query(commentsRef, orderBy("createdAt", "desc")), (snapshot) => {
            commentsContainer.innerHTML = "";
            
            if (snapshot.empty) {
                commentsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 14px;">No comments yet. Be the first to comment!</p>`;
                return;
            }

            snapshot.forEach(commentDoc => {
                const data = commentDoc.data();
                const id = commentDoc.id;
                const dateStr = data.createdAt ? data.createdAt.toDate().toLocaleString() : "Just now";
                const isOwner = (data.deviceId === deviceId);

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
                        ${isOwner ? `
                        <div class="comment-owner-actions">
                            <button class="edit-btn" onclick="editComment('${id}', '${data.deviceId}')">Edit</button>
                            <button class="delete-btn" onclick="deleteComment('${id}', '${data.deviceId}')">Delete</button>
                        </div>` : ''}
                    </div>
                    <p class="comment-text">${escapeHTML(data.message)}</p>
                `;
                commentsContainer.appendChild(card);
            });
        });
    }
});

// ==========================================
// 5. GLOBAL FUNCTIONS FOR EDIT & DELETE
// ==========================================
window.deleteComment = async function(commentId, commentDeviceId) {
    let currentDeviceId = localStorage.getItem('portfolio_device_id');
    if (commentDeviceId !== currentDeviceId) {
        alert("You can only delete your own comments!");
        return;
    }

    if (confirm("Are you sure you want to delete this comment?")) {
        try {
            await deleteDoc(doc(db, "comments", commentId));
        } catch (error) {
            console.error("Error deleting comment: ", error);
        }
    }
};

window.editComment = async function(commentId, commentDeviceId) {
    let currentDeviceId = localStorage.getItem('portfolio_device_id');
    if (commentDeviceId !== currentDeviceId) {
        alert("You can only edit your own comments!");
        return;
    }

    let newText = prompt("Edit your comment:");
    if (newText !== null) {
        let trimmedText = newText.trim();
        if (trimmedText !== "") {
            try {
                await updateDoc(doc(db, "comments", commentId), {
                    message: trimmedText
                });
            } catch (error) {
                console.error("Error updating comment: ", error);
            }
        } else {
            alert("Comment cannot be empty!");
        }
    }
};

// Helper to prevent XSS
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
