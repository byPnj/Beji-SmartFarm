// history-script.js - Versi dengan Data Contoh (Tanpa Firebase)

// --- Referensi Elemen DOM ---
let historyMessage, historyTableBody, historyDateRange, chartCanvas;
let sensorChart = null; // Variabel untuk instance Chart.js

// --- Fungsi Helper ---
function setHistoryMessage(message, isError = false) {
  if (historyMessage) {
    historyMessage.textContent = message;
    historyMessage.style.color = isError ? "var(--error-color)" : "#666";
    historyMessage.style.display = message ? "block" : "none"; // Sembunyikan jika pesan kosong
  }
}

// --- Fungsi Membuat Data Contoh ---
/**
 * Menghasilkan data contoh rata-rata harian sensor.
 * @param {number} numDays Jumlah hari ke belakang.
 * @returns {Array<object>} Array objek data harian.
 */
function generateDummyHistoryData(numDays) {
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Mulai dari awal hari

  for (let i = 0; i < numDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i); // Mundur i hari
    const dateStr = date.toISOString().split("T")[0]; // Format YYYY-MM-DD

    // Buat nilai acak yang 'masuk akal'
    const avgWater = 70 + Math.random() * 20 - 10; // Sekitar 60-80%
    const avgBattery = 85 + Math.random() * 20 - 15; // Sekitar 70-95%
    const avgTds = 400 + Math.random() * 200 - 50; // Sekitar 350-550 ppm
    const avgPh = 6.0 + Math.random() * 1.5 - 0.5; // Sekitar 5.5-7.0 pH

    data.push({
      date: dateStr,
      dateObj: date, // Simpan objek Date
      avgWater: parseFloat(avgWater.toFixed(1)), // 1 desimal
      avgBattery: parseFloat(avgBattery.toFixed(0)), // Bulat
      avgTds: parseFloat(avgTds.toFixed(0)), // Bulat
      avgPh: parseFloat(avgPh.toFixed(1)), // 1 desimal
    });
  }
  // Data tergenerate dari hari ini ke belakang, perlu dibalik agar urut dari lama ke baru
  return data.reverse();
}

// --- Fungsi untuk Menampilkan Grafik (Chart.js) ---
function displayChart(data) {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext("2d");

  if (sensorChart) {
    sensorChart.destroy(); // Hancurkan chart lama
  }

  const labels = data.map((item) => item.dateObj); // Gunakan objek Date untuk sumbu waktu
  const waterData = data.map((item) => item.avgWater);
  const batteryData = data.map((item) => item.avgBattery);
  const tdsData = data.map((item) => item.avgTds);
  const phData = data.map((item) => item.avgPh);

  sensorChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Water Level (%)",
          data: waterData,
          borderColor: "rgba(0, 123, 255, 1)",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.1,
          spanGaps: true,
        },
        {
          label: "Battery Level (%)",
          data: batteryData,
          borderColor: "rgba(253, 126, 20, 1)",
          backgroundColor: "rgba(253, 126, 20, 0.1)",
          tension: 0.1,
          spanGaps: true,
        },
        {
          label: "TDS Level (ppm)",
          data: tdsData,
          borderColor: "rgba(40, 167, 69, 1)",
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.1,
          spanGaps: true,
        },
        {
          label: "pH Level",
          data: phData,
          borderColor: "rgba(220, 53, 69, 1)",
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.1,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "dd MMM yyyy",
            displayFormats: { day: "dd/MM" },
          },
          title: { display: true, text: "Tanggal" },
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: "Nilai Rata-rata Harian" },
        },
      },
      plugins: {
        tooltip: { mode: "index", intersect: false },
        legend: { position: "top" },
      },
      interaction: { mode: "nearest", axis: "x", intersect: false },
    },
  });
}

// --- Fungsi untuk Menampilkan Tabel ---
function displayTable(data) {
  if (!historyTableBody) return;
  historyTableBody.innerHTML = ""; // Kosongkan tabel

  if (data.length === 0) return; // Jangan lakukan apa-apa jika data kosong

  data.forEach((item) => {
    const row = historyTableBody.insertRow();
    const cellDate = row.insertCell();
    const cellWater = row.insertCell();
    const cellBattery = row.insertCell();
    const cellTds = row.insertCell();
    const cellPh = row.insertCell();

    cellDate.textContent = item.dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    cellWater.textContent =
      item.avgWater !== null ? item.avgWater.toFixed(1) + "%" : "-";
    cellBattery.textContent =
      item.avgBattery !== null ? item.avgBattery.toFixed(0) + "%" : "-";
    cellTds.textContent = item.avgTds !== null ? item.avgTds.toFixed(0) : "-";
    cellPh.textContent = item.avgPh !== null ? item.avgPh.toFixed(1) : "-";
  });
}

// --- Logika Utama Saat Halaman Dimuat ---
document.addEventListener("DOMContentLoaded", () => {
  // Ambil elemen DOM di sini
  historyMessage = document.getElementById("historyMessage");
  historyTableBody = document.getElementById("historyTableBody");
  historyDateRange = document.getElementById("historyDateRange");
  chartCanvas = document.getElementById("sensorChart");

  console.log("History page loaded. Generating dummy data...");
  setHistoryMessage("Memuat data contoh...");

  // Generate data contoh untuk 30 hari
  const dummyData = generateDummyHistoryData(30);

  // Update rentang tanggal di UI
  if (historyDateRange && dummyData.length > 0) {
    const firstDate = dummyData[0].dateObj;
    const lastDate = dummyData[dummyData.length - 1].dateObj;
    const options = { day: "numeric", month: "short", year: "numeric" };
    historyDateRange.textContent = `Data Contoh (${firstDate.toLocaleDateString(
      "id-ID",
      options
    )} - ${lastDate.toLocaleDateString("id-ID", options)})`;
  }

  if (dummyData.length > 0) {
    setHistoryMessage(""); // Hapus pesan loading
    displayChart(dummyData);
    displayTable(dummyData);
    console.log("Dummy data displayed.");
  } else {
    setHistoryMessage("Gagal membuat data contoh.", true);
    console.error("Failed to generate dummy data.");
  }

  // Setup tombol logout jika ada (meskipun belum berfungsi penuh tanpa auth)
  // if (typeof setupLogoutButton === 'function') {
  //     setupLogoutButton();
  // }
});

// Catatan: Fungsi setupLogoutButton() perlu didefinisikan jika ingin
// tombol logout ada interaksinya, tapi tanpa auth ia tidak akan benar-benar logout.
// Anda bisa salin fungsi setupLogoutButton dari script monitoring jika perlu.
