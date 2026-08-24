const IMGBB_API_KEY = "c043b00fe27b1322e754c9752bbcb5c6";

const adImagesList = [
    "https://cdn.phototourl.com/free/2026-08-18-8aac3d24-5fb6-4ca9-af05-f0e72fb5cd20.jpg",
    "https://cdn.phototourl.com/free/2026-08-18-9af73a5b-aed4-479d-b2c4-3a8bfffa1400.png",
    "https://cdn.phototourl.com/free/2026-08-18-0b8770d4-c147-4547-a3e8-1d3945bd83c1.jpg"
];

let currentAdIndex = 0;
let previewAudio = new Audio();
let fullAudio = new Audio();

function showAlert(message, title = "แจ้งเตือน", iconClass = "fa-circle-info") {
    const alertOverlay = document.getElementById("customAlert");
    const alertTitle = document.getElementById("alertTitle");
    const alertMessage = document.getElementById("alertMessage");
    const alertIcon = document.getElementById("alertIcon");

    if (alertOverlay) {
        alertTitle.innerText = title;
        alertMessage.innerText = message;
        alertIcon.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
        alertOverlay.classList.add("show");
    } else {
        alert(message);
    }
}

function closeCustomAlert() {
    const alertOverlay = document.getElementById("customAlert");
    if (alertOverlay) alertOverlay.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("bio_name")) {
        renderFullBioPageFromUrl(urlParams);
        return;
    }
    if (urlParams.has("web_data")) {
        renderPublishedWebsiteFromUrl(urlParams);
        return;
    }

    const strip = document.getElementById("logoPatternStrip");
    const logoUrl = "https://cdn.phototourl.com/free/2026-08-18-2b12c8b4-e50b-4169-b89b-580dbde96f9b.png";
    const screenWidth = window.innerWidth;
    const logoCount = screenWidth < 768 ? 12 : 25; 

    if (strip) {
        for (let i = 0; i < logoCount; i++) {
            const img = document.createElement("img");
            img.src = logoUrl;
            img.alt = "Mini Logo";
            img.className = "mini-logo";
            strip.appendChild(img);
        }
    }

    const splash = document.getElementById("intro-splash");
    const introLogo = document.getElementById("introLogo");
    const targetLogo = document.getElementById("targetMainLogo");
    const adModal = document.getElementById("adModal");

    if (splash && introLogo && targetLogo) {
        setTimeout(() => {
            const targetRect = targetLogo.getBoundingClientRect();
            const introRect = introLogo.getBoundingClientRect();

            const deltaX = targetRect.left - introRect.left + (targetRect.width - introRect.width) / 2;
            const deltaY = targetRect.top - introRect.top + (targetRect.height - introRect.height) / 2;

            introLogo.style.transition = "transform 0.8s cubic-bezier(0.77, 0, 0.175, 1), opacity 0.8s ease";
            const scaleFactor = targetRect.width / introRect.width;
            introLogo.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleFactor})`;
            
            setTimeout(() => { splash.style.opacity = "0"; }, 600);
            setTimeout(() => {
                splash.style.display = "none";
                setTimeout(() => {
                    if (adModal) {
                        showCurrentAd();
                        adModal.classList.add("show");
                    }
                }, 1000);
            }, 900);
        }, 800);
    }

    updatePreview();
    loadWebsiteBuilderData();
});

function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => { resolve(blob); }, "image/jpeg", quality);
            };
        };
    });
}

async function uploadImageToImgBB(fileInputId, hiddenUrlInputId) {
    const fileInput = document.getElementById(fileInputId);
    const hiddenInput = document.getElementById(hiddenUrlInputId);
    const statusSpan = document.getElementById(fileInputId === 'fileProfile' ? 'statusProfile' : 'statusBg');

    if (!fileInput || !fileInput.files[0]) return;
    if (statusSpan) statusSpan.innerText = "⏳ กำลังอัปโหลดรูป...";

    try {
        const compressedBlob = await compressImage(fileInput.files[0], 800, 0.7);
        const formData = new FormData();
        formData.append("image", compressedBlob, "upload.jpg");

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            if (hiddenInput) hiddenInput.value = result.data.url;
            if (statusSpan) statusSpan.innerText = "✅ อัปโหลดรูปสำเร็จ!";
            updatePreview();
        } else {
            if (statusSpan) statusSpan.innerText = "❌ อัปโหลดไม่สำเร็จ";
        }
    } catch (error) {
        if (statusSpan) statusSpan.innerText = "❌ เกิดข้อผิดพลาด";
    }
}

async function uploadImageForBuilder(fileInput) {
    if (!fileInput.files[0] || !selectedElementId) return;
    showAlert("กำลังอัปโหลดรูปภาพ...", "โปรดรอสักครู่", "fa-spinner");

    try {
        const compressedBlob = await compressImage(fileInput.files[0], 800, 0.7);
        const formData = new FormData();
        formData.append("image", compressedBlob, "upload.jpg");

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            updateSelectedElementProp('content', result.data.url);
            showAlert("อัปโหลดรูปภาพสำเร็จ!", "สำเร็จ", "fa-circle-check");
        } else {
            showAlert("อัปโหลดรูปไม่สำเร็จ", "ผิดพลาด", "fa-circle-xmark");
        }
    } catch (error) {
        showAlert("เชื่อมต่อระบบฝากรูปไม่สำเร็จ", "ผิดพลาด", "fa-wifi");
    }
}

async function uploadCanvasBgImage(fileInput) {
    if (!fileInput.files[0]) return;
    showAlert("กำลังอัปโหลดรูปพื้นหลัง...", "โปรดรอสักครู่", "fa-spinner");

    try {
        const compressedBlob = await compressImage(fileInput.files[0], 1200, 0.8);
        const formData = new FormData();
        formData.append("image", compressedBlob, "bg.jpg");

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            builderCanvasBgUrl = result.data.url;
            builderCanvasBgColor = "";
            applyCanvasBackground();
            showAlert("ตั้งค่ารูปพื้นหลังสำเร็จ!", "สำเร็จ", "fa-circle-check");
        } else {
            showAlert("อัปโหลดรูปไม่สำเร็จ", "ผิดพลาด", "fa-circle-xmark");
        }
    } catch (error) {
        showAlert("เชื่อมต่อระบบฝากรูปไม่สำเร็จ", "ผิดพลาด", "fa-wifi");
    }
}

function updateCanvasBgColor(color) {
    builderCanvasBgColor = color;
    builderCanvasBgUrl = "";
    applyCanvasBackground();
}

function applyCanvasBackground() {
    const canvas = document.getElementById("builderCanvas");
    if (!canvas) return;
    if (builderCanvasBgUrl) {
        canvas.style.backgroundImage = `url('${builderCanvasBgUrl}')`;
        canvas.style.backgroundColor = "transparent";
    } else {
        canvas.style.backgroundImage = "none";
        canvas.style.backgroundColor = builderCanvasBgColor || "#ffffff";
    }
}

function showCurrentAd() {
    const adImage = document.getElementById("adImage");
    const adCounter = document.getElementById("adCounter");
    if (adImage && adCounter) {
        adImage.src = adImagesList[currentAdIndex];
        adCounter.innerText = `โฆษณา ${currentAdIndex + 1} จาก ${adImagesList.length}`;
    }
}

function nextAd() {
    const adModal = document.getElementById("adModal");
    currentAdIndex++;
    if (currentAdIndex < adImagesList.length) {
        showCurrentAd();
    } else {
        if (adModal) adModal.classList.remove("show");
    }
}

function openProductModal(imgSrc, price, desc) {
    const modal = document.getElementById("productModal");
    const pImg = document.getElementById("modalProductImg");
    const pPrice = document.getElementById("modalProductPrice");
    const pDesc = document.getElementById("modalProductDesc");
    
    if (pImg) pImg.src = imgSrc;
    if (pPrice) pPrice.innerText = price;
    if (pDesc) pDesc.innerText = desc;
    if (modal) modal.classList.add("show");
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.remove("show");
}

function toggleMenu() {
    const menu = document.getElementById("dropdownMenu");
    if (menu) menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function toggleContact(event) {
    event.stopPropagation();
    const contactBox = document.getElementById("contactDropdown");
    const arrowIcon = document.getElementById("arrowIcon");

    if (contactBox && arrowIcon) {
        if (contactBox.style.display === "block") {
            contactBox.style.display = "none";
            arrowIcon.style.transform = "rotate(0deg)";
        } else {
            contactBox.style.display = "block";
            arrowIcon.style.transform = "rotate(180deg)";
        }
    }
}

function openBioPage() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    const bioPage = document.getElementById("bioPage");
    if (dropdownMenu) dropdownMenu.style.display = "none";
    if (bioPage) bioPage.style.display = "block";
}

function closeBioPage() {
    const bioPage = document.getElementById("bioPage");
    if (bioPage) bioPage.style.display = "none";
    previewAudio.pause();
}

function updatePreview() {
    const nameInput = document.getElementById("inputName");
    const captionInput = document.getElementById("inputCaption");
    const profileUrlInput = document.getElementById("inputProfileUrl");
    const bgUrlInput = document.getElementById("inputBgUrl");
    const alignSelect = document.getElementById("selectAlign");
    const btnColorInput = document.getElementById("inputBtnColor");
    const radiusSelect = document.getElementById("selectRadius");
    const musicInput = document.getElementById("inputMusic");
    const glassToggle = document.getElementById("toggleIphoneGlass");

    const name = nameInput ? nameInput.value : "ชื่อของคุณ";
    const caption = captionInput ? captionInput.value : "แคปชั่นโปรไฟล์";
    const profileUrl = profileUrlInput && profileUrlInput.value ? profileUrlInput.value : "https://via.placeholder.com/150?text=Profile";
    const bgUrl = bgUrlInput ? bgUrlInput.value : "";
    const alignClass = alignSelect ? alignSelect.value : "center";
    const btnColor = btnColorInput ? btnColorInput.value : "#0018F9";
    const btnRadius = radiusSelect ? radiusSelect.value : "20px";
    const musicUrl = musicInput ? musicInput.value : "";
    const isIphoneGlass = glassToggle ? glassToggle.checked : false;

    const previewName = document.getElementById("previewName");
    const previewCaption = document.getElementById("previewCaption");
    const previewAvatar = document.getElementById("previewAvatar");

    if (previewName) previewName.innerText = name;
    if (previewCaption) previewCaption.innerText = caption;
    if (previewAvatar) previewAvatar.src = profileUrl;

    const contentBox = document.getElementById("previewContentBox");
    if (contentBox) contentBox.className = `screen-content ${alignClass}`;

    const previewScreen = document.getElementById("previewScreen");
    if (previewScreen) {
        previewScreen.style.backgroundImage = bgUrl ? `url('${bgUrl}')` : "none";
    }

    const linksContainer = document.getElementById("previewLinksContainer");
    if (linksContainer) {
        linksContainer.innerHTML = "";

        const fb = document.getElementById("inputFb")?.value;
        const ig = document.getElementById("inputIg")?.value;
        const line = document.getElementById("inputLine")?.value;
        const tiktok = document.getElementById("inputTiktok")?.value;

        if (fb) addLinkBtn(linksContainer, '<i class="fa-brands fa-facebook"></i> Facebook', fb, btnColor, btnRadius, isIphoneGlass);
        if (ig) addLinkBtn(linksContainer, '<i class="fa-brands fa-instagram"></i> Instagram', ig, btnColor, btnRadius, isIphoneGlass);
        if (line) addLinkBtn(linksContainer, '<i class="fa-brands fa-line"></i> LINE', line, btnColor, btnRadius, isIphoneGlass);
        if (tiktok) addLinkBtn(linksContainer, '<i class="fa-brands fa-tiktok"></i> TikTok', tiktok, btnColor, btnRadius, isIphoneGlass);

        if (!fb && !ig && !line && !tiktok) {
            linksContainer.innerHTML = '<div style="color:rgba(255,255,255,0.7); font-size:12px; text-align:center;">(เพิ่มลิงก์ปุ่มจะแสดงที่นี่)</div>';
        }
    }

    const musicBox = document.getElementById("previewMusicBox");
    if (musicBox) {
        if (musicUrl) {
            musicBox.style.display = "block";
            previewAudio.src = musicUrl;
        } else {
            musicBox.style.display = "none";
            previewAudio.pause();
        }
    }
}

function addLinkBtn(container, htmlText, url, textColor, borderRadius, isIphoneGlass) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.innerHTML = htmlText;
    a.style.color = textColor;
    a.style.borderRadius = borderRadius;

    if (isIphoneGlass) {
        a.className = "preview-link-btn iphone-glass-dome";
    } else {
        a.className = "preview-link-btn flat-btn";
        a.style.backgroundColor = "#ffffff";
        a.style.color = "#0018F9";
    }
    container.appendChild(a);
}

function toggleAudioPreview() {
    const icon = document.getElementById("musicIcon");
    if (previewAudio.paused) {
        previewAudio.play();
        if (icon) icon.className = "fa-solid fa-pause";
    } else {
        previewAudio.pause();
        if (icon) icon.className = "fa-solid fa-play";
    }
}

function closeAudioPreview() {
    previewAudio.pause();
    const box = document.getElementById("previewMusicBox");
    if (box) box.style.display = "none";
}

function toggleAudioFull() {
    const icon = document.getElementById("fullMusicIcon");
    if (fullAudio.paused) {
        fullAudio.play();
        if (icon) icon.className = "fa-solid fa-pause";
    } else {
        fullAudio.pause();
        if (icon) icon.className = "fa-solid fa-play";
    }
}

function generateLink() {
    const nameInput = document.getElementById("inputName");
    const name = nameInput ? nameInput.value : "";
    if (!name) {
        showAlert("กรุณากรอกชื่อโปรไฟล์ของคุณด้วยนะครับ", "ข้อมูลไม่ครบ", "fa-user-pen");
        return;
    }

    const data = {
        name: name,
        caption: document.getElementById("inputCaption")?.value || "",
        profile: document.getElementById("inputProfileUrl")?.value || "",
        bg: document.getElementById("inputBgUrl")?.value || "",
        align: document.getElementById("selectAlign")?.value || "center",
        btnColor: document.getElementById("inputBtnColor")?.value || "#0018F9",
        btnRadius: document.getElementById("selectRadius")?.value || "20px",
        music: document.getElementById("inputMusic")?.value || "",
        isIphoneGlass: document.getElementById("toggleIphoneGlass")?.checked || false,
        fb: document.getElementById("inputFb")?.value || "",
        ig: document.getElementById("inputIg")?.value || "",
        line: document.getElementById("inputLine")?.value || "",
        tiktok: document.getElementById("inputTiktok")?.value || ""
    };

    const encodedData = encodeURIComponent(JSON.stringify(data));
    const baseUrl = window.location.origin + window.location.pathname;
    const finalUrl = `${baseUrl}?bio_name=${encodeURIComponent(name)}#data=${encodedData}`;

    const finalUrlText = document.getElementById("finalUrlText");
    const btnTestOpen = document.getElementById("btnTestOpen");
    const generatedResult = document.getElementById("generatedResult");

    if (finalUrlText) finalUrlText.value = finalUrl;
    if (btnTestOpen) btnTestOpen.href = finalUrl;
    if (generatedResult) generatedResult.style.display = "block";
    showAlert("สร้าง Bio Link สำเร็จแล้ว!", "สำเร็จ", "fa-wand-magic-sparkles");
}

function copyGeneratedUrl() {
    const copyText = document.getElementById("finalUrlText");
    if (!copyText) return;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value).then(() => {
            showAlert("คัดลอกลิงก์ Bio สำเร็จแล้ว!", "สำเร็จ", "fa-circle-check");
        });
    } else {
        fallbackCopyText(copyText);
    }
}

function fallbackCopyText(inputElement) {
    inputElement.focus();
    inputElement.select();
    inputElement.setSelectionRange(0, 9999);
    try { 
        document.execCommand('copy'); 
        showAlert("คัดลอกลิงก์ Bio สำเร็จแล้ว!", "สำเร็จ", "fa-circle-check"); 
    } catch (e) {}
}

function renderFullBioPageFromUrl(params) {
    let bioData = null;
    try {
        const hash = window.location.hash;
        if (hash.startsWith("#data=")) {
            bioData = JSON.parse(decodeURIComponent(hash.replace("#data=", "")));
        }
    } catch(e) { console.error(e); }

    if (bioData) {
        const homePage = document.getElementById("homePage");
        const topBanner = document.querySelector(".top-banner");
        if (homePage) homePage.style.display = "none";
        if (topBanner) topBanner.style.display = "none";
        
        const viewPage = document.getElementById("viewBioFullPage");
        if (viewPage) {
            viewPage.style.display = "flex";
            if (bioData.bg) viewPage.style.backgroundImage = `url('${bioData.bg}')`;
        }
        
        const displayAvatar = document.getElementById("displayAvatar");
        const displayName = document.getElementById("displayName");
        const displayCaption = document.getElementById("displayCaption");

        if (displayAvatar) displayAvatar.src = bioData.profile || "https://via.placeholder.com/150";
        if (displayName) displayName.innerText = bioData.name;
        if (displayCaption) displayCaption.innerText = bioData.caption || "";

        const displayBox = document.getElementById("displayContentBox");
        if (displayBox) displayBox.className = `bio-display-box ${bioData.align || 'align-center'}`;

        const displayLinks = document.getElementById("displayLinks");
        if (displayLinks) {
            displayLinks.innerHTML = "";

            const isIphoneGlass = bioData.isIphoneGlass !== false;
            const textColor = bioData.btnColor || '#ffffff';
            const radius = bioData.btnRadius || '20px';

            if (bioData.fb) addLinkBtn(displayLinks, '<i class="fa-brands fa-facebook"></i> Facebook', bioData.fb, textColor, radius, isIphoneGlass);
            if (bioData.ig) addLinkBtn(displayLinks, '<i class="fa-brands fa-instagram"></i> Instagram', bioData.ig, textColor, radius, isIphoneGlass);
            if (bioData.line) addLinkBtn(displayLinks, '<i class="fa-brands fa-line"></i> LINE', bioData.line, textColor, radius, isIphoneGlass);
            if (bioData.tiktok) addLinkBtn(displayLinks, '<i class="fa-brands fa-tiktok"></i> TikTok', bioData.tiktok, textColor, radius, isIphoneGlass);
        }

        if (bioData.music) {
            const mBox = document.getElementById("displayMusicBox");
            if (mBox) mBox.style.display = "block";
            fullAudio.src = bioData.music;
        }
    }
}

let builderElements = [];
let selectedElementId = null;
let builderCanvasBgColor = "#ffffff";
let builderCanvasBgUrl = "";

function openWebsiteBuilder() {
    const dropdownMenu = document.getElementById("dropdownMenu");
    const builderPage = document.getElementById("websiteBuilderPage");
    if (dropdownMenu) dropdownMenu.style.display = "none";
    if (builderPage) builderPage.style.display = "flex";
    applyCanvasBackground();
    renderCanvas();
}

function closeWebsiteBuilder() {
    const builderPage = document.getElementById("websiteBuilderPage");
    if (builderPage) builderPage.style.display = "none";
}

function setBuilderDevice(deviceType) {
    document.querySelectorAll(".device-btn").forEach(btn => btn.classList.remove("active"));
    if (event && event.currentTarget) event.currentTarget.classList.add("active");
    const canvas = document.getElementById("builderCanvas");
    if (canvas) canvas.className = `builder-canvas ${deviceType}`;
}

function addBuilderElement(type) {
    const id = 'el_' + Date.now();
    let newElement = {
        id: id,
        type: type,
        content: type === 'heading' ? 'หัวข้อเว็บไซต์ของคุณ' : (type === 'text' ? 'พิมพ์ข้อความรายละเอียดที่นี่...' : (type === 'image' ? 'https://via.placeholder.com/400x250?text=Upload+Image' : (type === 'button' || type === 'custom-link' ? 'กดไปที่ลิงก์' : 'รูปทรงตกแต่ง'))),
        url: (type === 'button' || type === 'custom-link') ? 'https://example.com' : '',
        color: '#0018F9',       /* เปลี่ยนสีเริ่มต้นรูปทรงเป็นสีน้ำเงิน */
        textColor: '#0018F9',   /* เปลี่ยนสีข้อความเริ่มต้น 4 ข้อความตั้งต้นเป็นสีน้ำเงิน */
        fontSize: type === 'heading' ? '28px' : '15px',
        align: 'center',
        x: 30,
        y: builderElements.length * 80 + 20,
        width: 220,
        height: 100,
        borderRadius: '8px',
        col1Content: 'ข้อความคอลัมน์ซ้าย',
        col2Content: 'ข้อความคอลัมน์ขวา'
    };
    builderElements.push(newElement);
    selectedElementId = id;
    renderCanvas();
    renderProperties();
}

function renderCanvas() {
    const canvas = document.getElementById("builderCanvas");
    const placeholder = document.getElementById("canvasPlaceholder");
    if (!canvas) return;
    
    canvas.querySelectorAll(".canvas-item").forEach(item => item.remove());

    if (builderElements.length === 0) {
        if (placeholder) placeholder.style.display = "block";
        return;
    } else {
        if (placeholder) placeholder.style.display = "none";
    }

    builderElements.forEach(el => {
        const div = document.createElement("div");
        div.className = `canvas-item ${el.id === selectedElementId ? 'selected' : ''}`;
        div.style.left = (el.x || 20) + 'px';
        div.style.top = (el.y || 20) + 'px';
        div.style.width = (el.width || 220) + 'px';
        div.style.height = (el.height || 100) + 'px';

        const startDrag = (clientX, clientY) => {
            selectedElementId = el.id;
            renderProperties();

            let lastX = clientX;
            let lastY = clientY;
            div.style.zIndex = '1000';

            const guideV = document.getElementById("guideLineV");
            const guideH = document.getElementById("guideLineH");
            const useSnap = document.getElementById("toggleSnapGrid")?.checked ?? true;

            const onMove = (moveX, moveY) => {
                let dx = moveX - lastX;
                let dy = moveY - lastY;

                lastX = moveX;
                lastY = moveY;

                el.x = (el.x || 20) + dx;
                el.y = (el.y || 20) + dy;

                if (el.x < 0) el.x = 0;
                if (el.y < 0) el.y = 0;

                if (useSnap) {
                    let snappedV = false;
                    let snappedH = false;
                    const canvasWidth = canvas.clientWidth;

                    let elCenterX = el.x + (el.width / 2);
                    if (Math.abs(elCenterX - (canvasWidth / 2)) < 8) {
                        el.x = (canvasWidth / 2) - (el.width / 2);
                        if (guideV) {
                            guideV.style.left = "50%";
                            guideV.style.display = "block";
                        }
                        snappedV = true;
                    }
                    if (!snappedV && guideV) guideV.style.display = "none";

                    let elCenterY = el.y + (el.height / 2);
                    if (Math.abs(elCenterY - 300) < 8) {
                        el.y = 300 - (el.height / 2);
                        if (guideH) {
                            guideH.style.top = "300px";
                            guideH.style.display = "block";
                        }
                        snappedH = true;
                    }
                    if (!snappedH && guideH) guideH.style.display = "none";
                } else {
                    if (guideV) guideV.style.display = "none";
                    if (guideH) guideH.style.display = "none";
                }

                div.style.left = el.x + 'px';
                div.style.top = el.y + 'px';
            };

            const onMouseMove = (e) => onMove(e.clientX, e.clientY);
            const onTouchMove = (e) => {
                if (e.touches && e.touches[0]) {
                    onMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            };

            const onEnd = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onEnd);
                
                const guideV = document.getElementById("guideLineV");
                const guideH = document.getElementById("guideLineH");
                if (guideV) guideV.style.display = "none";
                if (guideH) guideH.style.display = "none";

                div.style.zIndex = '';
                renderCanvas();
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onTouchMove, { passive: true });
            window.addEventListener('touchend', onEnd);
        };

        div.onmousedown = (e) => {
            if (e.target.closest('.item-actions') || e.target.closest('.resize-handle')) return;
            e.preventDefault();
            startDrag(e.clientX, e.clientY);
        };

        div.ontouchstart = (e) => {
            if (e.target.closest('.item-actions') || e.target.closest('.resize-handle')) return;
            if (e.touches && e.touches[0]) {
                startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        div.onclick = (e) => {
            e.stopPropagation();
            selectedElementId = el.id;
            renderCanvas();
            renderProperties();
        };

        const handle = document.createElement("div");
        handle.className = "resize-handle";
        handle.onmousedown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            let startW = el.width || 220;
            let startH = el.height || 100;
            let startX = e.clientX;
            let startY = e.clientY;

            const onResizeMove = (me) => {
                let dw = me.clientX - startX;
                let dh = me.clientY - startY;
                el.width = Math.max(80, startW + dw);
                el.height = Math.max(40, startH + dh);
                div.style.width = el.width + 'px';
                div.style.height = el.height + 'px';
            };

            const onResizeEnd = () => {
                window.removeEventListener('mousemove', onResizeMove);
                window.removeEventListener('mouseup', onResizeEnd);
                renderProperties();
            };

            window.addEventListener('mousemove', onResizeMove);
            window.addEventListener('mouseup', onResizeEnd);
        };

        div.innerHTML = `
            <div class="item-actions">
                <button class="item-act-btn" onclick="duplicateElement('${el.id}')" title="คัดลอก"><i class="fa-solid fa-copy"></i></button>
                <button class="item-act-btn" style="background:#ff4d4d;" onclick="deleteElement('${el.id}')" title="ลบ"><i class="fa-solid fa-trash"></i></button>
            </div>
            ${renderElementInnerHtml(el)}
        `;
        div.appendChild(handle);
        canvas.appendChild(div);
    });
}

function allowDrop(event) { event.preventDefault(); }
function dropElement(event) { event.preventDefault(); }

function renderElementInnerHtml(el) {
    let style = `color: ${el.textColor || '#0018F9'}; font-size: ${el.fontSize}; text-align: ${el.align}; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center;`;
    
    if (el.type === 'heading') {
        return `<h2 style="${style}; font-weight:700;">${el.content}</h2>`;
    } else if (el.type === 'text') {
        return `<p style="${style}">${el.content}</p>`;
    } else if (el.type === 'image') {
        return `<div style="text-align:${el.align}; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><img src="${el.content}" style="max-width:100%; max-height:100%; object-fit:cover; border-radius:6px;" alt="Image"></div>`;
    } else if (el.type === 'button') {
        return `<div style="text-align:${el.align}; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><a href="${el.url || '#'}" target="_blank" style="background:${el.color}; color:${el.textColor}; padding:8px 20px; border-radius:8px; font-weight:600; text-decoration:none; box-shadow:0 4px 10px rgba(0,0,0,0.15);">${el.content}</a></div>`;
    } else if (el.type === 'custom-link') {
        return `<div style="text-align:${el.align}; width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><a href="${el.url || '#'}" target="_blank" style="background:${el.color}; color:${el.textColor}; padding:10px 24px; border-radius:20px; font-weight:700; font-size:14px; text-decoration:none; box-shadow:0 4px 15px rgba(0,24,249,0.3);"><i class="fa-solid fa-link"></i> ${el.content}</a></div>`;
    } else if (el.type === 'row') {
        return `
            <div class="builder-row-container">
                <div class="builder-column" style="text-align:${el.align}; color:${el.textColor};">${el.col1Content}</div>
                <div class="builder-column" style="text-align:${el.align}; color:${el.textColor};">${el.col2Content}</div>
            </div>
        `;
    } else if (el.type.startsWith('shape-')) {
        let shapeStyle = `width: 100%; height: 100%; background-color: ${el.color}; display: flex; align-items: center; justify-content: center; color: ${el.textColor}; font-weight: 600; padding: 6px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.1);`;
        
        if (el.type === 'shape-rect' || el.type === 'shape-square') {
            shapeStyle += ` border-radius: 6px;`;
        } else if (el.type === 'shape-rounded') {
            shapeStyle += ` border-radius: 20px;`;
        } else if (el.type === 'shape-circle') {
            shapeStyle += ` border-radius: 50%;`;
        } else if (el.type === 'shape-triangle') {
            return `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;"><div style="width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 70px solid ${el.color}; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.15));" title="Triangle"></div></div>`;
        }

        return `<div style="${shapeStyle}">${el.content}</div>`;
    }

    return `<div>${el.content}</div>`;
}

function renderProperties() {
    const container = document.getElementById("propertiesContent");
    if (!container) return;

    if (!selectedElementId) {
        container.innerHTML = `<div style="color:#888; font-size:13px; text-align:center; padding-top:10px;">คลิกเลือกองค์ประกอบเพื่อแก้ไข</div>`;
        return;
    }

    const el = builderElements.find(item => item.id === selectedElementId);
    if (!el) return;

    let html = "";

    if (el.type === 'row') {
        html += `
            <div class="form-group-custom">
                <label>เนื้อหาคอลัมน์ซ้าย (Col 1)</label>
                <input type="text" class="input-custom" value="${el.col1Content}" oninput="updateSelectedElementProp('col1Content', this.value)">
            </div>
            <div class="form-group-custom">
                <label>เนื้อหาคอลัมน์ขวา (Col 2)</label>
                <input type="text" class="input-custom" value="${el.col2Content}" oninput="updateSelectedElementProp('col2Content', this.value)">
            </div>
        `;
    } else {
        html += `
            <div class="form-group-custom">
                <label>${el.type === 'image' ? 'ลิงก์รูปภาพ (URL)' : 'ข้อความในกล่อง / ปุ่ม'}</label>
                <input type="text" class="input-custom" value="${el.content}" oninput="updateSelectedElementProp('content', this.value)">
            </div>
        `;

        if (el.type === 'image') {
            html += `
                <div class="form-group-custom">
                    <label>อัปโหลดรูปภาพใหม่</label>
                    <input type="file" accept="image/*" class="input-custom" onchange="uploadImageForBuilder(this)">
                </div>
            `;
        }

        if (el.type === 'button' || el.type === 'custom-link') {
            html += `
                <div class="form-group-custom">
                    <label>ลิงก์ URL ปลายทาง</label>
                    <input type="url" class="input-custom" value="${el.url}" placeholder="https://..." oninput="updateSelectedElementProp('url', this.value)">
                </div>
            `;
        }

        html += `
            <div class="form-group-custom" style="display:flex; gap:8px;">
                <div style="flex:1;">
                    <label>ความกว้าง (Width)</label>
                    <input type="number" class="input-custom" value="${el.width}" oninput="updateSelectedElementProp('width', parseInt(this.value))">
                </div>
                <div style="flex:1;">
                    <label>ความสูง (Height)</label>
                    <input type="number" class="input-custom" value="${el.height}" oninput="updateSelectedElementProp('height', parseInt(this.value))">
                </div>
            </div>
        `;

        html += `
            <div class="form-group-custom" style="display:flex; gap:8px;">
                <div style="flex:1;">
                    <label>สีหลัก/พื้นหลัง</label>
                    <input type="color" class="input-custom" value="${el.color.startsWith('#') ? el.color : '#0018F9'}" style="height:36px; padding:2px;" onchange="updateSelectedElementProp('color', this.value)">
                </div>
                <div style="flex:1;">
                    <label>สีข้อความ</label>
                    <input type="color" class="input-custom" value="${el.textColor.startsWith('#') ? el.textColor : '#0018F9'}" style="height:36px; padding:2px;" onchange="updateSelectedElementProp('textColor', this.value)">
                </div>
            </div>
        `;
    }

    if (!el.type.startsWith('shape-') && el.type !== 'row') {
        html += `
            <div class="form-group-custom">
                <label>จัดตำแหน่ง</label>
                <select class="select-custom" onchange="updateSelectedElementProp('align', this.value)">
                    <option value="center" ${el.align==='center'?'selected':''}>กึ่งกลาง</option>
                    <option value="left" ${el.align==='left'?'selected':''}>ชิดซ้าย</option>
                    <option value="right" ${el.align==='right'?'selected':''}>ชิดขวา</option>
                </select>
            </div>
        `;
    }

    container.innerHTML = html;
}

function updateSelectedElementProp(propName, value) {
    const el = builderElements.find(item => item.id === selectedElementId);
    if (el) {
        el[propName] = value;
        renderCanvas();
    }
}

function deleteElement(id) {
    builderElements = builderElements.filter(item => item.id !== id);
    selectedElementId = null;
    renderCanvas();
    renderProperties();
}

function duplicateElement(id) {
    const el = builderElements.find(item => item.id === id);
    if (el) {
        const clone = JSON.parse(JSON.stringify(el));
        clone.id = 'el_' + Date.now();
        clone.x = (clone.x || 20) + 20;
        clone.y = (clone.y || 20) + 20;
        builderElements.push(clone);
        selectedElementId = clone.id;
        renderCanvas();
        renderProperties();
    }
}

function saveWebsiteBuilder() {
    const dataToSave = {
        elements: builderElements,
        bgColor: builderCanvasBgColor,
        bgUrl: builderCanvasBgUrl
    };
    localStorage.setItem("chinCodeWebsiteData", JSON.stringify(dataToSave));
    showAlert("บันทึกเว็บไซต์สำเร็จเรียบร้อย!", "สำเร็จ", "fa-floppy-disk");
}

function loadWebsiteBuilderData() {
    const saved = localStorage.getItem("chinCodeWebsiteData");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                builderElements = parsed;
            } else {
                builderElements = parsed.elements || [];
                builderCanvasBgColor = parsed.bgColor || "#ffffff";
                builderCanvasBgUrl = parsed.bgUrl || "";
            }
        } catch(e) {}
    }
}

function previewWebsiteBuilder() {
    const overlay = document.getElementById("websitePreviewOverlay");
    const container = document.getElementById("previewRenderContainer");
    if (!overlay || !container) return;

    container.innerHTML = "";
    if (builderCanvasBgUrl) {
        container.style.backgroundImage = `url('${builderCanvasBgUrl}')`;
        container.style.backgroundColor = "transparent";
    } else {
        container.style.backgroundImage = "none";
        container.style.backgroundColor = builderCanvasBgColor || "#ffffff";
    }

    builderElements.forEach(el => {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = (el.x || 20) + "px";
        div.style.top = (el.y || 20) + "px";
        div.style.width = (el.width || 220) + "px";
        div.style.height = (el.height || 100) + "px";
        div.innerHTML = renderElementInnerHtml(el);
        container.appendChild(div);
    });

    overlay.style.display = "flex";
}

function closeWebsitePreview() {
    const overlay = document.getElementById("websitePreviewOverlay");
    if (overlay) overlay.style.display = "none";
}

function generateWebsiteShareUrl() {
    if (builderElements.length === 0) {
        showAlert("กรุณาเพิ่มองค์ประกอบในเว็บไซต์อย่างน้อย 1 อย่างก่อนสร้างลิงก์", "แจ้งเตือน", "fa-circle-exclamation");
        return;
    }

    const payload = {
        elements: builderElements,
        bgColor: builderCanvasBgColor,
        bgUrl: builderCanvasBgUrl
    };

    const encodedData = encodeURIComponent(JSON.stringify(payload));
    const baseUrl = window.location.origin + window.location.pathname;
    const finalUrl = `${baseUrl}?web_data=true#data=${encodedData}`;

    const finalWebsiteUrlText = document.getElementById("finalWebsiteUrlText");
    const btnTestWebsiteOpen = document.getElementById("btnTestWebsiteOpen");
    const websiteShareModal = document.getElementById("websiteShareModal");

    if (finalWebsiteUrlText) finalWebsiteUrlText.value = finalUrl;
    if (btnTestWebsiteOpen) btnTestWebsiteOpen.href = finalUrl;
    if (websiteShareModal) websiteShareModal.classList.add("show");
}

function closeWebsiteShareModal() {
    const modal = document.getElementById("websiteShareModal");
    if (modal) modal.classList.remove("show");
}

function copyWebsiteShareUrl() {
    const copyText = document.getElementById("finalWebsiteUrlText");
    if (!copyText) return;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value).then(() => {
            showAlert("คัดลอกลิงก์เว็บไซต์สำเร็จแล้ว!", "สำเร็จ", "fa-circle-check");
        });
    } else {
        fallbackCopyText(copyText);
    }
}

function renderPublishedWebsiteFromUrl(params) {
    let payload = null;
    try {
        const hash = window.location.hash;
        if (hash.startsWith("#data=")) {
            payload = JSON.parse(decodeURIComponent(hash.replace("#data=", "")));
        } else if (hash.startsWith("#elements=")) {
            payload = { elements: JSON.parse(decodeURIComponent(hash.replace("#elements=", ""))), bgColor: "#ffffff", bgUrl: "" };
        }
    } catch(e) { console.error(e); }

    if (payload && payload.elements) {
        const homePage = document.getElementById("homePage");
        const topBanner = document.querySelector(".top-banner");
        if (homePage) homePage.style.display = "none";
        if (topBanner) topBanner.style.display = "none";

        const pubPage = document.getElementById("publishedWebsitePage");
        const container = document.getElementById("publishedContentContainer");
        if (pubPage) {
            pubPage.style.display = "block";
            if (payload.bgUrl) {
                pubPage.style.backgroundImage = `url('${payload.bgUrl}')`;
                pubPage.style.backgroundColor = "transparent";
            } else {
                pubPage.style.backgroundImage = "none";
                pubPage.style.backgroundColor = payload.bgColor || "#ffffff";
            }
        }
        if (container) {
            container.innerHTML = "";
            container.style.position = "relative";
            container.style.minHeight = "800px";

            payload.elements.forEach(el => {
                const div = document.createElement("div");
                div.style.position = "absolute";
                div.style.left = (el.x || 20) + "px";
                div.style.top = (el.y || 20) + "px";
                div.style.width = (el.width || 220) + "px";
                div.style.height = (el.height || 100) + "px";
                div.innerHTML = renderElementInnerHtml(el);
                container.appendChild(div);
            });
        }
    }
}

window.addEventListener("click", function(event) {
    const menu = document.getElementById("dropdownMenu");
    const btn = document.querySelector(".menu-toggle-btn");
    const productModal = document.getElementById("productModal");

    if (menu && btn && !menu.contains(event.target) && !btn.contains(event.target)) {
        menu.style.display = "none";
        const contactBox = document.getElementById("contactDropdown");
        const arrowIcon = document.getElementById("arrowIcon");
        if (contactBox) contactBox.style.display = "none";
        if (arrowIcon) arrowIcon.style.transform = "rotate(0deg)";
    }

    if (productModal && event.target === productModal) closeProductModal();
});
