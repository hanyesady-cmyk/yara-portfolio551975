// Import Firebase SDK v10 (Modular / ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: استبدل بيانات الإعدادات دي ببيانات مشروعك الحقيقي من Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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

    // --- 4. General Like Buttons (e.g., Projects) ---
    document.querySelectorAll(".project-like").forEach(btn => {
        btn.addEventListener("click", function() {
            this.classList.toggle("liked");
            const icon = this.querySelector("i");
            const span = this.querySelector("span");

            if (this.classList.contains("liked")) {
                if (icon) icon.className = "fa-solid fa-heart";
                if (span) span.textContent = parseInt(span.textContent || 0) + 1;
            } else {
                if (icon) icon.className = "fa-regular fa-heart";
                if (span) span.textContent = Math.max(0, parseInt(span.textContent || 1) - 1);
            }
        });
    });

    // --- 5. Firebase Real-time Comments & Replies System ---
    const commentForm = document.getElementById("commentForm");
    const commentsContainer = document.getElementById("commentsContainer");

    if (commentForm && commentsContainer) {
        // إرسال تعليق جديد إلى فايربيز
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
                alert("حدث خطأ أثناء إرسال التعليق، تأكد من ضبط إعدادات فايربيز وسلاح الصلاحيات (Firestore Rules).");
            }
        });

        // جلب التعليقات وعرضها بشكل لحظي (Real-time listener)
        const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
        
        onSnapshot(q, (snapshot) => {
            commentsContainer.innerHTML = "";
            
            if (snapshot.empty) {
                commentsContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size: 14px;">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>`;
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
                                <span class="comment-date">منذ قليل</span>
                            </div>
                        </div>
                    </div>
                    <p class="comment-text">${escapeHtml(commentData.text)}</p>
                    <div class="comment-actions">
                        <button class="comment-like-btn"><i class="fa-regular fa-heart"></i> <span>${commentData.likes || 0}</span></button>
                        <button class="reply-btn"><i class="fa-solid fa-reply"></i> رد</button>
                        <button class="edit-btn"><i class="fa-solid fa-pen"></i> تعديل</button>
                        <button class="delete-btn"><i class="fa-solid fa-trash"></i> حذف</button>
                    </div>
                    <div class="replies-container"></div>
                `;

                commentsContainer.appendChild(commentCard);
                attachFirestoreCommentEvents(commentCard, commentId);
                loadReplies(commentId, commentCard.querySelector(".replies-container"));
            });
        });
    }

    // ربط تفاعلات التعليق (لايك، تعديل، حذف، رد) بقاعدة بيانات فايربيز
    function attachFirestoreCommentEvents(commentCard, commentId) {
        const commentRef = doc(db, "comments", commentId);

        // 1. لايك التعليق
        const likeBtn = commentCard.querySelector(".comment-like-btn");
        likeBtn.addEventListener("click", async () => {
            const isLiked = likeBtn.classList.toggle("liked");
            const icon = likeBtn.querySelector("i");
            const span = likeBtn.querySelector("span");
            
            let currentLikes = parseInt(span.textContent) || 0;
            let newLikes = isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            span.textContent = newLikes;

            if (isLiked) {
                icon.className = "fa-solid fa-heart";
            } else {
                icon.className = "fa-regular fa-heart";
            }

            try {
                await updateDoc(commentRef, { likes: newLikes });
            } catch (err) {
                console.error("Error updating likes:", err);
            }
        });

        // 2. حذف التعليق
        const deleteBtn = commentCard.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", async () => {
            if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
                try {
                    await deleteDoc(commentRef);
                } catch (err) {
                    console.error("Error deleting comment:", err);
                }
            }
        });

        // 3. تعديل التعليق
        const editBtn = commentCard.querySelector(".edit-btn");
        const commentTextEl = commentCard.querySelector(".comment-text");
        editBtn.addEventListener("click", () => {
            if (commentCard.querySelector(".inline-edit-box")) return;

            const editBox = document.createElement("div");
            editBox.classList.add("inline-edit-box");
            editBox.innerHTML = `
                <textarea>${commentTextEl.textContent}</textarea>
                <div style="display: flex; gap: 8px;">
                    <button class="submit-btn-action save-edit">حفظ</button>
                    <button class="cancel-btn cancel-edit">إلغاء</button>
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

        // 4. زر إضافة رد
        const replyBtn = commentCard.querySelector(".reply-btn");
        const repliesContainer = commentCard.querySelector(".replies-container");
        replyBtn.addEventListener("click", () => {
            if (commentCard.querySelector(".inline-reply-box")) return;

            const replyBox = document.createElement("div");
            replyBox.classList.add("inline-reply-box");
            replyBox.innerHTML = `
                <input type="text" placeholder="اسمك الكريم..." class="reply-name-input">
                <textarea placeholder="اكتب ردك هنا..."></textarea>
                <div style="display: flex; gap: 8px;">
                    <button class="submit-btn-action send-reply">إرسال الرد</button>
                    <button class="cancel-btn cancel-reply">إلغاء</button>
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

    // جلب الردود الخاصة بكل تعليق بشكل لحظي
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
                        <span>منذ قليل</span>
                    </div>
                    <p class="reply-text">${escapeHtml(replyData.text)}</p>
                `;
                repliesContainer.appendChild(replyCard);
            });
        });
    }

    // دالة أمان لمنع الثغرات
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
