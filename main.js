import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, increment, deleteDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

window.addEventListener('DOMContentLoaded', () => {
    const userNameInput = document.getElementById('userName');
    const savedUser = localStorage.getItem('portfolio_username');
    
    if (userNameInput && savedUser) {
        userNameInput.value = savedUser;
        userNameInput.disabled = true;
    }

    ['1', '2', '3'].forEach(id => {
        const docRef = doc(db, "projects", "project_" + id);
        onSnapshot(docRef, (docSnap) => {
            const btn = document.getElementById('projectBtn_' + id);
            if (btn) {
                let likesCount = 20;
                if (docSnap.exists() && docSnap.data().likes !== undefined) {
                    likesCount = docSnap.data().likes;
                }
                btn.innerText = `❤️ ${likesCount} Likes`;
            }
        });
    });
});

const commentForm = document.getElementById('commentForm');
if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userNameInput = document.getElementById('userName');
        let userName = localStorage.getItem('portfolio_username');

        if (!userName) {
            userName = userNameInput.value.trim();
            if (userName) {
                localStorage.setItem('portfolio_username', userName);
                userNameInput.disabled = true;
            }
        }

        const commentText = document.getElementById('commentText').value.trim();
        if (!commentText || !userName) return;
        
        try {
            await addDoc(collection(db, "comments"), {
                name: userName,
                text: commentText,
                timestamp: new Date().toLocaleString(),
                likes: 0
            });
            document.getElementById('commentText').value = '';
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    });

    onSnapshot(collection(db, "comments"), (snapshot) => {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        commentsList.innerHTML = '';
        
        snapshot.forEach((docSnap) => {
            const comment = docSnap.data();
            const commentId = docSnap.id;
            const authorName = comment.name || comment.userName || "User";
            const firstLetter = authorName.charAt(0).toUpperCase();
            
            // فحص جميع الاحتمالات الممكنة لمكان حفظ النص في الداتا القديمة أو الجديدة
            const commentText = comment.text || comment.comment || comment.message || comment.content || "";
            
            // معالجة التاريخ لو كان كينديشن أو نص عادي
            let commentDate = comment.timestamp || "";
            if (typeof commentDate === 'object') {
                commentDate = "Recent";
            }

            let repliesHTML = '';
            if (comment.replies && Array.isArray(comment.replies)) {
                comment.replies.forEach(reply => {
                    repliesHTML += `
                        <div class="reply-item">
                            <strong>${reply.name}:</strong> ${reply.text}
                        </div>
                    `;
                });
            }

            const commentElement = document.createElement('div');
            commentElement.className = 'comment-card';
            commentElement.innerHTML = `
                <div class="comment-header">
                    <div class="avatar">${firstLetter}</div>
                    <div>
                        <strong>${authorName}</strong>
                        <div class="comment-date">${commentDate}</div>
                    </div>
                </div>
                <div class="comment-text">${commentText}</div>
                <div class="comment-actions">
                    <button onclick="likeComment('${commentId}')">❤️ ${comment.likes || 0} Likes</button>
                    <button onclick="toggleReplyForm('${commentId}')">💬 Reply</button>
                    <button onclick="deleteComment('${commentId}')" style="color: #ff4d4d;">🗑️ Delete</button>
                </div>
                <div id="repliesContainer_${commentId}" class="replies-container" style="${comment.replies && comment.replies.length > 0 ? '' : 'display:none;'}">
                    ${repliesHTML}
                </div>
                <div id="replyForm_${commentId}" class="reply-form" style="display:none;">
                    <input type="text" id="replyInput_${commentId}" placeholder="Write a reply...">
                    <button onclick="submitReply('${commentId}')">Send</button>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });
    });
}

window.likeComment = async function(commentId) {
    const likedKey = 'liked_comment_' + commentId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا التعليق مسبقاً!");
        return;
    }
    const commentRef = doc(db, "comments", commentId);
    await updateDoc(commentRef, { likes: increment(1) });
    localStorage.setItem(likedKey, 'true');
};

window.toggleReplyForm = function(commentId) {
    const form = document.getElementById('replyForm_' + commentId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    }
};

window.submitReply = async function(commentId) {
    const replyInput = document.getElementById('replyInput_' + commentId);
    const replyText = replyInput.value.trim();
    let userName = localStorage.getItem('portfolio_username');

    if (!userName) {
        alert("الرجاء كتابة اسمك في قسم التعليقات أولاً!");
        return;
    }
    if (!replyText) return;

    const commentRef = doc(db, "comments", commentId);
    const docSnap = await getDoc(commentRef);
    if (docSnap.exists()) {
        const commentData = docSnap.data();
        const replies = commentData.replies || [];
        replies.push({
            name: userName,
            text: replyText,
            timestamp: new Date().toLocaleString()
        });
        await updateDoc(commentRef, { replies: replies });
        replyInput.value = '';
        document.getElementById('replyForm_' + commentId).style.display = 'none';
    }
};

window.deleteComment = async function(commentId) {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        await deleteDoc(doc(db, "comments", commentId));
    }
};

window.likeProject = async function(projectId) {
    const likedKey = 'liked_project_' + projectId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا المشروع مسبقاً!");
        return;
    }
    const projectRef = doc(db, "projects", "project_" + projectId);
    const docSnap = await getDoc(projectRef);
    
    if (!docSnap.exists()) {
        await setDoc(projectRef, { likes: 21 });
    } else {
        const currentLikes = docSnap.data().likes !== undefined ? docSnap.data().likes : 20;
        await updateDoc(projectRef, { likes: currentLikes + 1 });
    }
    localStorage.setItem(likedKey, 'true');
};

window.openVideo = function(videoSrc) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    if (modal && video) {
        video.src = videoSrc;
        modal.classList.add('active');
        video.play();
    }
};

window.closeVideo = function() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('modalVideo');
    if (modal && video) {
        video.pause();
        video.src = '';
        modal.classList.remove('active');
    }
};
