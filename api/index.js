require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

// Middleware
app.use(cors()); // Mengizinkan Construct 2 mengakses API ini (Mengatasi Error CORS)
app.use(express.json()); // Mengizinkan backend membaca data format JSON

// Inisialisasi Gemini Client menggunakan API Key dari Environment Variable
// (Saat local, ini membaca dari file env / terminal. Saat di Vercel, disetting di dashboard)
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

    // Susun prompt sesuai permintaan Anda
    const promptText = `Hasil skor latihan siswa: ${score} Berdasarkan skor tersebut, buatkan soal ujian IPAS tingkat SD yang sesuai dengan kemampuan siswa yang bertemakan Keragaman Budaya dan Kearifan Lokal dan Perubahan Wujud Benda. Tingkat kesulitan soal harus menyesuaikan skor siswa (skor rendah = soal mudah, skor tinggi = soal lebih menantang). Buat sebanyak 10 soal pilihan ganda. Response wajib dalam format JSON tanpa penjelasan tambahan dengan struktur seperti berikut:
{
  "level": "mudah | sulit",
  "materi": "topik IPAS",
  "questions": [
    {
      "question": "isi soal",
      "options": ["1", "2", "3"],
      "answer": "jawaban benar"
    }
  ]
} Response HARUS valid JSON.Tanpa markdown.Tanpa penjelasan. tidak usah kasih awalan untuk optionnya, langsung option jawaban.`;

    // Panggil Gemini API menggunakan model gemini-2.5-flash (cepat dan hemat biaya)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      // Memaksa Gemini agar mengembalikan format JSON murni yang valid tanpa backticks ```json
      config: {
        responseMimeType: "application/json"
      }
    });

    // Ambil string teks dari response Gemini
    const resultText = response.text;

    // Parse string tersebut menjadi objek JSON asli agar Construct 2 mudah membacanya
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

// EXPORT APP (Jangan pakai app.listen jika ingin di-deploy ke Vercel)
module.exports = app;