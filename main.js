// Import Firebase SDK v10 (Modular / ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBzw31yi2dStayYCjJiCS8sTtIsQ3OHlY8",
    authDomain: "ga-for-windows-99879.firebaseapp.com",
    projectId: "ga-for-windows-99879",
    storageBucket: "ga-for-windows-99879.firebasestorage.app",
    messagingSenderId: "590172219222",
    appId: "1:590172219222:web:0202ac673e26a56c1a58f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Mobile Menu Toggle ---
    const menuBtn = document.getElementById("menuBtn");
    const navUl = document.querySelector("nav ul");

    if (menuBtn && navUl) {
        menuBtn.addEventListener("click", () => {
            navUl.classList.toggle("active");
            menuBtn.classList.toggle("fa-times");
        });

        document.querySelectorAll("nav ul li a").forEach(link => {
            link.addEventListener("click", () => {
                navUl.classList.remove("active");
                if (menuBtn) menuBtn.classList.remove("fa-times");
            });
        });
    }

    // --- 2. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll(".reveal-on-scroll");

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add("active");
            }
        });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    // --- 3. Video Modal Functionality ---
    const videoModal = document.getElementById("videoModal");
    const modalVideo = document.getElementById("modalVideo");
    const closeBtn = document.querySelector(".close-btn");

    document.querySelectorAll(".play-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".project-card");
            const videoSource = card.querySelector("source") ? card.querySelector("source").src : card.querySelector("video").src;
            
            if (videoModal && modalVideo) {
                modalVideo.src = videoSource;
                videoModal.classList.add("active");
                modalVideo.play();
            }
        });
    });

    const closeModal = () => {
        if (videoModal && modalVideo) {
            videoModal.classList.remove("active");
            modalVideo.pause();
            modalVideo.src = "";
        }
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (videoModal) {
        videoModal.addEventListener("click", (e) => {
            if (e.target === videoModal) closeModal();
        });
    }

    // --- 4. Original Project Likes (Local Storage) ---
    document.querySelectorAll(".project-card").forEach((card, index) => {
        const likeBtn = card.querySelector(".project-like");
        if (!likeBtn) return;

        const span = likeBtn.querySelector("span");
        const icon = likeBtn.querySelector("i");
        const storageKey = `project_likes_${index}`;
        const likedKey = `project_liked_${index}`;

        // Load saved likes from localStorage
        const savedLikes = localStorage.getItem(storageKey);
        const isLiked = localStorage.getItem(likedKey) === "true";

        if (savedLikes !== null) {
            span.textContent = `${savedLikes} Likes`;
        }
        
        if (isLiked) {
            likeBtn.classList.add("liked");
            if (icon) icon.className = "fa-solid fa-heart";
        }

        likeBtn.addEventListener("click", () => {
            let currentLikes = parseInt(span.textContent) || 0;
            
            if (likeBtn.classList.contains("liked")) {
                likeBtn.classList.remove("liked");
                if (icon) icon.className = "fa-regular fa-heart";
                currentLikes = Math.max(0, currentLikes - 1);
                localStorage.setItem(likedKey, "false");
            } else {
                likeBtn.classList.add("liked");
                if (icon) icon.className = "fa-solid fa-heart";
                currentLikes += 1;
                localStorage.setItem(likedKey, "true");
            }

            span.textContent = `${currentLikes} Likes`;
            localStorage.setItem(storageKey, currentLikes);
        });
    });

    // --- 5. Firebase Real-time Comments & Replies System ---
    const commentForm = document.getElementById("commentForm");
    const commentsContainer = document.getElementById("commentsContainer");

    if (commentForm && commentsContainer) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById("commentName");
            const textInput = document.getElementById("commentText");

            if (!nameInput || !textInput) return;

            const name = nameInput.value.trim();
            const text = textInput.value.trim();

            if (name === "" || text === "") return;

            try {
                await addDoc(collection(db, "comments"), {
                    name: name,
                    text: text,
                    likes: 0,
                    createdAt: serverTimestamp()
                });
                nameInput.value = "";
                textInput.value = "";
            } catch (error) {
                console.error("Error adding comment: ", error);
            }
        });

        const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
        
        onSnapshot(q, (snapshot) => {
            commentsContainer.innerHTML = "";
            
            if (snapshot.empty) {
                commentsContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size: 14px;">No comments yet. Be the first to comment!</p>`;
                return;
            }

            snapshot.forEach((docSnap) => {
                const commentData = docSnap.data();
                const commentId = docSnap.id;
                
                const commentCard = document.createElement("div");
                commentCard.classList.add("comment-card");
                commentCard.setAttribute("data-id", commentId);
                
                commentCard.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-user-info">
                            <div class="avatar">${commentData.name ? commentData.name.charAt(0).toUpperCase() : 'U'}</div>
                            <div class="comment-info">
                                <h3>${escapeHtml(commentData.name)}</h3>
                                <span class="comment-date">Just now</span>
                            </div>
                        </div>
                    </div>
                    <p class="comment-text">${escapeHtml(commentData.text)}</p>
                    <div class="comment-actions">
                        <button class="comment-like-btn"><i class="fa-regular fa-heart"></i> <span>${commentData.likes || 0}</span></button>
                        <button class="reply-btn"><i class="fa-solid fa-reply"></i> Reply</button>
                        <button class="edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                        <button class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                    </div>
                    <div class="replies-container"></div>
                `;

                commentsContainer.appendChild(commentCard);
                attachFirestoreCommentEvents(commentCard, commentId);
                loadReplies(commentId, commentCard.querySelector(".replies-container"));
            });
        });
    }

    function attachFirestoreCommentEvents(commentCard, commentId) {
        const commentRef = doc(db, "comments", commentId);

        const likeBtn = commentCard.querySelector(".comment-like-btn");
        likeBtn.addEventListener("click", async () => {
            const isLiked = likeBtn.classList.toggle("liked");
            const icon = likeBtn.querySelector("i");
            const span = likeBtn.querySelector("span");
            
            let currentLikes = parseInt(span.textContent) || 0;
            let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            span.textContent = newLikes;

            icon.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";

            try {
                await updateDoc(commentRef, { likes: newLikes });
            } catch (err) {
                console.error("Error updating likes:", err);
            }
        });

        const deleteBtn = commentCard.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to delete this comment?")) {
                try {
                    await deleteDoc(commentRef);
                } catch (err) {
                    console.error("Error deleting comment:", err);
                }
            }
        });

        const editBtn = commentCard.querySelector(".edit-btn");
        const commentTextEl = commentCard.querySelector(".comment-text");
        editBtn.addEventListener("click", () => {
            if (commentCard.querySelector(".inline-edit-box")) return;

            const editBox = document.createElement("div");
            editBox.classList.add("inline-edit-box");
            editBox.innerHTML = `
                <textarea>${commentTextEl.textContent}</textarea>
                <div style="display: flex; gap: 8px;">
                    <button class="submit-btn-action save-edit">Save</button>
                    <button class="cancel-btn cancel-edit">Cancel</button>
                </div>
            `;
            commentCard.appendChild(editBox);

            editBox.querySelector(".save-edit").addEventListener("click", async () => {
                const newText = editBox.querySelector("textarea").value.trim();
                if (newText !== "") {
                    try {
                        await updateDoc(commentRef, { text: newText });
                        commentTextEl.textContent = newText;
                    } catch (err) {
                        console.error("Error updating text:", err);
                    }
                }
                editBox.remove();
            });

            editBox.querySelector(".cancel-edit").addEventListener("click", () => {
                editBox.remove();
            });
        });

        const replyBtn = commentCard.querySelector(".reply-btn");
        replyBtn.addEventListener("click", () => {
            if (commentCard.querySelector(".inline-reply-box")) return;

            const replyBox = document.createElement("div");
            replyBox.classList.add("inline-reply-box");
            replyBox.innerHTML = `
                <input type="text" placeholder="Your name..." class="reply-name-input">
                <textarea placeholder="Write your reply here..."></textarea>
                <div style="display: flex; gap: 8px;">
                    <button class="submit-btn-action send-reply">Send Reply</button>
                    <button class="cancel-btn cancel-reply">Cancel</button>
                </div>
            `;
            commentCard.appendChild(replyBox);

            replyBox.querySelector(".send-reply").addEventListener("click", async () => {
                const rName = replyBox.querySelector(".reply-name-input").value.trim();
                const rText = replyBox.querySelector("textarea").value.trim();

                if (rName !== "" && rText !== "") {
                    try {
                        await addDoc(collection(db, `comments/${commentId}/replies`), {
                            name: rName,
                            text: rText,
                            createdAt: serverTimestamp()
                        });
                        replyBox.remove();
                    } catch (err) {
                        console.error("Error adding reply:", err);
                    }
                }
            });

            replyBox.querySelector(".cancel-reply").addEventListener("click", () => {
                replyBox.remove();
            });
        });
    }

    function loadReplies(commentId, repliesContainer) {
        const repliesQuery = query(collection(db, `comments/${commentId}/replies`), orderBy("createdAt", "asc"));
        
        onSnapshot(repliesQuery, (snapshot) => {
            repliesContainer.innerHTML = "";
            snapshot.forEach((replySnap) => {
                const replyData = replySnap.data();
                
                const replyCard = document.createElement("div");
                replyCard.classList.add("reply-card");
                replyCard.innerHTML = `
                    <div class="reply-header">
                        <span><strong>${escapeHtml(replyData.name)}</strong></span>
                        <span>Just now</span>
                    </div>
                    <p class="reply-text">${escapeHtml(replyData.text)}</p>
                `;
                repliesContainer.appendChild(replyCard);
            });
        });
    }

    function escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
