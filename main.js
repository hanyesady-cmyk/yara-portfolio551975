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

// دالة حديثة لتحديث مكتبة الأنيميشن وتجنب ثبات أو اختفاء المحتوى
function refreshAOS() {
    if (typeof AOS !== 'undefined') {
        setTimeout(() => {
            AOS.refresh();
        }, 150);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // تفعيل مكتبة الأنيميشن للسكرول بإعدادات مودرن وانسيابية
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,      // سرعة الانيميشن
            once: true,          // تفعيل الحركة مرة واحدة عند السكرول للمرة الأولى
            offset: 80,          // مسافة البداية قبل ظهور العنصر بقليل
            easing: 'ease-out-cubic' // حركة ناعمة ومودرن
        });
    }

    const userNameInput = document.getElementById('userName');
    const savedUser = localStorage.getItem('portfolio_username');
    
    if (userNameInput && savedUser) {
        userNameInput.value = savedUser;
        userNameInput.disabled = true;
    }

    // جلب عدد اللايكات للمشاريع بالاسم الصحيح للمستندات (project1, project2, project3)
    ['1', '2', '3'].forEach(id => {
        const docRef = doc(db, "projects", "project" + id);
        onSnapshot(docRef, (docSnap) => {
            const btn = document.getElementById('projectBtn_' + id);
            if (btn) {
                let likesCount = 0;
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    likesCount = data.likes !== undefined ? data.likes : (data.like !== undefined ? data.like : 0);
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
        
        const currentUser = localStorage.getItem('portfolio_username');

        snapshot.forEach((docSnap) => {
            const comment = docSnap.data();
            const commentId = docSnap.id;
            const authorName = comment.name || comment.userName || "User";
            const firstLetter = authorName.charAt(0).toUpperCase();
            
            const commentText = comment.text || comment.comment || comment.message || comment.content || "";
            
            let commentDate = comment.timestamp || "";
            if (typeof commentDate === 'object') {
                commentDate = "Recent";
            }

            let repliesList = comment.replies || comment.reply || comment.responses || [];
            let repliesHTML = '';
            
            if (Array.isArray(repliesList) && repliesList.length > 0) {
                repliesList.forEach(reply => {
                    const replyName = reply.name || reply.userName || "User";
                    const replyText = reply.text || reply.comment || reply.message || "";
                    repliesHTML += `
                        <div class="reply-item">
                            <strong>${replyName}:</strong> ${replyText}
                        </div>
                    `;
                });
            }

            let deleteButtonHTML = '';
            if (currentUser && currentUser.trim().toLowerCase() === authorName.trim().toLowerCase()) {
                deleteButtonHTML = `<button onclick="deleteComment('${commentId}')" style="color: #ff4d4d;">🗑️ Delete</button>`;
            }

            const commentElement = document.createElement('div');
            commentElement.className = 'comment-card';
            // إضافة خاصية الـ AOS هنا ديناميكياً لتظهر بشكل مودرن عند السكرول
            commentElement.setAttribute('data-aos', 'fade-up');
            
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
                    ${deleteButtonHTML}
                </div>
                <div id="repliesContainer_${commentId}" class="replies-container" style="${repliesHTML ? '' : 'display:none;'}">
                    ${repliesHTML}
                </div>
                <div id="replyForm_${commentId}" class="reply-form" style="display:none;">
                    <input type="text" id="replyInput_${commentId}" placeholder="Write a reply...">
                    <button onclick="submitReply('${commentId}')">Send</button>
                </div>
            `;
            commentsList.appendChild(commentElement);
        });

        // تحديث الانيميشن ليعمل بشكل سليم مع العناصر المضافة حديثاً
        refreshAOS();
    });
}

window.likeComment = async function(commentId) {
    const likedKey = 'liked_comment_' + commentId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا التعليق مسبقاً!");
        return;
    }
    const commentRef = doc(db, "comments", commentId);
    const docSnap = await getDoc(commentRef);
    if(docSnap.exists()) {
        const currentLikes = docSnap.data().likes || 0;
        await updateDoc(commentRef, { likes: currentLikes + 1 });
        localStorage.setItem(likedKey, 'true');
    }
};

window.toggleReplyForm = function(commentId) {
    const form = document.getElementById('replyForm_' + commentId);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'flex' : 'none';
        refreshAOS();
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
        const replies = commentData.replies || commentData.reply || [];
        replies.push({
            name: userName,
            text: replyText,
            timestamp: new Date().toLocaleString()
        });
        await updateDoc(commentRef, { replies: replies });
        replyInput.value = '';
        document.getElementById('replyForm_' + commentId).style.display = 'none';
        refreshAOS();
    }
};

window.deleteComment = async function(commentId) {
    if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
        await deleteDoc(doc(db, "comments", commentId));
    }
};

// دالة الاعجاب بالمشروع متوافقة مع الـ Document IDs (project1, project2, project3)
window.likeProject = async function(projectId) {
    const likedKey = 'liked_project_' + projectId;
    if (localStorage.getItem(likedKey)) {
        alert("لقد قمت بالاعجاب بهذا المشروع مسبقاً!");
        return;
    }
    const projectRef = doc(db, "projects", "project" + projectId);
    const docSnap = await getDoc(projectRef);
    
    if (!docSnap.exists()) {
        await setDoc(projectRef, { likes: 1 });
    } else {
        const data = docSnap.data();
        const currentLikes = data.likes !== undefined ? data.likes : (data.like !== undefined ? data.like : 0);
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
