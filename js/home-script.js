// home-script.js - Logika untuk Carousel

let currentSlideIndex = 0;
const slides = document.querySelectorAll(".carousel-item");
const indicators = document.querySelectorAll(".indicator");
const totalSlides = slides.length;

function showSlide(index) {
  // Tangani batas index
  if (index >= totalSlides) {
    currentSlideIndex = 0;
  } else if (index < 0) {
    currentSlideIndex = totalSlides - 1;
  } else {
    currentSlideIndex = index;
  }

  // Sembunyikan semua slide
  slides.forEach((slide) => {
    slide.classList.remove("active");
  });

  // Nonaktifkan semua indikator
  indicators.forEach((indicator) => {
    indicator.classList.remove("active");
  });

  // Tampilkan slide dan indikator yang sesuai
  if (slides[currentSlideIndex]) {
    slides[currentSlideIndex].classList.add("active");
  }
  if (indicators[currentSlideIndex]) {
    indicators[currentSlideIndex].classList.add("active");
  }
}

// Fungsi untuk tombol next/prev
function changeSlide(n) {
  showSlide(currentSlideIndex + n);
}

// Fungsi untuk klik indikator
function currentSlide(n) {
  showSlide(n);
}

// Inisialisasi carousel
document.addEventListener("DOMContentLoaded", () => {
  if (slides.length > 0) {
    showSlide(currentSlideIndex); // Tampilkan slide pertama saat load

    // Opsional: Otomatis ganti slide setiap beberapa detik
    // setInterval(() => {
    //    changeSlide(1);
    // }, 5000); // Ganti slide setiap 5 detik
  }
});

// Fungsi untuk setup tombol logout
function setupLogoutButton() {
  if (typeof auth === "undefined" || !auth) return;
  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.style.cursor = "pointer";
    // Hapus listener lama jika ada
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    // Tambahkan listener baru
    newLogoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Logout button clicked. Signing out...");
      auth.signOut().catch((error) => {
        console.error("Sign out error:", error);
        alert("Gagal logout: " + error.message);
      });
    });
    console.log("Logout button event listener ready.");
  } else {
    console.warn("Logout button not found.");
  }
}
