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
    const promptText = `Hasil skor latihan siswa: ${score} Berdasarkan skor tersebut, buatkan soal ujian IPAS tingkat SD yang sesuai dengan kemampuan siswa yang bertemakan Keragaman Budaya dan Kearifan Lokal dan Perubahan Wujud Benda. Tingkat kesulitan soal harus menyesuaikan skor siswa (skor rendah = soal mudah, skor tinggi = soal lebih menantang). Buat sebanyak 10 soal pilihan ganda.

Berikut adalah daftar aset gambar yang tersedia beserta peruntukannya. Jika kamu membuat soal yang relevan dengan aset di bawah ini, kamu WAJIB memasukkan URL gambarnya ke field "image". Jika soal yang kamu buat tidak membutuhkan gambar atau tidak ada di daftar ini, isi field "image" dengan string kosong "".

DAFTAR ASET GAMBAR:
- Baju adat Jawa: https://png.pngtree.com/png-clipart/20240828/original/pngtree-illustration-of-a-couple-wearing-traditional-javanese-clothing-png-image_15871701.png
- Alat musik gamelan: https://i.imgur.com/sFFJvLM.jpeg
- Proses mencair: https://i.imgur.com/ENiOkXW.png
- Proses menguap: https://i.imgur.com/5F1riSc.png
- Alat musik angklung: https://i.imgur.com/B9lTkOL.png
- Baju adat Sulawesi: https://i.imgur.com/LGxL7lb.png
- Rumah adat Sulawesi: https://i.imgur.com/2AhCgQ9.png
- Rumah adat Papua: https://i.imgur.com/PH67KIm.png
- Proses menyublim: https://i.imgur.com/Pn6ePNm.png
- Proses membeku: https://i.imgur.com/QLorvmh.png

Response wajib dalam format JSON tanpa penjelasan tambahan dengan struktur seperti berikut:
{
  "level": "mudah | sulit",
  "materi": "topik IPAS",
  "questions": [
    {
      "question": "isi soal",
      "image": "URL_gambar_dari_daftar_aset_atau_kosongkan_jika_tidak_butuh",
      "options": ["1", "2", "3"],
      "answer": "jawaban benar"
    }
  ]
} Response HARUS valid JSON.Tanpa markdown.Tanpa penjelasan. tidak usah kasih awalan untuk optionnya, langsung option jawaban.`;

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