// monitoring-script.js
// Pastikan variabel 'auth' dan 'database' sudah tersedia dari script inline di HTML

// --- Variabel Global untuk Elemen UI ---
let motorStateValue,
  tdsLevelGauge,
  phLevelGauge,
  batteryLevelGauge,
  lastUpdatedElement,
  refreshButton;

let currentPlantDisplay,
  settingsForm,
  plantTypeInput,
  tdsTargetAtasInput,
  tdsBatasBawahInput,
  settingsMessage;

// --- Variabel Global untuk Listener DB ---
let dbListenerRef = null;
let isDbListenerAttached = false;
// =============================================
// --- PATH DATA DI REALTIME DATABASE ---
// --- SESUAIKAN DENGAN PATH ANDA! ---
const DB_PATH = "sensorData/latest";
// =============================================

// --- Event Listener: Tunggu DOM siap sebelum ambil elemen & cek auth ---
document.addEventListener("DOMContentLoaded", () => {
  // Ambil elemen setelah DOM siap
  tdsLevelGauge = document.getElementById("tdsLevelGauge");
  phLevelGauge = document.getElementById("phLevelGauge");
  //batteryLevelGauge = document.getElementById("batteryLevelGauge");
  lastUpdatedElement = document.getElementById("lastUpdated");
  refreshButton = document.getElementById("refreshButton");
  //motorStateValue = document.getElementById("motorStateValue"); // Ambil elemen motor state

  currentPlantDisplay = document.getElementById("currentPlantDisplay");
  settingsForm = document.getElementById("settingsForm");
  // ... (ambil elemen form settings lainnya) ...
  plantTypeInput = document.getElementById("plantTypeInput");
  tdsTargetAtasInput = document.getElementById("tdsTargetAtasInput");
  tdsBatasBawahInput = document.getElementById("tdsBatasBawahInput");
  settingsMessage = document.getElementById("settingsMessage");

  initializeAuthCheck();
});

// --- Fungsi Helper ---

/**
 * Memperbarui tampilan Gauge (Visual dan Teks).
 * @param {HTMLElement} gaugeElement - Elemen div .gauge.
 * @param {number|null} rawValue - Nilai mentah dari sensor (null jika tidak valid/ada).
 * @param {string} unit - Satuan yang akan ditampilkan (mis: '%', 'ppm', '').
 * @param {number} minRange - Nilai minimum untuk skala visual gauge (0-100%).
 * @param {number} maxRange - Nilai maksimum untuk skala visual gauge (0-100%).
 * @param {string|null} color - Warna CSS untuk gauge fill.
 * @param {number} decimalPlaces - Jumlah angka di belakang koma untuk tampilan nilai (default 0).
 */
function updateGauge(
  gaugeElement,
  rawValue,
  unit = "%",
  minRange = 0,
  maxRange = 100,
  color = null,
  decimalPlaces = 0
) {
  if (!gaugeElement) return; // Keluar jika elemen belum siap

  const valueElement = gaugeElement.querySelector(".gauge-value");
  let displayValue = "-"; // Default jika nilai tidak valid
  let percentage = 0; // Default percentage
  let gaugeColor = color || "#e9ecef"; // Warna default abu-abu

  if (rawValue !== null && typeof rawValue === "number" && !isNaN(rawValue)) {
    // Hitung persentase untuk visualisasi gauge (0-100)
    if (maxRange > minRange) {
      percentage = ((rawValue - minRange) / (maxRange - minRange)) * 100;
      percentage = Math.max(0, Math.min(100, percentage)); // Clamp 0-100
    }
    // Format nilai yang akan ditampilkan
    displayValue = rawValue.toFixed(decimalPlaces);
  } else {
    gaugeColor = "#e9ecef"; // Jika data tidak valid, set warna ke abu-abu
  }

  // Update nilai teks (angka + satuan)
  if (valueElement) {
    valueElement.textContent = `${displayValue}${unit ? " " + unit : ""}`;
  }

  // Update variabel CSS --percentage untuk conic-gradient
  gaugeElement.style.setProperty("--percentage", percentage);
  // Update warna gauge
  gaugeElement.style.setProperty("--gauge-color", gaugeColor);
}

// Fungsi untuk memperbarui waktu terakhir update
function updateTimestamp(firebaseTimestamp = null) {
  if (!lastUpdatedElement) return;
  try {
    const now = firebaseTimestamp ? new Date(firebaseTimestamp) : new Date();
    if (isNaN(now.getTime())) {
      lastUpdatedElement.textContent = "Waktu tidak valid";
      return;
    }
    const timeString = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const dateString = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    lastUpdatedElement.textContent = `${timeString} - ${dateString}`;
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    lastUpdatedElement.textContent = "Error waktu";
  }
}

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

// Fungsi untuk setup tombol refresh
function setupRefreshButton() {
  if (refreshButton) {
    // Hapus listener lama jika ada
    const newRefreshBtn = refreshButton.cloneNode(true);
    refreshButton.parentNode.replaceChild(newRefreshBtn, refreshButton);
    // Tambahkan listener baru
    newRefreshBtn.addEventListener("click", handleRefreshClick);
    console.log("Refresh button event listener ready.");
  } else {
    console.warn("Refresh button not found.");
  }
}

// Fungsi untuk handle klik refresh
function handleRefreshClick() {
  console.log("Refresh button clicked.");
  if (!isDbListenerAttached) {
    console.log(
      "Listener is not attached, attempting to initialize monitoring."
    );
    initializeMonitoring(); // Coba pasang jika belum terpasang
  } else {
    console.log("Detaching and re-attaching database listener...");
    if (lastUpdatedElement) lastUpdatedElement.textContent = "Memuat ulang...";
    detachDbListener();
    // Beri jeda sedikit (opsional)
    setTimeout(() => {
      initializeMonitoring();
    }, 100);
  }
}

// --- Fungsi BARU untuk Update Tampilan Status Motor ---
/*
function updateMotorStateDisplay(state) {
  if (motorStateValue) {
    const stateText = String(state).toUpperCase();
    motorStateValue.textContent = stateText;
    if (stateText === "ON") {
      motorStateValue.classList.remove("state-off");
      motorStateValue.classList.add("state-on");
    } else {
      motorStateValue.classList.remove("state-on");
      motorStateValue.classList.add("state-off");
    }
  }
}*/

// --- Fungsi Utama Inisialisasi Monitoring (Pasang Listener DB) ---
function initializeMonitoring() {
  if (typeof database === "undefined" || !database) {
    console.error("Firebase database object is not available.");
    if (lastUpdatedElement)
      lastUpdatedElement.textContent = "Error: Database tidak terhubung.";
    return;
  }
  if (isDbListenerAttached) return; // Jangan pasang listener ganda

  dbListenerRef = database.ref(DB_PATH);
  console.log(`Attaching database listener to: ${DB_PATH}`);
  if (lastUpdatedElement) lastUpdatedElement.textContent = "Menghubungkan...";

  // --- Listener Utama untuk Data Realtime ---
  dbListenerRef.on(
    "value",
    (snapshot) => {
      console.log("Data received/updated:", snapshot.val());
      const data = snapshot.val();

      if (data && typeof data === "object") {
        // updateGauge(element, rawValue, unit, minRange, maxRange, color, decimalPlaces);
        /*
        updateGauge(
          waterLevelGauge,
          data.waterLevel,
          "%",
          0,
          100,
          "#007bff",
          0
        );
        updateGauge(
          batteryLevelGauge,
          data.batteryLevel,
          "%",
          0,
          100,
          "#fd7e14",
          0
        );*/
        updateGauge(tdsLevelGauge, data.tdsLevel, "ppm", 0, 1000, "#28a745", 0); // Sesuaikan maxRange (1000?)
        updateGauge(phLevelGauge, data.phLevel, "", 0, 14, "#dc3545", 1); // 1 desimal untuk pH
        updateTimestamp(data.timestamp);
      } else {
        console.warn(
          `No valid data found at path: ${DB_PATH}. Snapshot:`,
          snapshot.val()
        );
        if (lastUpdatedElement)
          lastUpdatedElement.textContent = "Data tidak valid/kosong.";
        // Set gauge ke default/kosong
        updateGauge(waterLevelGauge, null, "%", 0, 100);
        updateGauge(batteryLevelGauge, null, "%", 0, 100);
        updateGauge(tdsLevelGauge, null, "ppm", 0, 1000);
        updateGauge(phLevelGauge, null, "", 0, 14);
        updateTimestamp(); // Tampilkan waktu saat ini jika data timestamp tidak ada
      }
    },
    (error) => {
      console.error(`Firebase RTDB read failed at ${DB_PATH}:`, error);
      if (lastUpdatedElement)
        lastUpdatedElement.textContent = `Error DB: ${error.code}`;
      // Set gauge ke default/error
      updateGauge(waterLevelGauge, null, "%", 0, 100);
      updateGauge(batteryLevelGauge, null, "%", 0, 100);
      updateGauge(tdsLevelGauge, null, "ppm", 0, 1000);
      updateGauge(phLevelGauge, null, "", 0, 14);
      isDbListenerAttached = false; // Anggap listener lepas jika ada error permission dll.
    }
  );
  isDbListenerAttached = true;
}

// Fungsi untuk melepas listener database
function detachDbListener() {
  if (dbListenerRef && isDbListenerAttached) {
    dbListenerRef.off("value");
    isDbListenerAttached = false;
    console.log("Database listener detached.");
  }
}

// --- Logika Utama Pengecekan Autentikasi ---
function initializeAuthCheck() {
  // Pastikan 'auth' sudah ada dan merupakan objek
  if (typeof auth !== "undefined" && auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // Pengguna sudah login
        console.log(
          `User ${user.email} is logged in. Initializing monitoring page...`
        );
        setupLogoutButton();
        setupRefreshButton(); // Setup tombol refresh juga
        initializeMonitoring(); // Mulai mendengarkan data database
      } else {
        // Pengguna TIDAK login
        console.log("User is not logged in, redirecting to index.html");
        detachDbListener();
        window.location.replace("index.html"); // Redirect ke login
      }
    });
  } else {
    console.error(
      "Firebase auth object is not defined. Cannot check authentication state."
    );
    if (lastUpdatedElement)
      lastUpdatedElement.textContent = "Error: Autentikasi gagal dimuat.";
    // Mungkin paksa redirect ke login jika auth gagal total
    // setTimeout(() => { window.location.replace('index.html'); }, 2000);
  }
}

// Catatan: Pemanggilan initializeAuthCheck() dilakukan di dalam event listener DOMContentLoaded
