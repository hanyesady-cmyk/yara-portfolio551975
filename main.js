// Import Firebase SDK v10 (Modular / ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    getDoc,
    setDoc,
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

    // --- 4. Projects Real-time Likes from Firebase ---
    document.querySelectorAll(".project-card").forEach((card, index) => {
        const projectId = `project_${index + 1}`;
        const likeBtn = card.querySelector(".project-like");
        if (!likeBtn) return;

        const span = likeBtn.querySelector("span");
        const icon = likeBtn.querySelector("i");
        const projectRef = doc(db, "projects_likes", projectId);

        // Fetch initial likes
        getDoc(projectRef).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                span.textContent = `${data.likes || 0} Likes`;
            }
        });

        likeBtn.addEventListener("click", async () => {
            const isLiked = likeBtn.classList.toggle("liked");
            let currentLikes = parseInt(span.textContent) || 0;
            let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            
            span.textContent = `${newLikes} Likes`;
            icon.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";

            try {
                await setDoc(projectRef, { likes: newLikes }, { merge: true });
            } catch (err) {
                console.error("Error updating project like:", err);
            }
        });
    });

    // --- Helper: Time Ago Formatter ---
    function formatTimeAgo(timestamp) {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    }

    // --- 5. Firebase Real-time Comments & Replies System ---
    const commentForm = document.getElementById("commentForm");
    const commentsContainer = document.getElementById("commentsContainer");

    function getCurrentUser() {
        return localStorage.getItem("portfolio_user") || "";
    }

    if (commentForm && commentsContainer) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById("commentName");
            const textInput = document.getElementById("commentText");

            if (!nameInput || !textInput) return;

            const name = nameInput.value.trim();
            const text = textInput.value.trim();

            if (name === "" || text === "") return;

            localStorage.setItem("portfolio_user", name);

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
                alert("Error sending comment.");
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
                
                const commentBody = commentData.text || commentData.commentText || commentData.message || "";
                const authorName = commentData.name || commentData.userName || "Anonymous";
                const currentUser = getCurrentUser();

                // Strict Ownership Verification
                const isOwner = currentUser && authorName.trim().toLowerCase() === currentUser.trim().toLowerCase();
                const timeAgo = formatTimeAgo(commentData.createdAt);

                const commentCard = document.createElement("div");
                commentCard.classList.add("comment-card");
                commentCard.setAttribute("data-id", commentId);
                
                commentCard.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-user-info">
                            <div class="avatar">${authorName.charAt(0).toUpperCase()}</div>
                            <div class="comment-info">
                                <h3>${escapeHtml(authorName)}</h3>
                                <span class="comment-date">${timeAgo}</span>
                            </div>
                        </div>
                    </div>
                    <p class="comment-text">${escapeHtml(commentBody)}</p>
                    <div class="comment-actions">
                        <button class="comment-like-btn"><i class="fa-regular fa-heart"></i> <span>${commentData.likes || 0}</span></button>
                        <button class="reply-btn"><i class="fa-solid fa-reply"></i> Reply</button>
                        ${isOwner ? `
                            <button class="edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                        ` : ''}
                    </div>
                    <div class="replies-container"></div>
                `;

                commentsContainer.appendChild(commentCard);
                attachFirestoreCommentEvents(commentCard, commentId, authorName);
                loadReplies(commentId, commentCard.querySelector(".replies-container"));
            });
        });
    }

    function attachFirestoreCommentEvents(commentCard, commentId, authorName) {
        const commentRef = doc(db, "comments", commentId);

        // Comment Like
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

        // Delete Comment (Owner Only)
        const deleteBtn = commentCard.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                if (confirm("Are you sure you want to delete this comment?")) {
                    try {
                        await deleteDoc(commentRef);
                    } catch (err) {
                        console.error("Error deleting comment:", err);
                    }
                }
            });
        }

        // Edit Comment (Owner Only)
        const editBtn = commentCard.querySelector(".edit-btn");
        const commentTextEl = commentCard.querySelector(".comment-text");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                if (commentCard.querySelector(".inline-edit-box")) return;

                const editBox = document.createElement("div");
                editBox.classList.add("inline-edit-box");
                editBox.innerHTML = `
                    <textarea>${commentTextEl.textContent}</textarea>
                    <div style="display: flex; gap: 8px; margin-top: 5px;">
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
        }

        // Reply Box Toggle & Submission
        const replyBtn = commentCard.querySelector(".reply-btn");
        replyBtn.addEventListener("click", () => {
            if (commentCard.querySelector(".inline-reply-box")) return;

            const defaultReplyName = getCurrentUser();

            const replyBox = document.createElement("div");
            replyBox.classList.add("inline-reply-box");
            replyBox.innerHTML = `
                <input type="text" placeholder="Your name..." class="reply-name-input" value="${escapeHtml(defaultReplyName)}">
                <textarea placeholder="Write your reply here..."></textarea>
                <div style="display: flex; gap: 8px; margin-top: 5px;">
                    <button class="submit-btn-action send-reply">Send Reply</button>
                    <button class="cancel-btn cancel-reply">Cancel</button>
                </div>
            `;
            commentCard.appendChild(replyBox);

            replyBox.querySelector(".send-reply").addEventListener("click", async () => {
                const rName = replyBox.querySelector(".reply-name-input").value.trim();
                const rText = replyBox.querySelector("textarea").value.trim();

                if (rName !== "" && rText !== "") {
                    localStorage.setItem("portfolio_user", rName);
                    try {
                        await addDoc(collection(db, `comments/${commentId}/replies`), {
                            name: rName,
                            text: rText,
                            likes: 0,
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

    // Load real-time replies with strict owner check for Edit/Delete
    function loadReplies(commentId, repliesContainer) {
        const repliesQuery = query(collection(db, `comments/${commentId}/replies`), orderBy("createdAt", "asc"));
        
        onSnapshot(repliesQuery, (snapshot) => {
            repliesContainer.innerHTML = "";
            snapshot.forEach((replySnap) => {
                const replyData = replySnap.data();
                const replyId = replySnap.id;
                const replyBody = replyData.text || replyData.commentText || replyData.message || "";
                const replyAuthor = replyData.name || "Anonymous";
                const currentUser = getCurrentUser();

                // Strict Reply Ownership Verification
                const isReplyOwner = currentUser && replyAuthor.trim().toLowerCase() === currentUser.trim().toLowerCase();
                const replyTimeAgo = formatTimeAgo(replyData.createdAt);

                const replyCard = document.createElement("div");
                replyCard.classList.add("reply-card");
                replyCard.setAttribute("data-reply-id", replyId);
                
                replyCard.innerHTML = `
                    <div class="reply-header">
                        <span><strong>${escapeHtml(replyAuthor)}</strong></span>
                        <span class="reply-date">${replyTimeAgo}</span>
                    </div>
                    <p class="reply-text">${escapeHtml(replyBody)}</p>
                    <div class="comment-actions" style="margin-top: 5px;">
                        <button class="reply-like-btn"><i class="fa-regular fa-heart"></i> <span>${replyData.likes || 0}</span></button>
                        ${isReplyOwner ? `
                            <button class="reply-edit-btn"><i class="fa-solid fa-pen"></i> Edit</button>
                            <button class="reply-delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
                        ` : ''}
                    </div>
                `;
                repliesContainer.appendChild(replyCard);

                const replyRef = doc(db, `comments/${commentId}/replies`, replyId);

                // Reply Like
                const replyLikeBtn = replyCard.querySelector(".reply-like-btn");
                replyLikeBtn.addEventListener("click", async () => {
                    const isLiked = replyLikeBtn.classList.toggle("liked");
                    const icon = replyLikeBtn.querySelector("i");
                    const span = replyLikeBtn.querySelector("span");
                    
                    let currentLikes = parseInt(span.textContent) || 0;
                    let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
                    span.textContent = newLikes;
                    icon.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";

                    try {
                        await updateDoc(replyRef, { likes: newLikes });
                    } catch (err) {
                        console.error("Error updating reply likes:", err);
                    }
                });

                // Reply Delete (Owner Only)
                const replyDeleteBtn = replyCard.querySelector(".reply-delete-btn");
                if (replyDeleteBtn) {
                    replyDeleteBtn.addEventListener("click", async () => {
                        if (confirm("Are you sure you want to delete this reply?")) {
                            try {
                                await deleteDoc(replyRef);
                            } catch (err) {
                                console.error("Error deleting reply:", err);
                            }
                        }
                    });
                }

                // Reply Edit (Owner Only)
                const replyEditBtn = replyCard.querySelector(".reply-edit-btn");
                const replyTextEl = replyCard.querySelector(".reply-text");
                if (replyEditBtn) {
                    replyEditBtn.addEventListener("click", () => {
                        if (replyCard.querySelector(".inline-edit-box")) return;

                        const editBox = document.createElement("div");
                        editBox.classList.add("inline-edit-box");
                        editBox.innerHTML = `
                            <textarea>${replyTextEl.textContent}</textarea>
                            <div style="display: flex; gap: 8px; margin-top: 5px;">
                                <button class="submit-btn-action save-reply-edit">Save</button>
                                <button class="cancel-btn cancel-reply-edit">Cancel</button>
                            </div>
                        `;
                        replyCard.appendChild(editBox);

                        editBox.querySelector(".save-reply-edit").addEventListener("click", async () => {
                            const newText = editBox.querySelector("textarea").value.trim();
                            if (newText !== "") {
                                try {
                                    await updateDoc(replyRef, { text: newText });
                                    replyTextEl.textContent = newText;
                                } catch (err) {
                                    console.error("Error updating reply text:", err);
                                }
                            }
                            editBox.remove();
                        });

                        editBox.querySelector(".cancel-reply-edit").addEventListener("click", () => {
                            editBox.remove();
                        });
                    });
                }
            });
        });
    }

    // Security helper to prevent XSS
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
