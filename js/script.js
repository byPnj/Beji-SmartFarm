// Pastikan variabel 'auth' sudah tersedia dari script inline di HTML
// Jika auth tidak ada (inisialisasi gagal), jangan jalankan kode lainnya

if (typeof auth !== "undefined") {
  // --- Ambil Elemen DOM ---
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const googleSignInButton = document.querySelector(".google-signin-button");
  const googleSignUpButton = document.querySelector(".google-signup-button");
  const authErrorSignIn = document.getElementById("authErrorSignIn");
  const authErrorSignUp = document.getElementById("authErrorSignUp");
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");

  // --- Fungsi Tampilkan Error ---
  function showAuthError(message, targetElement) {
    if (targetElement) {
      targetElement.textContent = message;
      // Hapus pesan error setelah 5 detik
      setTimeout(() => {
        if (targetElement) targetElement.textContent = "";
      }, 5000);
    }
    console.error("Auth Error:", message);
  }

  // --- Clear Error saat ganti Tab ---
  function clearErrors() {
    if (authErrorSignIn) authErrorSignIn.textContent = "";
    if (authErrorSignUp) authErrorSignUp.textContent = "";
  }

  // --- Listener Status Autentikasi ---
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("User is logged in (onAuthStateChanged), redirecting...");
      // Tambahkan sedikit delay sebelum redirect agar user sempat lihat feedback jika perlu
      // setTimeout(() => {
      window.location.href = "home.html";
      // }, 500); // Delay 0.5 detik (opsional)
    } else {
      console.log("User is logged out (onAuthStateChanged).");
      // Pastikan form bisa digunakan
    }
  });

  // --- Handle Sign Up ---
  if (signUpForm) {
    signUpForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();
      const email = document.getElementById("signUpEmail").value;
      const password = document.getElementById("signUpPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (password !== confirmPassword) {
        showAuthError(
          "Password dan konfirmasi password tidak cocok.",
          authErrorSignUp
        );
        return;
      }
      if (password.length < 6) {
        showAuthError("Password minimal harus 6 karakter.", authErrorSignUp);
        return;
      }

      console.log("Attempting Sign Up...");
      auth
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("Sign up successful:", userCredential.user);
          // Redirect ditangani oleh onAuthStateChanged
        })
        .catch((error) => {
          console.error("Sign up error:", error);
          showAuthError(error.message, authErrorSignUp);
        });
    });
  } else {
    console.error("Sign Up Form (#signUpForm) not found!");
  }

  // --- Handle Sign In ---
  if (signInForm) {
    signInForm.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors();
      const email = document.getElementById("signInEmail").value;
      const password = document.getElementById("signInPassword").value;

      console.log("Attempting Sign In...");
      auth
        .signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          console.log("Sign in successful:", userCredential.user);
          // Redirect ditangani oleh onAuthStateChanged
        })
        .catch((error) => {
          console.error("Sign in error:", error);
          showAuthError(error.message, authErrorSignIn);
        });
    });
  } else {
    console.error("Sign In Form (#signInForm) not found!");
  }

  // --- Handle Google Sign In / Sign Up ---
  function handleGoogleAuth() {
    clearErrors();
    const provider = new firebase.auth.GoogleAuthProvider();
    console.log("Attempting Google Sign In...");
    auth
      .signInWithPopup(provider)
      .then((result) => {
        console.log("Google Sign-In successful:", result.user);
        // Redirect ditangani oleh onAuthStateChanged
      })
      .catch((error) => {
        console.error("Google Sign-In error:", error);
        // Tampilkan error di tab yang sedang aktif
        const activeErrorElement = document.querySelector(
          ".tab-content.active .error-message"
        );
        showAuthError(
          `Google Sign-In Error: ${error.message}`,
          activeErrorElement || authErrorSignIn
        );
      });
  }

  if (googleSignInButton) {
    googleSignInButton.addEventListener("click", handleGoogleAuth);
  } else {
    console.warn("Google Sign In button not found");
  }
  if (googleSignUpButton) {
    googleSignUpButton.addEventListener("click", handleGoogleAuth);
  } else {
    console.warn("Google Sign Up button not found");
  }

  // --- Fungsi Toggle Password Visibility ---
  window.togglePasswordVisibility = function (inputId, spanElement) {
    // Jadikan global agar bisa dipanggil dari onclick
    const passwordInput = document.getElementById(inputId);
    const icon = spanElement.querySelector("i");
    if (!passwordInput || !icon) return;

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  };

  // --- Fungsi Tab Switching ---
  window.openTab = function (event, tabName) {
    // Jadikan global agar bisa dipanggil dari onclick
    clearErrors(); // Hapus error saat ganti tab

    tabContents.forEach((content) => {
      content.style.display = "none";
      content.classList.remove("active");
    });
    tabLinks.forEach((link) => {
      link.classList.remove("active");
    });

    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.style.display = "block";
      // Tambah sedikit delay untuk animasi
      setTimeout(() => selectedTab.classList.add("active"), 10);
    }
    if (event && event.currentTarget) {
      event.currentTarget.classList.add("active");
    }
  };

  // --- Set Tab Awal ---
  document.addEventListener("DOMContentLoaded", () => {
    // Pastikan tab sign in aktif saat halaman pertama kali dimuat
    const signInTabContent = document.getElementById("signIn");
    const signInTabLink = document.querySelector(
      '.tab-link[onclick*="signIn"]'
    );

    // Sembunyikan semua dulu
    tabContents.forEach((content) => (content.style.display = "none"));
    tabLinks.forEach((link) => link.classList.remove("active"));

    // Tampilkan & aktifkan Sign In
    if (signInTabContent) signInTabContent.style.display = "block";
    if (signInTabContent) signInTabContent.classList.add("active");
    if (signInTabLink) signInTabLink.classList.add("active");

    console.log("Login page script initialized.");
  });
} else {
  console.error(
    "Firebase Auth object is not available. Authentication features will not work."
  );
  // Mungkin tampilkan pesan error di UI juga jika auth gagal dimuat
  const errorElement =
    document.getElementById("authErrorSignIn") ||
    document.getElementById("authErrorSignUp");
  if (errorElement) {
    errorElement.textContent = "Gagal memuat layanan autentikasi.";
  }
}
