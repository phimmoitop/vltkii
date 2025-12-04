// --- 1. CONFIG & VARIABLES ---
const popupAndroid = document.getElementById('popup-android');
const btnInstall = document.getElementById('btn-install');
const btnFullscreen = document.getElementById('btn-fullscreen');
const btnClose = document.getElementById('btn-close');
const gameContainer = document.getElementById('game-container');
const statusText = document.getElementById('status-text');

let deferredPrompt; // Biến lưu sự kiện cài đặt

// Kiểm tra môi trường
const ua = navigator.userAgent;
const isAndroid = /Android/i.test(ua);
const isIOS = /iPhone|iPad|iPod/i.test(ua);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

// --- 2. SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}

// --- 3. LOGIC HIỂN THỊ POPUP (CHỈ ANDROID BROWSER) ---
window.addEventListener('load', () => {
    // Nếu là Android VÀ KHÔNG PHẢI App đã cài
    if (isAndroid && !isStandalone) {
        popupAndroid.style.display = 'flex';
    } else {
        // iOS hoặc PC hoặc App đã cài -> Vào thẳng game
        statusText.innerText = "Sẵn sàng chiến đấu";
    }
    
    checkOrientation(); // Chạy layout lần đầu
    
    // Hack cuộn trang cho iOS/Android để giấu thanh địa chỉ (nếu có)
    setTimeout(() => window.scrollTo(0, 1), 100);
});

// --- 4. XỬ LÝ CÁC NÚT BẤM ---

// Nút Đóng Popup
btnClose.addEventListener('click', () => {
    popupAndroid.style.display = 'none';
});

// Nút Fullscreen (Quan trọng để ẩn thanh bottom Android)
btnFullscreen.addEventListener('click', () => {
    const doc = document.documentElement;
    
    // Gọi API Fullscreen chuẩn
    const request = doc.requestFullscreen || doc.webkitRequestFullscreen || doc.msRequestFullscreen;
    
    if (request) {
        request.call(doc).then(() => {
            // Sau khi full, thử khóa xoay màn hình (chỉ Android hỗ trợ)
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(e => console.log('Lock fail:', e));
            }
        }).catch(err => console.log('Fullscreen Error:', err));
    }
    
    popupAndroid.style.display = 'none';
});

// Nút Cài đặt App
// Lắng nghe sự kiện cài đặt từ Chrome Android
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Khi bắt được sự kiện, mới HIỆN nút cài đặt lên
    btnInstall.style.display = 'block';
});

btnInstall.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
                // Người dùng đồng ý cài -> Ẩn popup luôn
                popupAndroid.style.display = 'none';
            }
            deferredPrompt = null;
        });
    }
});

// --- 5. LOGIC XOAY MÀN HÌNH (Layout Engine) ---
function checkOrientation() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Logic: Nếu chiều rộng nhỏ hơn chiều cao (Cầm dọc)
    if (w < h) {
        gameContainer.classList.add('force-landscape');
        statusText.innerText = "Chế độ xoay ngang";
    } else {
        gameContainer.classList.remove('force-landscape');
        statusText.innerText = "Chế độ gốc";
    }
}

// Lắng nghe thay đổi kích thước/xoay
window.addEventListener('resize', checkOrientation);

// Chặn kéo lung tung
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
