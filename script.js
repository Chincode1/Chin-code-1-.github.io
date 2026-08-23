// 📍 API Key ของ ImgBB
const IMGBB_API_KEY = "c043b00fe27b1322e754c9752bbcb5c6";

const adImagesList = [
    "https://cdn.phototourl.com/free/2026-08-18-8aac3d24-5fb6-4ca9-af05-f0e72fb5cd20.jpg",
    "https://cdn.phototourl.com/free/2026-08-18-9af73a5b-aed4-479d-b2c4-3a8bfffa1400.png",
    "https://cdn.phototourl.com/free/2026-08-18-0b8770d4-c147-4547-a3e8-1d3945bd83c1.jpg"
];

let currentAdIndex = 0;

// ⚡ ระบบ Alert แบบเท่ๆ (Custom Alert)
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
    if (alertOverlay) {
        alertOverlay.classList.remove("show");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("bio_name")) {
        renderFullBioPageFromUrl(urlParams);
        return;
    }

    const strip = document.getElementById("logoPatternStrip");
    const logoUrl = "https://cdn.phototourl.com/free/2026-08-18-2b12c8b4-e50b-4169-b89b-580dbde96f9b.png";
    const screenWidth = window.innerWidth;
    const logoCount = screenWidth < 768 ? 12 : 25; 

    for (let i = 0; i < logoCount; i++) {
        const img = document.createElement("img");
        img.src = logoUrl;
        img.alt = "Mini Logo";
        img.className = "mini-logo";
        strip.appendChild(img);
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
});

// ⚡ ฟังก์ชันสำหรับย่อขนาดรูปภาพก่อนอัปโหลด (ช่วยให้อัปโหลดเร็วขึ้นมากๆ)
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

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, "image/jpeg", quality);
            };
        };
    });
}

// ⚡ ฟังก์ชันสำหรับอัปโหลดรูปภาพไปฝากไว้ที่ ImgBB (มีระบบย่อรูป)
async function uploadImageToImgBB(fileInputId, hiddenUrlInputId) {
    const fileInput = document.getElementById(fileInputId);
    const hiddenInput = document.getElementById(hiddenUrlInputId);
    const statusSpan = document.getElementById(fileInputId === 'fileProfile' ? 'statusProfile' : 'statusBg');

    if (!fileInput.files[0]) return;

    if (!IMGBB_API_KEY) {
        showAlert("กรุณาใส่ API Key ของ ImgBB ก่อนครับ!", "คำเตือน", "fa-triangle-exclamation");
        return;
    }

    statusSpan.innerText = "⏳ กำลังประมวลผลรูปภาพ...";

    try {
        const compressedBlob = await compressImage(fileInput.files[0], 800, 0.7);

        const formData = new FormData();
        formData.append("image", compressedBlob, "upload.jpg");

        statusSpan.innerText = "⏳ กำลังอัปโหลดรูป...";

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            hiddenInput.value = result.data.url;
            statusSpan.innerText = "✅ อัปโหลดรูปสำเร็จ!";
            showAlert("อัปโหลดรูปภาพเรียบร้อยแล้ว!", "สำเร็จ", "fa-circle-check");
            updatePreview();
        } else {
            statusSpan.innerText = "❌ อัปโหลดไม่สำเร็จ";
            showAlert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ", "ผิดพลาด", "fa-circle-xmark");
        }
    } catch (error) {
        console.error(error);
        statusSpan.innerText = "❌ ไม่สามารถเชื่อมต่อระบบฝากรูปได้";
        showAlert("ไม่สามารถเชื่อมต่อระบบฝากรูปได้", "ผิดพลาด", "fa-wifi");
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
    document.getElementById("modalProductImg").src = imgSrc;
    document.getElementById("modalProductPrice").innerText = price;
    document.getElementById("modalProductDesc").innerText = desc;
    if (modal) modal.classList.add("show");
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.remove("show");
}

function toggleMenu() {
    const menu = document.getElementById("dropdownMenu");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function toggleContact(event) {
    event.stopPropagation();
    const contactBox = document.getElementById("contactDropdown");
    const arrowIcon = document.getElementById("arrowIcon");

    if (contactBox.style.display === "block") {
        contactBox.style.display = "none";
        arrowIcon.style.transform = "rotate(0deg)";
    } else {
        contactBox.style.display = "block";
        arrowIcon.style.transform = "rotate(180deg)";
    }
}

function openBioPage() {
    document.getElementById("dropdownMenu").style.display = "none";
    document.getElementById("bioPage").style.display = "block";
}

function closeBioPage() {
    document.getElementById("bioPage").style.display = "none";
}

function updatePreview() {
    const name = document.getElementById("inputName").value || "ชื่อของคุณ";
    const profileUrl = document.getElementById("inputProfileUrl").value || "https://via.placeholder.com/150?text=Profile";
    const bgUrl = document.getElementById("inputBgUrl").value;

    document.getElementById("previewName").innerText = name;
    document.getElementById("previewAvatar").src = profileUrl;

    const previewScreen = document.getElementById("previewScreen");
    if (bgUrl) {
        previewScreen.style.backgroundImage = `url('${bgUrl}')`;
    } else {
        previewScreen.style.backgroundImage = "none";
    }

    const linksContainer = document.getElementById("previewLinksContainer");
    linksContainer.innerHTML = "";

    const fb = document.getElementById("inputFb").value;
    const ig = document.getElementById("inputIg").value;
    const line = document.getElementById("inputLine").value;
    const tiktok = document.getElementById("inputTiktok").value;

    if (fb) addPreviewLinkBtn(linksContainer, '<i class="fa-brands fa-facebook"></i> Facebook', fb);
    if (ig) addPreviewLinkBtn(linksContainer, '<i class="fa-brands fa-instagram"></i> Instagram', ig);
    if (line) addPreviewLinkBtn(linksContainer, '<i class="fa-brands fa-line"></i> LINE', line);
    if (tiktok) addPreviewLinkBtn(linksContainer, '<i class="fa-brands fa-tiktok"></i> TikTok', tiktok);

    if (!fb && !ig && !line && !tiktok) {
        linksContainer.innerHTML = '<div style="color:rgba(255,255,255,0.7); font-size:12px; text-align:center;">(เพิ่มลิงก์ปุ่มจะแสดงที่นี่)</div>';
    }
}

function addPreviewLinkBtn(container, htmlText, url) {
    const a = document.createElement("a");
    a.className = "preview-link-btn";
    a.href = url;
    a.target = "_blank";
    a.innerHTML = htmlText;
    container.appendChild(a);
}

function generateLink() {
    const name = document.getElementById("inputName").value;
    if (!name) {
        showAlert("กรุณากรอกชื่อโปรไฟล์ของคุณด้วยนะครับ", "ข้อมูลไม่ครบ", "fa-user-pen");
        return;
    }

    const data = {
        name: name,
        profile: document.getElementById("inputProfileUrl").value,
        bg: document.getElementById("inputBgUrl").value,
        fb: document.getElementById("inputFb").value,
        ig: document.getElementById("inputIg").value,
        line: document.getElementById("inputLine").value,
        tiktok: document.getElementById("inputTiktok").value
    };

    const encodedData = encodeURIComponent(JSON.stringify(data));
    const baseUrl = window.location.origin + window.location.pathname;
    const finalUrl = `${baseUrl}?bio_name=${encodeURIComponent(name)}#data=${encodedData}`;

    document.getElementById("finalUrlText").value = finalUrl;
    document.getElementById("btnTestOpen").href = finalUrl;
    document.getElementById("generatedResult").style.display = "block";
    showAlert("สร้าง Bio Link สำเร็จแล้ว!", "สำเร็จ", "fa-wand-magic-sparkles");
}

function copyGeneratedUrl() {
    const copyText = document.getElementById("finalUrlText");
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(copyText.value).then(() => {
            showAlert("คัดลอกลิงก์ Bio สำเร็จแล้ว!", "สำเร็จ", "fa-circle-check");
        }).catch(() => {
            fallbackCopyText(copyText);
        });
    } else {
        fallbackCopyText(copyText);
    }
}

function fallbackCopyText(inputElement) {
    inputElement.focus();
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        showAlert("คัดลอกลิงก์ Bio สำเร็จแล้ว!", "สำเร็จ", "fa-circle-check");
    } catch (err) {
        showAlert("กรุณากดค้างที่กล่องข้อความแล้วเลือก 'คัดลอก' (Copy)", "แจ้งเตือน", "fa-copy");
    }
}

function renderFullBioPageFromUrl(params) {
    let bioData = null;
    try {
        const hash = window.location.hash;
        if (hash.startsWith("#data=")) {
            const jsonStr = decodeURIComponent(hash.replace("#data=", ""));
            bioData = JSON.parse(jsonStr);
        }
    } catch(e) { console.error(e); }

    if (bioData) {
        document.getElementById("homePage").style.display = "none";
        document.querySelector(".top-banner").style.display = "none";
        
        const viewPage = document.getElementById("viewBioFullPage");
        viewPage.style.display = "flex";
        if (bioData.bg) viewPage.style.backgroundImage = `url('${bioData.bg}')`;
        
        document.getElementById("displayAvatar").src = bioData.profile || "https://via.placeholder.com/150";
        document.getElementById("displayName").innerText = bioData.name;

        const displayLinks = document.getElementById("displayLinks");
        displayLinks.innerHTML = "";

        if (bioData.fb) addPreviewLinkBtn(displayLinks, '<i class="fa-brands fa-facebook"></i> Facebook', bioData.fb);
        if (bioData.ig) addPreviewLinkBtn(displayLinks, '<i class="fa-brands fa-instagram"></i> Instagram', bioData.ig);
        if (bioData.line) addPreviewLinkBtn(displayLinks, '<i class="fa-brands fa-line"></i> LINE', bioData.line);
        if (bioData.tiktok) addPreviewLinkBtn(displayLinks, '<i class="fa-brands fa-tiktok"></i> TikTok', bioData.tiktok);
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

    if (event.target === productModal) closeProductModal();
});
