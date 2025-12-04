// --- 1. SERVICE WORKER (BẮT BUỘC ĐỂ CÀI APP) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('SW Ready'))
            .catch(err => console.error('SW Fail', err));
    });
}

// --- 2. XỬ LÝ NÚT CÀI ĐẶT (ANDROID) ---
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Ngăn Chrome hiển thị popup mặc định xấu xí
    e.preventDefault();
    deferredPrompt = e;
    
    // Hiện nút cài đặt tùy chỉnh của ta
    installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            installBtn.style.display = 'none';
        }
        deferredPrompt = null;
    }
});

// --- 3. LOGIC XOAY & FULLSCREEN ---
const container = document.getElementById('game-container');
const androidOverlay = document.getElementById('android-overlay');
const modeDebug = document.getElementById('mode-debug');

function checkOrientation() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (w < h) {
        // ĐANG CẦM DỌC -> Kích hoạt chế độ xoay CSS
        container.classList.remove('mode-landscape');
        container.classList.add('mode-portrait');
        modeDebug.innerText = "Giả lập Ngang (Tràn viền)";
    } else {
        // ĐANG CẦM NGANG -> Bình thường
        container.classList.remove('mode-portrait');
        container.classList.add('mode-landscape');
        modeDebug.innerText = "Ngang Gốc";
    }
}

// --- 4. HỖ TRỢ ANDROID BROWSER (CHƯA CÀI APP) ---
// Android Browser cần người dùng chạm để ẩn thanh điều hướng dưới
const isAndroid = /Android/i.test(navigator.userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

if (isAndroid && !isStandalone) {
    // Nếu là Android và đang chạy trên trình duyệt (chưa cài app)
    // Hiện overlay nhắc người dùng chạm vào để full màn hình
    androidOverlay.style.display = 'flex';
    
    androidOverlay.addEventListener('click', () => {
        // Thử kích hoạt Fullscreen API
        const doc = document.documentElement;
        if (doc.requestFullscreen) doc.requestFullscreen();
        
        // Ẩn overlay
        androidOverlay.style.display = 'none';
        
        // Khóa xoay ngang nếu có thể
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    });
}

// --- SỰ KIỆN ---
window.addEventListener('resize', checkOrientation);
window.addEventListener('load', () => {
    checkOrientation();
    // Fix cuộn trang iOS
    setTimeout(() => window.scrollTo(0, 1), 100);
});

// Chặn kéo bậy bạ
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
