export type StemCategory = 'S' | 'T' | 'E' | 'M';

export type StemCategoryLabel =
  | 'Science'
  | 'Technology'
  | 'Engineering'
  | 'Mathematics';

export type DifficultyLevel = 'mudah' | 'sedang' | 'sulit';

export type RiskTier = 'bahaya' | 'waspada' | 'cukup-aman' | 'aman';

export type QuizSubject = 'Matematika' | 'Fisika';

export interface ChallengeOption {
  id: string;
  text: string;
}

export interface BankQuestion {
  id: string;
  subject: QuizSubject;
  topicTitle: string;
  hotspotId: string;
  hotspotTitle: string;
  missionTags: string[];
  stemCategory: StemCategory;
  stemLabel: StemCategoryLabel;
  difficulty: DifficultyLevel;
  weight: 1 | 1.5 | 2;
  prompt: string;
  options: ChallengeOption[];
  correctOptionId: string;
  acuan: string[];
  explanation: string;
  stemChoInsight: string;
}

export interface RegionMissionPolicy {
  regionId: string;
  regionName: string;
  defaultRisk: RiskTier;
  defaultQuestionCount: 5 | 6 | 7;
  missionTags: string[];
}

export const KALBAR_REGION_POLICIES: Record<string, RegionMissionPolicy> = {
  'kota-singkawang': {
    regionId: 'kota-singkawang',
    regionName: 'Kota Singkawang',
    defaultRisk: 'bahaya',
    defaultQuestionCount: 7,
    missionTags: ['kota-singkawang', 'perbukitan', 'pesisir', 'bahaya', 'waspada', 'cukup-aman'],
  },
  'kubu-raya': {
    regionId: 'kubu-raya',
    regionName: 'Kabupaten Kubu Raya',
    defaultRisk: 'bahaya',
    defaultQuestionCount: 7,
    missionTags: ['kubu-raya', 'gambut', 'pesisir', 'bahaya', 'waspada', 'cukup-aman'],
  },
  'kota-pontianak': {
    regionId: 'kota-pontianak',
    regionName: 'Kota Pontianak',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['kota-pontianak', 'perkotaan', 'gambut', 'bahaya', 'waspada', 'cukup-aman'],
  },
  ketapang: {
    regionId: 'ketapang',
    regionName: 'Kabupaten Ketapang',
    defaultRisk: 'bahaya',
    defaultQuestionCount: 7,
    missionTags: ['ketapang', 'gambut', 'bahaya'],
  },
  'kayong-utara': {
    regionId: 'kayong-utara',
    regionName: 'Kabupaten Kayong Utara',
    defaultRisk: 'bahaya',
    defaultQuestionCount: 7,
    missionTags: ['kayong-utara', 'gambut', 'bahaya'],
  },
  sintang: {
    regionId: 'sintang',
    regionName: 'Kabupaten Sintang',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['sintang', 'aluvial', 'waspada'],
  },
  sambas: {
    regionId: 'sambas',
    regionName: 'Kabupaten Sambas',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['sambas', 'pesisir', 'waspada'],
  },
  mempawah: {
    regionId: 'mempawah',
    regionName: 'Kabupaten Mempawah',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['mempawah', 'pesisir', 'waspada'],
  },
  bengkayang: {
    regionId: 'bengkayang',
    regionName: 'Kabupaten Bengkayang',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['bengkayang', 'perbukitan', 'waspada'],
  },
  landak: {
    regionId: 'landak',
    regionName: 'Kabupaten Landak',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['landak', 'aluvial', 'waspada'],
  },
  melawi: {
    regionId: 'melawi',
    regionName: 'Kabupaten Melawi',
    defaultRisk: 'waspada',
    defaultQuestionCount: 6,
    missionTags: ['melawi', 'perbukitan', 'waspada'],
  },
  sanggau: {
    regionId: 'sanggau',
    regionName: 'Kabupaten Sanggau',
    defaultRisk: 'cukup-aman',
    defaultQuestionCount: 5,
    missionTags: ['sanggau', 'mineral', 'cukup-aman'],
  },
  sekadau: {
    regionId: 'sekadau',
    regionName: 'Kabupaten Sekadau',
    defaultRisk: 'cukup-aman',
    defaultQuestionCount: 5,
    missionTags: ['sekadau', 'mineral', 'cukup-aman'],
  },
  'kapuas-hulu': {
    regionId: 'kapuas-hulu',
    regionName: 'Kabupaten Kapuas Hulu',
    defaultRisk: 'cukup-aman',
    defaultQuestionCount: 5,
    missionTags: ['kapuas-hulu', 'konservasi', 'cukup-aman'],
  },
};

export const CHALLENGE_QUESTION_BANK: BankQuestion[] = [
  {
    "id": "q-sim-01-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-01",
    "hotspotTitle": "Kelurahan Pasiran",
    "missionTags": [
      "kota-singkawang",
      "sim-01",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 18 hektare, sebanyak 5.4 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "15,00 %"
      },
      {
        "id": "b",
        "text": "45,00 %"
      },
      {
        "id": "c",
        "text": "30,00 %"
      },
      {
        "id": "d",
        "text": "40,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (5.4 ÷ 18) × 100% = 30.0%. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10% sampai dengan 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-01-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-01",
    "hotspotTitle": "Kelurahan Pasiran",
    "missionTags": [
      "kota-singkawang",
      "sim-01",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2 km dalam waktu 10 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 10/60 jam. Kecepatan = jarak ÷ waktu = 2 ÷ (10/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-01-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-01",
    "hotspotTitle": "Kelurahan Pasiran",
    "missionTags": [
      "kota-singkawang",
      "sim-01",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 800 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2000 liter"
      },
      {
        "id": "b",
        "text": "6000 liter"
      },
      {
        "id": "c",
        "text": "4000 liter"
      },
      {
        "id": "d",
        "text": "4010 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 800 = 4000 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-01-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-01",
    "hotspotTitle": "Kelurahan Pasiran",
    "missionTags": [
      "kota-singkawang",
      "sim-01",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 12 watt dan digunakan selama 4 jam setiap hari. Berapakah energi listrik yang digunakan selama 4 hari?",
    "options": [
      {
        "id": "a",
        "text": "24 Wh"
      },
      {
        "id": "b",
        "text": "72 Wh"
      },
      {
        "id": "c",
        "text": "48 Wh"
      },
      {
        "id": "d",
        "text": "58 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 12 W × (4 jam/hari × 4 hari) = 48 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-01-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-01",
    "hotspotTitle": "Kelurahan Pasiran",
    "missionTags": [
      "kota-singkawang",
      "sim-01",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 120 gram air dipanaskan sehingga suhunya naik 45°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "2700 kalori"
      },
      {
        "id": "b",
        "text": "8100 kalori"
      },
      {
        "id": "c",
        "text": "5400 kalori"
      },
      {
        "id": "d",
        "text": "5410 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 120 × 1 × 45 = 5400 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 10.000 kalori atau kurang.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-02-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-02",
    "hotspotTitle": "Kelurahan Sedau",
    "missionTags": [
      "kota-singkawang",
      "sim-02",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 20 hektare, sebanyak 7 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (7 ÷ 20) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-02-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-02",
    "hotspotTitle": "Kelurahan Sedau",
    "missionTags": [
      "kota-singkawang",
      "sim-02",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 1.8 km dalam waktu 9 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 9/60 jam. Kecepatan = jarak ÷ waktu = 1.8 ÷ (9/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-02-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-02",
    "hotspotTitle": "Kelurahan Sedau",
    "missionTags": [
      "kota-singkawang",
      "sim-02",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 750 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "1875 liter"
      },
      {
        "id": "b",
        "text": "5625 liter"
      },
      {
        "id": "c",
        "text": "3750 liter"
      },
      {
        "id": "d",
        "text": "3760 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 750 = 3750 liter. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 2.000–3.999 liter.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-02-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-02",
    "hotspotTitle": "Kelurahan Sedau",
    "missionTags": [
      "kota-singkawang",
      "sim-02",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 14 watt dan digunakan selama 5 jam setiap hari. Berapakah energi listrik yang digunakan selama 5 hari?",
    "options": [
      {
        "id": "a",
        "text": "35 Wh"
      },
      {
        "id": "b",
        "text": "105 Wh"
      },
      {
        "id": "c",
        "text": "70 Wh"
      },
      {
        "id": "d",
        "text": "80 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 14 W × (5 jam/hari × 5 hari) = 70 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-02-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-02",
    "hotspotTitle": "Kelurahan Sedau",
    "missionTags": [
      "kota-singkawang",
      "sim-02",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 140 gram air dipanaskan sehingga suhunya naik 50°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "3500 kalori"
      },
      {
        "id": "b",
        "text": "10500 kalori"
      },
      {
        "id": "c",
        "text": "7000 kalori"
      },
      {
        "id": "d",
        "text": "7010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 140 × 1 × 50 = 7000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 10.000 kalori atau kurang.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-03-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-03",
    "hotspotTitle": "Kelurahan Sijangkung",
    "missionTags": [
      "kota-singkawang",
      "sim-03",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 16 hektare, sebanyak 4.8 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "15,00 %"
      },
      {
        "id": "b",
        "text": "45,00 %"
      },
      {
        "id": "c",
        "text": "30,00 %"
      },
      {
        "id": "d",
        "text": "40,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (4.8 ÷ 16) × 100% = 30.0%. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10% sampai dengan 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-03-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-03",
    "hotspotTitle": "Kelurahan Sijangkung",
    "missionTags": [
      "kota-singkawang",
      "sim-03",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.5 km dalam waktu 12 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,25 km/jam"
      },
      {
        "id": "b",
        "text": "18,75 km/jam"
      },
      {
        "id": "c",
        "text": "12,50 km/jam"
      },
      {
        "id": "d",
        "text": "13,50 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 12/60 jam. Kecepatan = jarak ÷ waktu = 2.5 ÷ (12/60) = 12.5 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-03-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-03",
    "hotspotTitle": "Kelurahan Sijangkung",
    "missionTags": [
      "kota-singkawang",
      "sim-03",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 900 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2250 liter"
      },
      {
        "id": "b",
        "text": "6750 liter"
      },
      {
        "id": "c",
        "text": "4500 liter"
      },
      {
        "id": "d",
        "text": "4510 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 900 = 4500 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-03-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-03",
    "hotspotTitle": "Kelurahan Sijangkung",
    "missionTags": [
      "kota-singkawang",
      "sim-03",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 16 watt dan digunakan selama 3 jam setiap hari. Berapakah energi listrik yang digunakan selama 3 hari?",
    "options": [
      {
        "id": "a",
        "text": "24 Wh"
      },
      {
        "id": "b",
        "text": "72 Wh"
      },
      {
        "id": "c",
        "text": "48 Wh"
      },
      {
        "id": "d",
        "text": "58 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 16 W × (3 jam/hari × 3 hari) = 48 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-03-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-03",
    "hotspotTitle": "Kelurahan Sijangkung",
    "missionTags": [
      "kota-singkawang",
      "sim-03",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 160 gram air dipanaskan sehingga suhunya naik 55°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "4400 kalori"
      },
      {
        "id": "b",
        "text": "13200 kalori"
      },
      {
        "id": "c",
        "text": "8800 kalori"
      },
      {
        "id": "d",
        "text": "8810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 160 × 1 × 55 = 8800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 10.000 kalori atau kurang.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-04-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-04",
    "hotspotTitle": "Kelurahan Roban",
    "missionTags": [
      "kota-singkawang",
      "sim-04",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 25 hektare, sebanyak 8.75 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (8.75 ÷ 25) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-04-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-04",
    "hotspotTitle": "Kelurahan Roban",
    "missionTags": [
      "kota-singkawang",
      "sim-04",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 3 km dalam waktu 15 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 15/60 jam. Kecepatan = jarak ÷ waktu = 3 ÷ (15/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-04-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-04",
    "hotspotTitle": "Kelurahan Roban",
    "missionTags": [
      "kota-singkawang",
      "sim-04",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 700 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "1750 liter"
      },
      {
        "id": "b",
        "text": "5250 liter"
      },
      {
        "id": "c",
        "text": "3500 liter"
      },
      {
        "id": "d",
        "text": "3510 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 700 = 3500 liter. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 2.000–3.999 liter.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-04-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-04",
    "hotspotTitle": "Kelurahan Roban",
    "missionTags": [
      "kota-singkawang",
      "sim-04",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 18 watt dan digunakan selama 6 jam setiap hari. Berapakah energi listrik yang digunakan selama 6 hari?",
    "options": [
      {
        "id": "a",
        "text": "54 Wh"
      },
      {
        "id": "b",
        "text": "162 Wh"
      },
      {
        "id": "c",
        "text": "108 Wh"
      },
      {
        "id": "d",
        "text": "118 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 18 W × (6 jam/hari × 6 hari) = 108 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-04-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-04",
    "hotspotTitle": "Kelurahan Roban",
    "missionTags": [
      "kota-singkawang",
      "sim-04",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 180 gram air dipanaskan sehingga suhunya naik 60°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "5400 kalori"
      },
      {
        "id": "b",
        "text": "16200 kalori"
      },
      {
        "id": "c",
        "text": "10800 kalori"
      },
      {
        "id": "d",
        "text": "10810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 180 × 1 × 60 = 10800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-05-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-05",
    "hotspotTitle": "Kelurahan Sungai Wie",
    "missionTags": [
      "kota-singkawang",
      "sim-05",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 22 hektare, sebanyak 6.6 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "15,00 %"
      },
      {
        "id": "b",
        "text": "45,00 %"
      },
      {
        "id": "c",
        "text": "30,00 %"
      },
      {
        "id": "d",
        "text": "40,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (6.6 ÷ 22) × 100% = 30.0%. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10% sampai dengan 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-05-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-05",
    "hotspotTitle": "Kelurahan Sungai Wie",
    "missionTags": [
      "kota-singkawang",
      "sim-05",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.4 km dalam waktu 8 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "9,00 km/jam"
      },
      {
        "id": "b",
        "text": "27,00 km/jam"
      },
      {
        "id": "c",
        "text": "18,00 km/jam"
      },
      {
        "id": "d",
        "text": "19,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 8/60 jam. Kecepatan = jarak ÷ waktu = 2.4 ÷ (8/60) = 18.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-05-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-05",
    "hotspotTitle": "Kelurahan Sungai Wie",
    "missionTags": [
      "kota-singkawang",
      "sim-05",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 850 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2125 liter"
      },
      {
        "id": "b",
        "text": "6375 liter"
      },
      {
        "id": "c",
        "text": "4250 liter"
      },
      {
        "id": "d",
        "text": "4260 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 850 = 4250 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-05-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-05",
    "hotspotTitle": "Kelurahan Sungai Wie",
    "missionTags": [
      "kota-singkawang",
      "sim-05",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 20 watt dan digunakan selama 5 jam setiap hari. Berapakah energi listrik yang digunakan selama 5 hari?",
    "options": [
      {
        "id": "a",
        "text": "50 Wh"
      },
      {
        "id": "b",
        "text": "150 Wh"
      },
      {
        "id": "c",
        "text": "100 Wh"
      },
      {
        "id": "d",
        "text": "110 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 20 W × (5 jam/hari × 5 hari) = 100 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-05-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-05",
    "hotspotTitle": "Kelurahan Sungai Wie",
    "missionTags": [
      "kota-singkawang",
      "sim-05",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 200 gram air dipanaskan sehingga suhunya naik 65°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "6500 kalori"
      },
      {
        "id": "b",
        "text": "19500 kalori"
      },
      {
        "id": "c",
        "text": "13000 kalori"
      },
      {
        "id": "d",
        "text": "13010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 200 × 1 × 65 = 13000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-06-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-06",
    "hotspotTitle": "Kecamatan Sungai Raya",
    "missionTags": [
      "kubu-raya",
      "sim-06",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 30 hektare, sebanyak 12 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "20,00 %"
      },
      {
        "id": "b",
        "text": "60,00 %"
      },
      {
        "id": "c",
        "text": "40,00 %"
      },
      {
        "id": "d",
        "text": "50,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (12 ÷ 30) × 100% = 40.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-06-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-06",
    "hotspotTitle": "Kecamatan Sungai Raya",
    "missionTags": [
      "kubu-raya",
      "sim-06",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 1.5 km dalam waktu 8 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "5,62 km/jam"
      },
      {
        "id": "b",
        "text": "16,88 km/jam"
      },
      {
        "id": "c",
        "text": "11,25 km/jam"
      },
      {
        "id": "d",
        "text": "12,25 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 8/60 jam. Kecepatan = jarak ÷ waktu = 1.5 ÷ (8/60) = 11.25 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-06-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-06",
    "hotspotTitle": "Kecamatan Sungai Raya",
    "missionTags": [
      "kubu-raya",
      "sim-06",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 1000 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2500 liter"
      },
      {
        "id": "b",
        "text": "7500 liter"
      },
      {
        "id": "c",
        "text": "5000 liter"
      },
      {
        "id": "d",
        "text": "5010 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 1000 = 5000 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-06-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-06",
    "hotspotTitle": "Kecamatan Sungai Raya",
    "missionTags": [
      "kubu-raya",
      "sim-06",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 12 watt dan digunakan selama 4 jam setiap hari. Berapakah energi listrik yang digunakan selama 4 hari?",
    "options": [
      {
        "id": "a",
        "text": "24 Wh"
      },
      {
        "id": "b",
        "text": "72 Wh"
      },
      {
        "id": "c",
        "text": "48 Wh"
      },
      {
        "id": "d",
        "text": "58 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 12 W × (4 jam/hari × 4 hari) = 48 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-06-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-06",
    "hotspotTitle": "Kecamatan Sungai Raya",
    "missionTags": [
      "kubu-raya",
      "sim-06",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 220 gram air dipanaskan sehingga suhunya naik 70°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "7700 kalori"
      },
      {
        "id": "b",
        "text": "23100 kalori"
      },
      {
        "id": "c",
        "text": "15400 kalori"
      },
      {
        "id": "d",
        "text": "15410 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 220 × 1 × 70 = 15400 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-07-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-07",
    "hotspotTitle": "Kecamatan Rasau Jaya",
    "missionTags": [
      "kubu-raya",
      "sim-07",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 28 hektare, sebanyak 9.8 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (9.8 ÷ 28) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-07-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-07",
    "hotspotTitle": "Kecamatan Rasau Jaya",
    "missionTags": [
      "kubu-raya",
      "sim-07",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.2 km dalam waktu 11 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 11/60 jam. Kecepatan = jarak ÷ waktu = 2.2 ÷ (11/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-07-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-07",
    "hotspotTitle": "Kecamatan Rasau Jaya",
    "missionTags": [
      "kubu-raya",
      "sim-07",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 850 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2125 liter"
      },
      {
        "id": "b",
        "text": "6375 liter"
      },
      {
        "id": "c",
        "text": "4250 liter"
      },
      {
        "id": "d",
        "text": "4260 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 850 = 4250 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-07-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-07",
    "hotspotTitle": "Kecamatan Rasau Jaya",
    "missionTags": [
      "kubu-raya",
      "sim-07",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 14 watt dan digunakan selama 5 jam setiap hari. Berapakah energi listrik yang digunakan selama 5 hari?",
    "options": [
      {
        "id": "a",
        "text": "35 Wh"
      },
      {
        "id": "b",
        "text": "105 Wh"
      },
      {
        "id": "c",
        "text": "70 Wh"
      },
      {
        "id": "d",
        "text": "80 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 14 W × (5 jam/hari × 5 hari) = 70 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-07-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-07",
    "hotspotTitle": "Kecamatan Rasau Jaya",
    "missionTags": [
      "kubu-raya",
      "sim-07",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 240 gram air dipanaskan sehingga suhunya naik 75°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "9000 kalori"
      },
      {
        "id": "b",
        "text": "27000 kalori"
      },
      {
        "id": "c",
        "text": "18000 kalori"
      },
      {
        "id": "d",
        "text": "18010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 240 × 1 × 75 = 18000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-08-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-08",
    "hotspotTitle": "Kecamatan Kuala Mandor B",
    "missionTags": [
      "kubu-raya",
      "sim-08",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 35 hektare, sebanyak 14 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "20,00 %"
      },
      {
        "id": "b",
        "text": "60,00 %"
      },
      {
        "id": "c",
        "text": "40,00 %"
      },
      {
        "id": "d",
        "text": "50,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (14 ÷ 35) × 100% = 40.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-08-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-08",
    "hotspotTitle": "Kecamatan Kuala Mandor B",
    "missionTags": [
      "kubu-raya",
      "sim-08",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 1.8 km dalam waktu 9 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 9/60 jam. Kecepatan = jarak ÷ waktu = 1.8 ÷ (9/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-08-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-08",
    "hotspotTitle": "Kecamatan Kuala Mandor B",
    "missionTags": [
      "kubu-raya",
      "sim-08",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 900 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2250 liter"
      },
      {
        "id": "b",
        "text": "6750 liter"
      },
      {
        "id": "c",
        "text": "4500 liter"
      },
      {
        "id": "d",
        "text": "4510 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 900 = 4500 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-08-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-08",
    "hotspotTitle": "Kecamatan Kuala Mandor B",
    "missionTags": [
      "kubu-raya",
      "sim-08",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 16 watt dan digunakan selama 6 jam setiap hari. Berapakah energi listrik yang digunakan selama 6 hari?",
    "options": [
      {
        "id": "a",
        "text": "48 Wh"
      },
      {
        "id": "b",
        "text": "144 Wh"
      },
      {
        "id": "c",
        "text": "96 Wh"
      },
      {
        "id": "d",
        "text": "106 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 16 W × (6 jam/hari × 6 hari) = 96 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-08-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-08",
    "hotspotTitle": "Kecamatan Kuala Mandor B",
    "missionTags": [
      "kubu-raya",
      "sim-08",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 260 gram air dipanaskan sehingga suhunya naik 80°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "10400 kalori"
      },
      {
        "id": "b",
        "text": "31200 kalori"
      },
      {
        "id": "c",
        "text": "20800 kalori"
      },
      {
        "id": "d",
        "text": "20810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 260 × 1 × 80 = 20800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-09-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-09",
    "hotspotTitle": "Kecamatan Sungai Kakap",
    "missionTags": [
      "kubu-raya",
      "sim-09",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 24 hektare, sebanyak 8.4 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (8.4 ÷ 24) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-09-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-09",
    "hotspotTitle": "Kecamatan Sungai Kakap",
    "missionTags": [
      "kubu-raya",
      "sim-09",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.5 km dalam waktu 10 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "7,50 km/jam"
      },
      {
        "id": "b",
        "text": "22,50 km/jam"
      },
      {
        "id": "c",
        "text": "15,00 km/jam"
      },
      {
        "id": "d",
        "text": "16,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 10/60 jam. Kecepatan = jarak ÷ waktu = 2.5 ÷ (10/60) = 15.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-09-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-09",
    "hotspotTitle": "Kecamatan Sungai Kakap",
    "missionTags": [
      "kubu-raya",
      "sim-09",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 800 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2000 liter"
      },
      {
        "id": "b",
        "text": "6000 liter"
      },
      {
        "id": "c",
        "text": "4000 liter"
      },
      {
        "id": "d",
        "text": "4010 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 800 = 4000 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-09-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-09",
    "hotspotTitle": "Kecamatan Sungai Kakap",
    "missionTags": [
      "kubu-raya",
      "sim-09",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 18 watt dan digunakan selama 5 jam setiap hari. Berapakah energi listrik yang digunakan selama 5 hari?",
    "options": [
      {
        "id": "a",
        "text": "45 Wh"
      },
      {
        "id": "b",
        "text": "135 Wh"
      },
      {
        "id": "c",
        "text": "90 Wh"
      },
      {
        "id": "d",
        "text": "100 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 18 W × (5 jam/hari × 5 hari) = 90 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-09-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-09",
    "hotspotTitle": "Kecamatan Sungai Kakap",
    "missionTags": [
      "kubu-raya",
      "sim-09",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 280 gram air dipanaskan sehingga suhunya naik 85°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "11900 kalori"
      },
      {
        "id": "b",
        "text": "35700 kalori"
      },
      {
        "id": "c",
        "text": "23800 kalori"
      },
      {
        "id": "d",
        "text": "23810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 280 × 1 × 85 = 23800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-10-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-10",
    "hotspotTitle": "Kecamatan Teluk Pakedai",
    "missionTags": [
      "kubu-raya",
      "sim-10",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 32 hektare, sebanyak 11.2 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (11.2 ÷ 32) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-10-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-10",
    "hotspotTitle": "Kecamatan Teluk Pakedai",
    "missionTags": [
      "kubu-raya",
      "sim-10",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2 km dalam waktu 12 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "5,00 km/jam"
      },
      {
        "id": "b",
        "text": "15,00 km/jam"
      },
      {
        "id": "c",
        "text": "10,00 km/jam"
      },
      {
        "id": "d",
        "text": "11,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 12/60 jam. Kecepatan = jarak ÷ waktu = 2 ÷ (12/60) = 10.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-10-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-10",
    "hotspotTitle": "Kecamatan Teluk Pakedai",
    "missionTags": [
      "kubu-raya",
      "sim-10",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 950 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2375 liter"
      },
      {
        "id": "b",
        "text": "7125 liter"
      },
      {
        "id": "c",
        "text": "4750 liter"
      },
      {
        "id": "d",
        "text": "4760 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 950 = 4750 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-10-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-10",
    "hotspotTitle": "Kecamatan Teluk Pakedai",
    "missionTags": [
      "kubu-raya",
      "sim-10",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 20 watt dan digunakan selama 4 jam setiap hari. Berapakah energi listrik yang digunakan selama 4 hari?",
    "options": [
      {
        "id": "a",
        "text": "40 Wh"
      },
      {
        "id": "b",
        "text": "120 Wh"
      },
      {
        "id": "c",
        "text": "80 Wh"
      },
      {
        "id": "d",
        "text": "90 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 20 W × (4 jam/hari × 4 hari) = 80 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-10-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-10",
    "hotspotTitle": "Kecamatan Teluk Pakedai",
    "missionTags": [
      "kubu-raya",
      "sim-10",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 300 gram air dipanaskan sehingga suhunya naik 90°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "13500 kalori"
      },
      {
        "id": "b",
        "text": "40500 kalori"
      },
      {
        "id": "c",
        "text": "27000 kalori"
      },
      {
        "id": "d",
        "text": "27010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 300 × 1 × 90 = 27000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10.000 sampai dengan 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-11-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-11",
    "hotspotTitle": "Kecamatan Pontianak Selatan",
    "missionTags": [
      "kota-pontianak",
      "sim-11",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 14 hektare, sebanyak 4.2 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "15,00 %"
      },
      {
        "id": "b",
        "text": "45,00 %"
      },
      {
        "id": "c",
        "text": "30,00 %"
      },
      {
        "id": "d",
        "text": "40,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (4.2 ÷ 14) × 100% = 30.0%. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena lebih dari 10% sampai dengan 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-11-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-11",
    "hotspotTitle": "Kecamatan Pontianak Selatan",
    "missionTags": [
      "kota-pontianak",
      "sim-11",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 3 km dalam waktu 12 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "7,50 km/jam"
      },
      {
        "id": "b",
        "text": "22,50 km/jam"
      },
      {
        "id": "c",
        "text": "15,00 km/jam"
      },
      {
        "id": "d",
        "text": "16,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 12/60 jam. Kecepatan = jarak ÷ waktu = 3 ÷ (12/60) = 15.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-11-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-11",
    "hotspotTitle": "Kecamatan Pontianak Selatan",
    "missionTags": [
      "kota-pontianak",
      "sim-11",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 700 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "1750 liter"
      },
      {
        "id": "b",
        "text": "5250 liter"
      },
      {
        "id": "c",
        "text": "3500 liter"
      },
      {
        "id": "d",
        "text": "3510 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 700 = 3500 liter. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 2.000–3.999 liter.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-11-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-11",
    "hotspotTitle": "Kecamatan Pontianak Selatan",
    "missionTags": [
      "kota-pontianak",
      "sim-11",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 12 watt dan digunakan selama 3 jam setiap hari. Berapakah energi listrik yang digunakan selama 3 hari?",
    "options": [
      {
        "id": "a",
        "text": "18 Wh"
      },
      {
        "id": "b",
        "text": "54 Wh"
      },
      {
        "id": "c",
        "text": "36 Wh"
      },
      {
        "id": "d",
        "text": "46 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 12 W × (3 jam/hari × 3 hari) = 36 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-11-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-11",
    "hotspotTitle": "Kecamatan Pontianak Selatan",
    "missionTags": [
      "kota-pontianak",
      "sim-11",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 320 gram air dipanaskan sehingga suhunya naik 95°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "15200 kalori"
      },
      {
        "id": "b",
        "text": "45600 kalori"
      },
      {
        "id": "c",
        "text": "30400 kalori"
      },
      {
        "id": "d",
        "text": "30410 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 320 × 1 × 95 = 30400 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-12-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-12",
    "hotspotTitle": "Kecamatan Pontianak Tenggara",
    "missionTags": [
      "kota-pontianak",
      "sim-12",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 17 hektare, sebanyak 5.95 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (5.95 ÷ 17) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-12-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-12",
    "hotspotTitle": "Kecamatan Pontianak Tenggara",
    "missionTags": [
      "kota-pontianak",
      "sim-12",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.4 km dalam waktu 10 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "7,20 km/jam"
      },
      {
        "id": "b",
        "text": "21,60 km/jam"
      },
      {
        "id": "c",
        "text": "14,40 km/jam"
      },
      {
        "id": "d",
        "text": "15,40 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 10/60 jam. Kecepatan = jarak ÷ waktu = 2.4 ÷ (10/60) = 14.4 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-12-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-12",
    "hotspotTitle": "Kecamatan Pontianak Tenggara",
    "missionTags": [
      "kota-pontianak",
      "sim-12",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 800 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2000 liter"
      },
      {
        "id": "b",
        "text": "6000 liter"
      },
      {
        "id": "c",
        "text": "4000 liter"
      },
      {
        "id": "d",
        "text": "4010 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 800 = 4000 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-12-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-12",
    "hotspotTitle": "Kecamatan Pontianak Tenggara",
    "missionTags": [
      "kota-pontianak",
      "sim-12",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 14 watt dan digunakan selama 4 jam setiap hari. Berapakah energi listrik yang digunakan selama 4 hari?",
    "options": [
      {
        "id": "a",
        "text": "28 Wh"
      },
      {
        "id": "b",
        "text": "84 Wh"
      },
      {
        "id": "c",
        "text": "56 Wh"
      },
      {
        "id": "d",
        "text": "66 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 14 W × (4 jam/hari × 4 hari) = 56 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-12-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-12",
    "hotspotTitle": "Kecamatan Pontianak Tenggara",
    "missionTags": [
      "kota-pontianak",
      "sim-12",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 340 gram air dipanaskan sehingga suhunya naik 100°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "17000 kalori"
      },
      {
        "id": "b",
        "text": "51000 kalori"
      },
      {
        "id": "c",
        "text": "34000 kalori"
      },
      {
        "id": "d",
        "text": "34010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 340 × 1 × 100 = 34000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-13-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-13",
    "hotspotTitle": "Kecamatan Pontianak Timur",
    "missionTags": [
      "kota-pontianak",
      "sim-13",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 21 hektare, sebanyak 7.35 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (7.35 ÷ 21) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-13-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-13",
    "hotspotTitle": "Kecamatan Pontianak Timur",
    "missionTags": [
      "kota-pontianak",
      "sim-13",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.8 km dalam waktu 14 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 14/60 jam. Kecepatan = jarak ÷ waktu = 2.8 ÷ (14/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-13-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-13",
    "hotspotTitle": "Kecamatan Pontianak Timur",
    "missionTags": [
      "kota-pontianak",
      "sim-13",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 750 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "1875 liter"
      },
      {
        "id": "b",
        "text": "5625 liter"
      },
      {
        "id": "c",
        "text": "3750 liter"
      },
      {
        "id": "d",
        "text": "3760 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 750 = 3750 liter. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 2.000–3.999 liter.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-13-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-13",
    "hotspotTitle": "Kecamatan Pontianak Timur",
    "missionTags": [
      "kota-pontianak",
      "sim-13",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 16 watt dan digunakan selama 5 jam setiap hari. Berapakah energi listrik yang digunakan selama 5 hari?",
    "options": [
      {
        "id": "a",
        "text": "40 Wh"
      },
      {
        "id": "b",
        "text": "120 Wh"
      },
      {
        "id": "c",
        "text": "80 Wh"
      },
      {
        "id": "d",
        "text": "90 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 16 W × (5 jam/hari × 5 hari) = 80 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-13-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-13",
    "hotspotTitle": "Kecamatan Pontianak Timur",
    "missionTags": [
      "kota-pontianak",
      "sim-13",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 360 gram air dipanaskan sehingga suhunya naik 105°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "18900 kalori"
      },
      {
        "id": "b",
        "text": "56700 kalori"
      },
      {
        "id": "c",
        "text": "37800 kalori"
      },
      {
        "id": "d",
        "text": "37810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 360 × 1 × 105 = 37800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-14-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-14",
    "hotspotTitle": "Kecamatan Pontianak Barat",
    "missionTags": [
      "kota-pontianak",
      "sim-14",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 19 hektare, sebanyak 6.65 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (6.65 ÷ 19) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-14-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-14",
    "hotspotTitle": "Kecamatan Pontianak Barat",
    "missionTags": [
      "kota-pontianak",
      "sim-14",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 3.2 km dalam waktu 16 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 16/60 jam. Kecepatan = jarak ÷ waktu = 3.2 ÷ (16/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-14-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-14",
    "hotspotTitle": "Kecamatan Pontianak Barat",
    "missionTags": [
      "kota-pontianak",
      "sim-14",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 900 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2250 liter"
      },
      {
        "id": "b",
        "text": "6750 liter"
      },
      {
        "id": "c",
        "text": "4500 liter"
      },
      {
        "id": "d",
        "text": "4510 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 900 = 4500 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-14-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-14",
    "hotspotTitle": "Kecamatan Pontianak Barat",
    "missionTags": [
      "kota-pontianak",
      "sim-14",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 18 watt dan digunakan selama 4 jam setiap hari. Berapakah energi listrik yang digunakan selama 4 hari?",
    "options": [
      {
        "id": "a",
        "text": "36 Wh"
      },
      {
        "id": "b",
        "text": "108 Wh"
      },
      {
        "id": "c",
        "text": "72 Wh"
      },
      {
        "id": "d",
        "text": "82 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 18 W × (4 jam/hari × 4 hari) = 72 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-14-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-14",
    "hotspotTitle": "Kecamatan Pontianak Barat",
    "missionTags": [
      "kota-pontianak",
      "sim-14",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 380 gram air dipanaskan sehingga suhunya naik 110°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "20900 kalori"
      },
      {
        "id": "b",
        "text": "62700 kalori"
      },
      {
        "id": "c",
        "text": "41800 kalori"
      },
      {
        "id": "d",
        "text": "41810 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 380 × 1 × 110 = 41800 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  },
  {
    "id": "q-sim-15-mat1",
    "subject": "Matematika",
    "topicTitle": "Persentase lahan terdampak",
    "hotspotId": "sim-15",
    "hotspotTitle": "Kecamatan Pontianak Utara",
    "missionTags": [
      "kota-pontianak",
      "sim-15",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "mudah",
    "weight": 1,
    "prompt": "Dari luas lahan yang dipantau sebesar 23 hektare, sebanyak 8.05 hektare terindikasi terdampak kebakaran. Berapakah persentase lahan yang terdampak?",
    "options": [
      {
        "id": "a",
        "text": "17,50 %"
      },
      {
        "id": "b",
        "text": "52,50 %"
      },
      {
        "id": "c",
        "text": "35,00 %"
      },
      {
        "id": "d",
        "text": "45,00 %"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30%",
      "Waspada: lebih dari 10% sampai dengan 30%",
      "Aman: 10% atau kurang"
    ],
    "explanation": "Persentase = (luas terdampak ÷ luas total) × 100% = (8.05 ÷ 23) × 100% = 35.0%. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30%.",
    "stemChoInsight": "Data persentase membantu petugas memperkirakan bagian lahan yang terdampak. Pembakaran bahan organik melepaskan karbon (C), sedangkan kandungan air yang mengandung hidrogen (H) dan oksigen (O) berkurang saat lahan mengering."
  },
  {
    "id": "q-sim-15-mat2",
    "subject": "Matematika",
    "topicTitle": "Kecepatan rata-rata penyebaran asap",
    "hotspotId": "sim-15",
    "hotspotTitle": "Kecamatan Pontianak Utara",
    "missionTags": [
      "kota-pontianak",
      "sim-15",
      "matematika"
    ],
    "stemCategory": "M",
    "stemLabel": "Mathematics",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Asap terpantau menyebar sejauh 2.6 km dalam waktu 13 menit. Jika kecepatannya tetap, berapakah kecepatan rata-rata asap dalam km/jam?",
    "options": [
      {
        "id": "a",
        "text": "6,00 km/jam"
      },
      {
        "id": "b",
        "text": "18,00 km/jam"
      },
      {
        "id": "c",
        "text": "12,00 km/jam"
      },
      {
        "id": "d",
        "text": "13,00 km/jam"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 15 km/jam",
      "Waspada: 5–15 km/jam",
      "Aman: kurang dari 5 km/jam"
    ],
    "explanation": "Waktu = 13/60 jam. Kecepatan = jarak ÷ waktu = 2.6 ÷ (13/60) = 12.0 km/jam. Berdasarkan acuan, nilai tersebut termasuk kategori waspada karena 5–15 km/jam.",
    "stemChoInsight": "Perhitungan kecepatan membantu memperkirakan seberapa cepat asap dapat mencapai permukiman. Asap hasil pembakaran dapat membawa partikel karbon (C) dan uap air yang tersusun dari hidrogen (H) serta oksigen (O)."
  },
  {
    "id": "q-sim-15-mat3",
    "subject": "Matematika",
    "topicTitle": "Volume persediaan air",
    "hotspotId": "sim-15",
    "hotspotTitle": "Kecamatan Pontianak Utara",
    "missionTags": [
      "kota-pontianak",
      "sim-15",
      "matematika"
    ],
    "stemCategory": "E",
    "stemLabel": "Engineering",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Terdapat 5 tangki air dengan kapasitas masing-masing 850 liter. Berapakah seluruh persediaan air yang tersedia untuk penanganan awal?",
    "options": [
      {
        "id": "a",
        "text": "2125 liter"
      },
      {
        "id": "b",
        "text": "6375 liter"
      },
      {
        "id": "c",
        "text": "4250 liter"
      },
      {
        "id": "d",
        "text": "4260 liter"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: kurang dari 2.000 liter",
      "Waspada: 2.000–3.999 liter",
      "Aman: 4.000 liter atau lebih"
    ],
    "explanation": "Volume total = jumlah tangki × kapasitas tiap tangki = 5 × 850 = 4250 liter. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 4.000 liter atau lebih.",
    "stemChoInsight": "Air (H₂O) mengandung hidrogen (H) dan oksigen (O) serta digunakan untuk membantu pendinginan dan pemadaman. Ketersediaan air penting untuk menghambat pembakaran bahan organik yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-15-fis1",
    "subject": "Fisika",
    "topicTitle": "Energi listrik alat pemantau",
    "hotspotId": "sim-15",
    "hotspotTitle": "Kecamatan Pontianak Utara",
    "missionTags": [
      "kota-pontianak",
      "sim-15",
      "fisika"
    ],
    "stemCategory": "T",
    "stemLabel": "Technology",
    "difficulty": "sedang",
    "weight": 1.5,
    "prompt": "Alat pemantau kualitas udara memiliki daya 20 watt dan digunakan selama 6 jam setiap hari. Berapakah energi listrik yang digunakan selama 6 hari?",
    "options": [
      {
        "id": "a",
        "text": "60 Wh"
      },
      {
        "id": "b",
        "text": "180 Wh"
      },
      {
        "id": "c",
        "text": "120 Wh"
      },
      {
        "id": "d",
        "text": "130 Wh"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 150 Wh",
      "Waspada: lebih dari 120 sampai dengan 150 Wh",
      "Aman: 120 Wh atau kurang"
    ],
    "explanation": "Energi listrik E = P × t. E = 20 W × (6 jam/hari × 6 hari) = 120 Wh. Berdasarkan acuan, nilai tersebut termasuk kategori aman karena 120 Wh atau kurang.",
    "stemChoInsight": "Daya listrik digunakan untuk mengoperasikan sensor yang memantau kondisi udara dan asap. Pemantauan dapat membantu mendeteksi peningkatan partikel hasil pembakaran yang mengandung karbon (C)."
  },
  {
    "id": "q-sim-15-fis2",
    "subject": "Fisika",
    "topicTitle": "Kalor untuk menaikkan suhu air",
    "hotspotId": "sim-15",
    "hotspotTitle": "Kecamatan Pontianak Utara",
    "missionTags": [
      "kota-pontianak",
      "sim-15",
      "fisika"
    ],
    "stemCategory": "S",
    "stemLabel": "Science",
    "difficulty": "sulit",
    "weight": 2,
    "prompt": "Dalam simulasi, 400 gram air dipanaskan sehingga suhunya naik 115°C. Jika kalor jenis air 1 kal/(g°C), berapakah kalor yang diperlukan?",
    "options": [
      {
        "id": "a",
        "text": "23000 kalori"
      },
      {
        "id": "b",
        "text": "69000 kalori"
      },
      {
        "id": "c",
        "text": "46000 kalori"
      },
      {
        "id": "d",
        "text": "46010 kalori"
      }
    ],
    "correctOptionId": "c",
    "acuan": [
      "Bahaya: lebih dari 30.000 kalori",
      "Waspada: lebih dari 10.000 sampai dengan 30.000 kalori",
      "Aman: 10.000 kalori atau kurang"
    ],
    "explanation": "Kalor Q = m × c × ΔT = 400 × 1 × 115 = 46000 kalori. Berdasarkan acuan, nilai tersebut termasuk kategori bahaya karena lebih dari 30.000 kalori.",
    "stemChoInsight": "Konsep kalor menjelaskan energi panas yang dapat menaikkan suhu air. Air tersusun dari hidrogen (H) dan oksigen (O); pengelolaan air dan panas menjadi bagian penting dalam memahami proses pengeringan lahan dan penanganan kebakaran."
  }
];
