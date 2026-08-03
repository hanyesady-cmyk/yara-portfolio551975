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
    // --- 1. Scroll Reveal Animation using IntersectionObserver ---
    const selectors = '.skill-card, .project-card, .comment-card, .contact-container, .section-title';
    const elementsToReveal = document.querySelectorAll(selectors);

    elementsToReveal.forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    elementsToReveal.forEach(el => {
        scrollObserver.observe(el);
    });

    // --- 2. General Like Buttons Toggle UI ---
    document.addEventListener('click', (e) => {
        const likeButton = e.target.closest('.like-btn, .project-like, .comment-like-btn, .reply-like-btn');
        if (likeButton) {
            likeButton.classList.toggle('liked');
            const icon = likeButton.querySelector("i");
            if (icon) {
                if (likeButton.classList.contains("liked")) {
                    icon.className = "fa-solid fa-heart";
                } else {
                    icon.className = "fa-regular fa-heart";
                }
            }
        }
    });

    // --- 3. Mobile Menu Toggle ---
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

    // --- 4. Video Modal Functionality ---
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

    // --- 5. Project Likes from Firebase (Global for all users) ---
    document.querySelectorAll(".project-card").forEach((card, index) => {
        const projectId = `project_${index + 1}`;
        const likeBtn = card.querySelector(".project-like");
        if (!likeBtn) return;

        const span = likeBtn.querySelector("span");
        const icon = likeBtn.querySelector("i");
        const projectRef = doc(db, "projects_likes", projectId);

        getDoc(projectRef).then((docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (span) span.textContent = `${data.likes || 0} Likes`;
            }
        }).catch(err => console.error(err));

        likeBtn.addEventListener("click", async () => {
            const isLiked = likeBtn.classList.contains("liked");
            let currentLikes = parseInt(span ? span.textContent : 0) || 0;
            let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            
            if (span) span.textContent = `${newLikes} Likes`;

            try {
                await setDoc(projectRef, { likes: newLikes }, { merge: true });
            } catch (err) {
                console.error("Error updating project like:", err);
            }
        });
    });

    // --- 6. Firebase Real-time Comments & Replies System ---
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
                commentCard.classList.add("comment-card", "reveal-on-scroll", "active");
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
            const isLiked = likeBtn.classList.contains("liked");
            const span = likeBtn.querySelector("span");
            
            let currentLikes = parseInt(span.textContent) || 0;
            let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            span.textContent = newLikes;

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
});document.addEventListener("DOMContentLoaded", () => {
    // 1. تفعيل ظهور الكروت والمحتوى تدريجياً أثناء السكرول بأمان
    const selectors = '.skill-card, .project-card, .comment-card, .contact-container, .section-title';
    const elementsToReveal = document.querySelectorAll(selectors);

    elementsToReveal.forEach(el => {
        el.classList.add('reveal-on-scroll');
    });

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    elementsToReveal.forEach(el => {
        scrollObserver.observe(el);
    });

    // 2. تفعيل تحول زرار اللايك للأحمر ونطه عند الضغط عليه
    document.addEventListener('click', (e) => {
        const likeButton = e.target.closest('.like-btn, .project-like, .comment-like-btn, .reply-like-btn');
        if (likeButton) {
            likeButton.classList.toggle('liked');
        }
    });
});
