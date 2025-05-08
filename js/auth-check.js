// Pastikan firebase dan auth sudah diinisialisasi dari blok script di HTML

auth.onAuthStateChanged((user) => {
  if (user) {
    // Pengguna sudah login, izinkan akses ke halaman ini
    console.log("User is logged in on protected page:", user.email); // Tampilkan email user (opsional)

    // --- INISIALISASI KONTEN HALAMAN SETELAH USER TERAUTENTIKASI ---
    // Panggil fungsi-fungsi untuk memuat konten halaman ini (misal, carousel, gauge)
    initializePageContent(user); // Buat fungsi ini jika perlu
  } else {
    // Pengguna TIDAK login, arahkan kembali ke halaman login
    console.log("User is not logged in, redirecting to index.html");
    window.location.href = "index.html";
  }
});

// Fungsi untuk menginisialisasi konten halaman (Contoh)
function initializePageContent(loggedInUser) {
  console.log(
    `Initializing content for ${window.location.pathname} for user ${loggedInUser.email}`
  );
  // Panggil fungsi spesifik halaman:
  if (document.querySelector(".carousel")) {
    // Cek jika ini halaman home
    // Panggil fungsi init carousel dari home-script.js
    if (typeof showSlide === "function") showSlide(currentSlideIndex);
  }
  if (document.querySelector(".sensor-grid")) {
    // Cek jika ini halaman monitoring
    // Panggil fungsi fetch data dari monitoring-script.js
    if (typeof fetchData === "function") fetchData();
  }

  // Tambahkan fungsi logout jika perlu
  setupLogoutButton(loggedInUser); // Panggil fungsi setup logout
}

// --- Fungsi Logout (Bisa ditempatkan di script bersama) ---
function setupLogoutButton(user) {
  // Cari tombol logout (misal ikon di navbar)
  // Ganti selector jika perlu
  const logoutButton = document
    .querySelector('.bottom-nav a[href="#"] i.fa-sign-out-alt')
    ?.closest("a");

  if (logoutButton) {
    logoutButton.style.cursor = "pointer"; // Tunjukkan bisa diklik
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault(); // Mencegah navigasi href="#"
      auth
        .signOut()
        .then(() => {
          console.log("User signed out successfully.");
          // Redirect ke login akan ditangani oleh onAuthStateChanged di halaman berikutnya
        })
        .catch((error) => {
          console.error("Sign out error:", error);
        });
    });
  } else {
    console.warn("Logout button/icon not found.");
  }
  // Opsional: Tampilkan email user di suatu tempat
  // const userDisplay = document.getElementById('userEmailDisplay');
  // if(userDisplay) userDisplay.textContent = user.email;
}

// --- (Sisa kode spesifik halaman home-script.js atau monitoring-script.js) ---
// Pastikan kode utama halaman (carousel, gauge update) dipanggil DARI DALAM
// onAuthStateChanged atau fungsi initializePageContent agar hanya berjalan
// setelah user terverifikasi.
// ...
