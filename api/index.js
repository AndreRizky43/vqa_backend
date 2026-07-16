require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

// Middleware
app.use(cors()); // Mengizinkan Construct 2 mengakses API ini (Mengatasi Error CORS)
app.use(express.json()); // Mengizinkan backend membaca data format JSON

// Inisialisasi Gemini Client menggunakan API Key dari Environment Variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Endpoint POST untuk menerima skor dari Construct 2
app.post("/api/generate-soal", async (req, res) => {

    console.log(`[${new Date().toISOString()}] 🎯 Hit API /api/generate-soal | Skor diterima:`, req.body.score);

  try {
    const { score } = req.body;

    // Validasi input skor jika tidak dikirim oleh Construct 2
    if (score === undefined || score === null) {
      return res.status(400).json({ error: "Parameter 'score' wajib dikirim." });
    }

    // Susun prompt dengan menyertakan daftar aset gambar dan memperbarui struktur JSON
    const promptText = `Hasil skor latihan siswa: ${score}

Berdasarkan skor tersebut, buatkan 10 soal pilihan ganda IPAS tingkat SD yang sesuai dengan kemampuan siswa.

Materi yang boleh digunakan:
- Keragaman Budaya dan Kearifan Lokal
- Perubahan Wujud Benda

Tingkat kesulitan WAJIB mengikuti aturan berikut.

=========================
LEVEL MUDAH (score < 60)
=========================

Karakteristik soal:
- Pertanyaan bersifat mengenali gambar.
- Jawaban dapat ditemukan langsung dari gambar.
- Tidak membutuhkan analisis.
- Kalimat singkat.
- Pilihan jawaban jelas berbeda.

Contoh:
Gambar rumah adat Papua.
"Soal: Rumah adat pada gambar berasal dari daerah..."

Gambar es mencair.
"Soal: Perubahan wujud pada gambar adalah..."

JANGAN membuat soal yang membutuhkan alasan atau penalaran.

=========================
LEVEL SULIT (score >=60)
=========================

Karakteristik soal:
- Soal berbasis analisis.
- Membandingkan dua konsep.
- Menghubungkan gambar dengan kehidupan sehari-hari.
- Menguji pemahaman, bukan hafalan.
- Gunakan studi kasus sederhana.

Contoh:
-Setelah melihat gambar air mendidih, mengapa tutup panci menjadi basah?
-Setelah melihat gambar rumah Joglo dan rumah Papua, mengapa bentuk keduanya berbeda?
-Setelah melihat gambar gamelan, mengapa alat musik tersebut termasuk budaya daerah?
JANGAN membuat soal yang hanya menanyakan nama benda pada gambar.

Perbedaan tingkat kesulitan harus benar-benar berbeda, bukan hanya mengganti kata atau istilah.

SETIAP REQUEST HARUS BERBEDA.

Jangan mengulang soal yang pernah dibuat sebelumnya.

Acak:
- urutan materi
- urutan gambar
- bentuk kalimat
- konteks soal
- urutan pilihan jawaban

Walaupun menggunakan gambar yang sama, pertanyaannya harus berbeda.

Contoh gambar rumah Joglo dapat menghasilkan soal:

1.
Rumah adat pada gambar berasal dari daerah...

2.
Mengapa rumah pada gambar memiliki atap tinggi?

3.
Apa fungsi rumah adat tersebut pada masyarakat?

4.
Rumah adat pada gambar mencerminkan budaya...

Jangan membuat dua soal yang memiliki maksud sama.

Gunakan berbagai tipe soal berikut secara acak.

- Mengenali gambar
- Menentukan perubahan wujud
- Menentukan sebab akibat
- Membandingkan dua budaya
- Menentukan fungsi benda
- Menentukan manfaat budaya
- Menentukan ciri khas
- Menentukan contoh dalam kehidupan sehari-hari
- Menentukan kesimpulan dari gambar
- Menentukan hubungan gambar dengan materi

Setiap tipe soal minimal muncul satu kali.

PENTING:
1. SEMUA soal WAJIB menggunakan gambar.
2. Field "image" TIDAK BOLEH kosong.
3. Setiap soal HARUS dipilih dari materi yang memiliki gambar pada daftar aset.
4. Jika tidak ada gambar yang cocok, BUAT SOAL LAIN yang menggunakan salah satu gambar yang tersedia.
5. Jangan pernah mengisi image dengan "", null, atau field kosong.
6. Setiap object question HARUS memiliki URL gambar yang valid dari daftar aset berikut.

DAFTAR ASET GAMBAR:
- Baju adat Jawa: https://png.pngtree.com/png-clipart/20240828/original/pngtree-illustration-of-a-couple-wearing-traditional-javanese-clothing-png-image_15871701.png
- Alat musik gamelan: https://i.imgur.com/sFFJvLM.jpeg
- Es Batu Mencair: https://i.imgur.com/GfmiEqo.png
- Air dipanaskan dan mendidih: https://i.imgur.com/Gnhmwk3.png
- Alat musik angklung: https://i.imgur.com/cwJWaIS.png
- Baju adat Sulawesi: https://i.imgur.com/ADkzb8K.png
- Rumah adat Sulawesi: https://i.imgur.com/R45YUIj.png
- Rumah adat Papua: https://i.imgur.com/NJqrQp3.png
- Proses menyublim: https://i.imgur.com/z2imR01.png
- Es membeku: https://i.imgur.com/uJRZwbM.png
- Gas menjadi kristal : https://i.imgur.com/xpyfRDI.png
- Rumah joglo jawa : https://i.imgur.com/DuKKvAD.png

Response WAJIB berupa JSON VALID tanpa markdown dan tanpa penjelasan tambahan.

Format:

{
  "level": "mudah|sulit",
  "materi": "Keragaman Budaya dan Kearifan Lokal, Perubahan Wujud Benda",
  "questions": [
    {
      "question": "isi soal",
      "image": "URL_GAMBAR_DARI_DAFTAR_ASET",
      "options": [
        "opsi 1",
        "opsi 2",
        "opsi 3",
      ],
      "answer": "jawaban benar"
    }
  ]
}

VALIDASI SEBELUM MEMBERIKAN JAWABAN:
- questions harus berisi tepat 10 soal.
- opsi pilhan harus cuma 3.
- Semua soal harus memiliki image.
- Tidak boleh ada image kosong.
- Tidak boleh ada image null.
- Semua image harus berasal dari daftar aset di atas.
- Jika ada image kosong, perbaiki terlebih dahulu sebelum mengirim respons.
- Keluaran harus JSON valid.
- Tidak boleh ada dua soal yang memiliki pertanyaan sama.
- Tidak boleh ada dua soal yang hanya berbeda satu atau dua kata.
- Jika menggunakan gambar yang sama, pertanyaannya harus benar-benar berbeda.
- Semua soal harus unik.
- Tingkat mudah dan sulit harus berbeda secara konsep.
`;

    // Panggil Gemini API menggunakan model gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json"
      }
    });

    // Ambil string teks dari response Gemini
    const resultText = response.text;

    // Parse string tersebut menjadi objek JSON asli
    const jsonResponse = JSON.parse(resultText);

    console.log("\n========== HASIL SOAL GEMINI ==========");

    jsonResponse.questions.forEach((q, index) => {
      console.log(`\nSoal ${index + 1}`);
      console.log(`Pertanyaan : ${q.question}`);
      console.log(`Gambar     : ${q.image}`);

      q.options.forEach((option, i) => {
        console.log(`Pilihan ${i + 1} : ${option}`);
      });

      console.log(`Jawaban    : ${q.answer}`);
    });

    console.log("\n=======================================\n");

    // Kirim balik ke Construct 2
    return res.json(jsonResponse);

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ 
      error: "Terjadi kesalahan pada server backend.", 
      details: error.message 
    });
  }
});

// Menangani route utama jika dibuka di browser biasa
app.get("/", (req, res) => {
  res.send("Backend Jembatan Gemini untuk Construct 2 aktif!");
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server lokal siap! Berjalan di: http://localhost:${PORT}`);
  });
}

module.exports = app;