import type {
  CaseStudyItem,
  CommanderArchetype,
  CommanderProfile,
  EnvironmentConditionMetric,
} from '../types/mission';

export const FICTIONAL_COMMANDERS: Record<CommanderArchetype, CommanderProfile> = {
  coastal: {
    id: 'cmd-coastal',
    name: 'Raka Wiratama',
    fictionalRole: 'Koordinator Simulasi Sektor Pesisir & Delta',
    sectorLabel: 'Koridor Pesisir & Delta Kapuas',
    disclaimer: 'Karakter fiktif skenario edukasi · Bukan representasi pejabat resmi',
    isFictional: true,
    archetype: 'coastal',
  },
  southern: {
    id: 'cmd-southern',
    name: 'Diah Pramesti',
    fictionalRole: 'Pengarah Simulasi Sektor Gambut Selatan',
    sectorLabel: 'Koridor Pawan–Kendawangan & Kayong',
    disclaimer: 'Karakter fiktif skenario edukasi · Bukan representasi pejabat resmi',
    isFictional: true,
    archetype: 'southern',
  },
  central: {
    id: 'cmd-central',
    name: 'Bima Setyawan',
    fictionalRole: 'Analis Simulasi Lembah Kapuas Tengah',
    sectorLabel: 'Koridor Sanggau, Sekadau, Sintang & Melawi',
    disclaimer: 'Karakter fiktif skenario edukasi · Bukan representasi pejabat resmi',
    isFictional: true,
    archetype: 'central',
  },
  northern: {
    id: 'cmd-northern',
    name: 'Nadia Kusuma',
    fictionalRole: 'Perencana Simulasi Sektor Utara & Hulu',
    sectorLabel: 'Koridor Sambas, Bengkayang & Kapuas Hulu',
    disclaimer: 'Karakter fiktif skenario edukasi · Bukan representasi pejabat resmi',
    isFictional: true,
    archetype: 'northern',
  },
};

export interface RegionBriefingContent {
  regionId: string;
  commanderArchetype: CommanderArchetype;
  defaultLandType: string;
  defaultMissionCode: string;
  defaultScenarioTitle: string;
  dialogOpening: string;
  dialogTechnical: string;
  dialogClosing: string;
  environmentSummary: string;
  environmentMetrics: EnvironmentConditionMetric[];
  caseStudies: [CaseStudyItem, CaseStudyItem];
}

export const REGION_BRIEFING_CONTENT: Record<string, RegionBriefingContent> = {
  'kubu-raya': {
    regionId: 'kubu-raya',
    commanderArchetype: 'coastal',
    defaultLandType: 'Lahan Gambut Dalam',
    defaultMissionCode: 'SIM-KB-01',
    defaultScenarioTitle: 'Pengendalian Kubah Gambut Kuala Dua',
    dialogOpening:
      'Selamat bertugas di Sektor Delta Kubu Raya. Anda menangani kawasan kubah gambut dalam yang sangat sensitif terhadap penurunan muka air tanah.',
    dialogTechnical:
      'Pada skenario ini, jaringan kanal drainase di sekitar Kuala Dua mengalami pengeringan cepat sehingga api mudah menjalar di bawah permukaan tanah gambut.',
    dialogClosing:
      'Pelajari dua studi kasus perlindungan koridor gambut dan jalur udara sebelum membuka ruang analisis GIS.',
    environmentSummary:
      'Kondisi awal menunjukkan kubah gambut pesisir dengan porositas tinggi, muka air tanah berada di bawah ambang aman 40 cm, dan embusan angin barat daya menuju permukiman.',
    environmentMetrics: [
      { label: 'Muka Air Tanah Gambut', value: '-58 cm', note: 'Di bawah batas kritis -40 cm' },
      { label: 'Kelembapan Serasah', value: '24%', note: 'Bahan bakar permukaan mudah tersulut' },
      { label: 'Kecepatan Angin Pesisir', value: '18 km/jam', note: 'Arah barat daya ke timur laut' },
      { label: 'Jarak Sumber Air Terdekat', value: '1,4 km', note: 'Kanal primer Sungai Kapuas Kecil' },
    ],
    caseStudies: [
      {
        id: 'cs-kubu-1',
        code: 'Studi Kasus 01',
        title: 'Penurunan Muka Air Kanal pada Kubah Gambut Kuala Dua',
        category: 'Hidrologi Gambut & Pencegahan',
        narrative:
          'Kanal drainase tanpa sekat mempercepat keluarnya air cadangan dari kubah gambut selama puncak kemarau. Ketika lapisan atas gambut mengering, oksidasi meningkat dan bara api bawah permukaan sulit dipadamkan dari udara.',
        stemFocusLabel: 'Science & Engineering',
        keyQuestion:
          'Di titik pertemuan kanal mana sekat air (canal blocking) paling efektif menahan penurunan muka air tanah?',
      },
      {
        id: 'cs-kubu-2',
        code: 'Studi Kasus 02',
        title: 'Proteksi Koridor Permukiman dan Jalur Penerbangan Supadio',
        category: 'Mitigasi Asap & Tata Ruang',
        narrative:
          'Arah angin musiman berpotensi membawa partikulat asap gambut melintasi jalur transportasi utama dan kawasan bandara di Sungai Raya. Prioritas penyekatan bakar perlu memperhatikan jarak zona penyangga terhadap permukiman.',
        stemFocusLabel: 'Technology & Mathematics',
        keyQuestion:
          'Berapa lebar minimal zona penyangga dan prioritas pos pantau agar sebaran asap tidak menutup koridor strategis?',
      },
    ],
  },
  ketapang: {
    regionId: 'ketapang',
    commanderArchetype: 'southern',
    defaultLandType: 'Rawa Gambut Selatan',
    defaultMissionCode: 'SIM-KB-02',
    defaultScenarioTitle: 'Koridor Pemantauan Pawan–Kendawangan',
    dialogOpening:
      'Selamat datang di Sektor Selatan Ketapang. Bentang wilayah seluas lebih dari tiga puluh satu ribu kilometer persegi ini menuntut ketepatan alokasi sumber daya.',
    dialogTechnical:
      'Titik simulasi berada pada jalur rawa gambut dan lahan terbuka di antara Sungai Pawan dan Kendawangan dengan akses jalan darat yang berjauhan.',
    dialogClosing:
      'Tinjau dua studi kasus tentang jarak mobilisasi dan penempatan embung air sebelum memulai simulasi spasial.',
    environmentSummary:
      'Sektor selatan menghadapi hari tanpa hujan berturut-turut, dominasi semak belukar kering di lahan bekas tebangan, serta jarak antarpos pemantau yang cukup jauh.',
    environmentMetrics: [
      { label: 'Muka Air Tanah Rawa', value: '-64 cm', note: 'Zona gambut selatan mengering' },
      { label: 'Suhu Permukaan Lahan', value: '35,2 °C', note: 'Radiasi siang hari tinggi' },
      { label: 'Jarak Posko Terdekat', value: '14,5 km', note: 'Akses koridor Matan Hilir' },
      { label: 'Tutupan Semak Kering', value: '47%', note: 'Lahan terbuka rawan rambat cepat' },
    ],
    caseStudies: [
      {
        id: 'cs-ketapang-1',
        code: 'Studi Kasus 01',
        title: 'Kesenjangan Akses Mobilisasi Tim di Koridor Pawan–Kendawangan',
        category: 'Logistik & Analisis Jarak',
        narrative:
          'Luasnya sektor Ketapang menyebabkan waktu tempuh tim darat menuju kantong gambut pedalaman melebihi batas respons ideal jika hanya mengandalkan posko pusat kota.',
        stemFocusLabel: 'Mathematics & Technology',
        keyQuestion:
          'Bagaimana membagi klaster pos pemantauan agar radius jangkau setiap titik simulasi tetap di bawah ambang 10 km?',
      },
      {
        id: 'cs-ketapang-2',
        code: 'Studi Kasus 02',
        title: 'Penempatan Embung Air Taktis pada Lahan Mineral–Gambut',
        category: 'Rekayasa Pasokan Air',
        narrative:
          'Pada zona transisi antara rawa gambut dan lahan mineral yang tidak terhubung anak sungai utama, pompa bertekanan tinggi membutuhkan tandon atau embung cadangan yang mampu bertahan beberapa hari.',
        stemFocusLabel: 'Engineering & Science',
        keyQuestion:
          'Kriteria topografi dan daya tampung tanah apa yang menentukan lokasi embung air paling efisien?',
      },
    ],
  },
  'kayong-utara': {
    regionId: 'kayong-utara',
    commanderArchetype: 'southern',
    defaultLandType: 'Gambut Penyangga Konservasi',
    defaultMissionCode: 'SIM-KB-03',
    defaultScenarioTitle: 'Penyangga Taman Nasional Gunung Palung',
    dialogOpening:
      'Sektor Kayong Utara memegang peran krusial sebagai sabuk penyangga langsung kawasan konservasi Taman Nasional Gunung Palung.',
    dialogTechnical:
      'Pada titik simulasi Simpang Hilir ini, api permukaan dari lahan semak pesisir berisiko menembus batas gambut hutan konservasi.',
    dialogClosing:
      'Cermati kedua studi kasus perlindungan kawasan lindung dan pembasahan gambut sebelum masuk ke ruang GIS.',
    environmentSummary:
      'Bentang gambut pesisir berbatasan langsung dengan hutan dataran rendah Gunung Palung; angin laut siang hari mendorong potensi penjalaran api ke arah perbukitan.',
    environmentMetrics: [
      { label: 'Muka Air Tanah Penyangga', value: '-52 cm', note: 'Rentan di sisi luar taman nasional' },
      { label: 'Kelembapan Relatif Udara', value: '51%', note: 'Menurun tajam pada siang hari' },
      { label: 'Kecepatan Angin Laut', value: '16 km/jam', note: 'Mengarah ke timur laut (kaki gunung)' },
      { label: 'Jarak ke Batas Konservasi', value: '2,3 km', note: 'Zona penyangga prioritas tinggi' },
    ],
    caseStudies: [
      {
        id: 'cs-kayong-1',
        code: 'Studi Kasus 01',
        title: 'Pertahanan Zona Penyangga Hutan Konservasi Gunung Palung',
        category: 'Ekologi Konservasi & Sekat Bakar',
        narrative:
          'Kebakaran berulang di lahan terlantar luar batas taman nasional mengancam tepian hutan primer yang menjadi habitat satwa endemik Kalimantan Barat.',
        stemFocusLabel: 'Science & Engineering',
        keyQuestion:
          'Kombinasi sekat bakar hijau dan jalur patroli seperti apa yang paling efektif memutus rambatan api sebelum mencapai batas taman nasional?',
      },
      {
        id: 'cs-kayong-2',
        code: 'Studi Kasus 02',
        title: 'Pembasahan Gambut Berbasis Pompa Pasang Surut Teluk Batang',
        category: 'Hidrologi Pesisir',
        narrative:
          'Kawasan Simpang Hilir hingga Teluk Batang memiliki pengaruh pasang surut air sungai yang dapat dimanfaatkan untuk menjaga kejenuhan air pada parit penyangga.',
        stemFocusLabel: 'Engineering & Mathematics',
        keyQuestion:
          'Bagaimana memperhitungkan siklus pasang surut untuk menjaga tinggi muka air kanal tetap stabil di atas -35 cm?',
      },
    ],
  },
  sintang: {
    regionId: 'sintang',
    commanderArchetype: 'central',
    defaultLandType: 'Lembah Aluvial & Semak Sekunder',
    defaultMissionCode: 'SIM-KB-04',
    defaultScenarioTitle: 'Pemantauan Koridor Pertemuan Kapuas–Melawi',
    dialogOpening:
      'Anda kini berada di Sektor Sintang, titik temu antara Sungai Kapuas dan Sungai Melawi dengan lanskap lembah aluvial serta perbukitan.',
    dialogTechnical:
      'Tantangan utama di sini bukan gambut dalam, melainkan mosaik semak belukar kering dan lahan terbuka di sepanjang koridor jalur transportasi darat.',
    dialogClosing:
      'Pelajari dua studi kasus pengendalian api permukaan dan sistem peringatan komunitas sebelum menganalisis peta GIS.',
    environmentSummary:
      'Vegetasi sekunder campuran dan rawa lebak mulai mengering pada peralihan musim, disertai aktivitas koridor jalan darat yang memicu kerawanan di pinggir hutan.',
    environmentMetrics: [
      { label: 'Indeks Kekeringan Vegetasi', value: 'Sedang-Tinggi', note: 'Serasah semak sekunder mengering' },
      { label: 'Kelembapan Udara Lembah', value: '58%', note: 'Kabut pagi cepat menguap' },
      { label: 'Akses Sungai Utama', value: '0,9 km', note: 'Dekat aliran Sungai Kapuas–Melawi' },
      { label: 'Kepadatan Jalan Akses', value: 'Tinggi', note: 'Koridor perlintasan darat aktif' },
    ],
    caseStudies: [
      {
        id: 'cs-sintang-1',
        code: 'Studi Kasus 01',
        title: 'Rambatan Api Permukaan pada Mosaik Lahan Terbuka Sepanjang Jalan',
        category: 'Ekologi Vegetasi Sekunder',
        narrative:
          'Berbeda dari gambut yang membara di bawah tanah, semak belukar dan ilalang di lembah Sintang menyebarkan api permukaan dengan sangat cepat saat angin siang bertiup.',
        stemFocusLabel: 'Science & Technology',
        keyQuestion:
          'Indikator tutupan lahan apa yang membedakan zona semak cepat terbakar dari hutan sekunder lembap pada citra GIS?',
      },
      {
        id: 'cs-sintang-2',
        code: 'Studi Kasus 02',
        title: 'Koordinasi Pos Masyarakat Peduli Api Lintas Sungai Melawi',
        category: 'Sistem Peringatan Dini',
        narrative:
          'Penyeberangan sungai memperlambat mobilisasi kendaraan pemadam besar, sehingga deteksi dini oleh pos komunitas di tepi sungai menjadi penentu keberhasilan pemadaman awal.',
        stemFocusLabel: 'Engineering & Mathematics',
        keyQuestion:
          'Bagaimana menghitung kebutuhan minimum pos komunitas berdasarkan waktu respons perahu patroli sungai?',
      },
    ],
  },
  sambas: {
    regionId: 'sambas',
    commanderArchetype: 'northern',
    defaultLandType: 'Lahan Basah Pesisir',
    defaultMissionCode: 'SIM-KB-05',
    defaultScenarioTitle: 'Pengawasan Angin Pesisir Paloh–Sambas',
    dialogOpening:
      'Selamat datang di Sektor Pesisir Utara Sambas. Wilayah ini berhadapan langsung dengan dinamika angin laut dari Laut Natuna Selatan.',
    dialogTechnical:
      'Kantong gambut dangkal dan tanah berpasir di pesisir Paloh serta Subah mudah kehilangan kadar air apabila saluran pertanian mengering.',
    dialogClosing:
      'Tinjau dua studi kasus tentang pengaruh vektor angin pesisir dan tata kelola lahan tanpa bakar sebelum masuk ruang simulasi.',
    environmentSummary:
      'Angin laut yang konsisten dari barat laut berpotensi mempercepat penjalaran api permukaan di zona lahan pertanian pesisir dan semak pantai.',
    environmentMetrics: [
      { label: 'Kecepatan Angin Laut', value: '22 km/jam', note: 'Hembusan konsisten dari barat laut' },
      { label: 'Kadar Air Lahan Berpasir', value: '31%', note: 'Lapisan atas cepat mengering' },
      { label: 'Elevasi Pesisir', value: '3 mdpl', note: 'Dataran rendah pesisir utara' },
      { label: 'Jarak ke Hutan Mangrove', value: '3,1 km', note: 'Sabuk hijau pantai barat' },
    ],
    caseStudies: [
      {
        id: 'cs-sambas-1',
        code: 'Studi Kasus 01',
        title: 'Pemodelan Vektor Angin Laut terhadap Arah Sekat Bakar Pesisir',
        category: 'Mikroklimat & Pemodelan',
        narrative:
          'Pada kawasan pesisir terbuka tanpa penghalang tajuk tinggi, kecepatan dan arah angin laut mengubah bentuk penjalaran api menjadi elips memanjang ke arah daratan.',
        stemFocusLabel: 'Mathematics & Science',
        keyQuestion:
          'Bagaimana orientasi sudut sekat bakar seharusnya diarahkan relatif terhadap vektor angin dominan dari barat laut?',
      },
      {
        id: 'cs-sambas-2',
        code: 'Studi Kasus 02',
        title: 'Tata Air Mikro Pertanian Pesisir Tanpa Bakar di Sektor Subah',
        category: 'Rekayasa Pertanian Berkelanjutan',
        narrative:
          'Saluran irigasi tersier yang dilengkapi pintu air sederhana mampu mempertahankan kelembapan lahan budidaya sekaligus menyediakan air pemadaman darurat.',
        stemFocusLabel: 'Engineering & Technology',
        keyQuestion:
          'Jarak antar-pintu air berapa meter yang paling efektif untuk menjaga kelembapan petak lahan pesisir?',
      },
    ],
  },
  mempawah: {
    regionId: 'mempawah',
    commanderArchetype: 'coastal',
    defaultLandType: 'Gambut Terfragmentasi Pesisir',
    defaultMissionCode: 'SIM-KB-06',
    defaultScenarioTitle: 'Pengaturan Pintu Air Gambut Anjongan',
    dialogOpening:
      'Anda masuk ke Sektor Mempawah, jalur penghubung pesisir barat yang memiliki kantong gambut terfragmentasi di antara permukiman dan perkebunan.',
    dialogTechnical:
      'Fragmentasi kanal di sekitar Sungai Pinyuh dan Anjongan membuat sebagian petak gambut mengering lebih cepat dibandingkan petak di sebelahnya.',
    dialogClosing:
      'Tinjau dua studi kasus pengaturan pintu air dan pengawasan koridor jalan sebelum membuka pusat analisis GIS.',
    environmentSummary:
      'Lahan gambut pesisir yang terpotong jalan raya dan saluran drainase memperlihatkan variasi tinggi muka air antarblok yang memerlukan koordinasi terpadu.',
    environmentMetrics: [
      { label: 'Muka Air Tanah Antarblok', value: '-41 cm', note: 'Fluktuatif di sisi kanal terbuka' },
      { label: 'Kelembapan Udara Pesisir', value: '62%', note: 'Sedang, menurun pada siang terik' },
      { label: 'Akses Jalan Utama', value: '0,6 km', note: 'Jalur lintas Pontianak–Singkawang' },
      { label: 'Jarak ke Muara Sungai', value: '4,2 km', note: 'Pengaruh air payau saat pasang' },
    ],
    caseStudies: [
      {
        id: 'cs-mempawah-1',
        code: 'Studi Kasus 01',
        title: 'Pengaruh Salinitas Air Pasang terhadap Kebasahan Gambut Pesisir',
        category: 'Kimia Tanah & Hidrologi',
        narrative:
          'Memasukkan air payau saat pasang ke kanal gambut membantu pemadaman darurat, namun pengaturan pintu air satu arah tetap diperlukan agar lahan pertanian tidak mengalami salinisasi berlebih.',
        stemFocusLabel: 'Science & Engineering',
        keyQuestion:
          'Kapan pintu air kanal harus dibuka dan ditutup untuk menyeimbangkan pencegahan api dan kualitas air lahan?',
      },
      {
        id: 'cs-mempawah-2',
        code: 'Studi Kasus 02',
        title: 'Optimasi Waktu Respons Sepanjang Koridor Sungai Pinyuh–Anjongan',
        category: 'Analisis Jaringan Spasial',
        narrative:
          'Kepadatan lalu lintas di jalur lintas barat dapat menghambat mobilisasi truk tangki apabila lokasi pengambilan air tidak dipetakan di sisi jalan yang tepat.',
        stemFocusLabel: 'Technology & Mathematics',
        keyQuestion:
          'Titik hidran kanal mana yang menghasilkan waktu tempuh paling singkat ke seluruh blok rawan?',
      },
    ],
  },
  bengkayang: {
    regionId: 'bengkayang',
    commanderArchetype: 'northern',
    defaultLandType: 'Perbukitan Semak & Ilalang',
    defaultMissionCode: 'SIM-KB-07',
    defaultScenarioTitle: 'Mitigasi Lereng Sanggau Ledo',
    dialogOpening:
      'Selamat bertugas di Sektor Bengkayang. Topografi wilayah ini didominasi perbukitan curam dan padang ilalang terbuka di utara Kalimantan Barat.',
    dialogTechnical:
      'Api pada lereng perbukitan Sanggau Ledo bergerak jauh lebih cepat ke arah puncak karena konveksi panas mendorong pengeringan bahan bakar di atasnya.',
    dialogClosing:
      'Periksa dua studi kasus dinamika api lereng dan pengawasan perbatasan sebelum memasuki analisis GIS.',
    environmentSummary:
      'Kombinasi kemiringan lereng antara 15%–30% dengan tutupan ilalang kering menciptakan risiko penjalaran cepat ke arah punggung bukit.',
    environmentMetrics: [
      { label: 'Kemiringan Lereng Sektor', value: '18%', note: 'Mempercepat penjalaran ke puncak' },
      { label: 'Kelembapan Ilalang', value: '29%', note: 'Sangat cepat terbakar saat siang' },
      { label: 'Elevasi Lokasi', value: '240 mdpl', note: 'Zona perbukitan Sanggau Ledo' },
      { label: 'Jarak Sumber Air Lembah', value: '1,9 km', note: 'Membutuhkan pompa dorong vertikal' },
    ],
    caseStudies: [
      {
        id: 'cs-bengkayang-1',
        code: 'Studi Kasus 01',
        title: 'Efek Kemiringan Lereng terhadap Kecepatan Rambatan Api',
        category: 'Fisika Kebakaran & Topografi',
        narrative:
          'Pada setiap kenaikan kemiringan lereng 10 derajat, lidah api semakin dekat ke vegetasi di bagian atas lereng sehingga proses pemanasan awal terjadi jauh lebih cepat.',
        stemFocusLabel: 'Science & Mathematics',
        keyQuestion:
          'Mengapa pembuatan sekat bakar darurat harus ditempatkan di punggung bukit atau sisi seberang puncak dibandingkan tepat di jalur naik api?',
      },
      {
        id: 'cs-bengkayang-2',
        code: 'Studi Kasus 02',
        title: 'Embung Tangkapan Air Hujan Bergravitasi untuk Lereng Utara',
        category: 'Rekayasa Pasokan Air',
        narrative:
          'Mengalirkan air dari lembah ke puncak bukit membutuhkan energi pompa besar, sedangkan penampungan air hujan di elevasi tinggi memanfaatkan gravitasi saat darurat.',
        stemFocusLabel: 'Engineering & Technology',
        keyQuestion:
          'Di kontur ketinggian berapa embung bergravitasi dapat melayani dua sisi lembah sekaligus?',
      },
    ],
  },
  landak: {
    regionId: 'landak',
    commanderArchetype: 'central',
    defaultLandType: 'Hutan Sekunder Terbuka',
    defaultMissionCode: 'SIM-KB-08',
    defaultScenarioTitle: 'Penyangga Cagar Alam Mandor',
    dialogOpening:
      'Anda memasuki Sektor Kabupaten Landak. Fokus utama kita adalah melindungi kawasan hutan sekunder serta penyangga Cagar Alam Mandor.',
    dialogTechnical:
      'Lahan berpasir dan semak di koridor Ngabang–Mandor memiliki daya simpan air yang rendah pada musim kemarau panjang.',
    dialogClosing:
      'Simak dua studi kasus pelestarian cagar alam dan pemetaan pos DAS Landak sebelum membuka alat simulasi GIS.',
    environmentSummary:
      'Cekungan Sungai Landak memperlihatkan penurunan kelembapan serasah hutan sekunder di tepian kawasan lindung dengan akses sungai lokal yang masih dapat dimanfaatkan.',
    environmentMetrics: [
      { label: 'Kelembapan Serasah Hutan', value: '38%', note: 'Menurun di tepi hutan terbuka' },
      { label: 'Hari Tanpa Hujan', value: '14 hari', note: 'Memasuki kategori kering sedang' },
      { label: 'Jarak ke Cagar Alam', value: '1,7 km', note: 'Koridor penyangga Mandor' },
      { label: 'Debit Sungai Landak', value: 'Stabil', note: 'Dapat diakses pompa portabel' },
    ],
    caseStudies: [
      {
        id: 'cs-landak-1',
        code: 'Studi Kasus 01',
        title: 'Perlindungan Tepi Hutan (Edge Effect) di Cagar Alam Mandor',
        category: 'Ekologi Hutan Tropis',
        narrative:
          'Pembukaan lahan di tepi cagar alam membuat sinar matahari dan angin masuk lebih dalam ke lantai hutan, mengeringkan serasah yang sebelumnya lembap.',
        stemFocusLabel: 'Science & Technology',
        keyQuestion:
          'Berapa kedalaman zona tepi yang harus dipantau secara prioritas menggunakan indeks vegetasi GIS?',
      },
      {
        id: 'cs-landak-2',
        code: 'Studi Kasus 02',
        title: 'Penempatan Titik Pompa Portabel di Aliran Sungai Landak',
        category: 'Teknik Pemadaman Lapangan',
        narrative:
          'Pompa air portabel memiliki batas panjang selang efektif sebelum kehilangan tekanan akibat gesekan dan beda tinggi medan.',
        stemFocusLabel: 'Engineering & Mathematics',
        keyQuestion:
          'Jika panjang selang efektif maksimum 600 meter, berapa jarak maksimum antar-titik akses sungai agar seluruh sektor terlindungi?',
      },
    ],
  },
  melawi: {
    regionId: 'melawi',
    commanderArchetype: 'central',
    defaultLandType: 'Hutan Perbukitan Sekunder',
    defaultMissionCode: 'SIM-KB-09',
    defaultScenarioTitle: 'Penyangga Bukit Baka–Bukit Raya',
    dialogOpening:
      'Selamat bertugas di Sektor Melawi. Wilayah selatan ini merupakan koridor penting menuju Taman Nasional Bukit Baka–Bukit Raya.',
    dialogTechnical:
      'Kombinasi lembah Sungai Melawi yang hangat dan lereng perbukitan Schwaner membutuhkan pemantauan visual dari elevasi tinggi.',
    dialogClosing:
      'Pelajari dua studi kasus jarak pandang menara pantau dan pengendalian pembukaan ladang lereng sebelum menuju ruang GIS.',
    environmentSummary:
      'Lembah Sungai Pinoh dan Melawi berada pada kondisi kelembapan transisi, dengan hutan perbukitan yang relatif lembap di ketinggian namun rentan di lembah terbuka.',
    environmentMetrics: [
      { label: 'Suhu Lembah Siang', value: '33,4 °C', note: 'Lebih hangat dibanding puncak bukit' },
      { label: 'Kelembapan Tajuk Atas', value: '67%', note: 'Kanopi primer masih cukup lembap' },
      { label: 'Jarak ke Taman Nasional', value: '4,8 km', note: 'Zona penyangga Nanga Pinoh selatan' },
      { label: 'Jangkauan Pandang Menara', value: '8,5 km', note: 'Dari titik elevasi bukit pantau' },
    ],
    caseStudies: [
      {
        id: 'cs-melawi-1',
        code: 'Studi Kasus 01',
        title: 'Optimasi Jarak Pandang Menara Pengawas pada Medan Berbukit',
        category: 'Geometri Spasial & GIS',
        narrative:
          'Punggung bukit dapat menghalangi garis pandang (line of sight) menara pengawas terhadap kepulan asap awal di lembah tersembunyi.',
        stemFocusLabel: 'Technology & Mathematics',
        keyQuestion:
          'Bagaimana analisis kontur GIS menentukan titik puncak terbaik untuk meminimalkan area titik buta (blind spot)?',
      },
      {
        id: 'cs-melawi-2',
        code: 'Studi Kasus 02',
        title: 'Pengendalian Api Terkontrol pada Koridor Perladangan Lembah',
        category: 'Mitigasi Berbasis Ekosistem',
        narrative:
          'Pengelolaan bahan bakar serasah di batas ladang dan hutan sekunder mencegah lompatan api ke kawasan penyangga Bukit Baka–Bukit Raya.',
        stemFocusLabel: 'Science & Engineering',
        keyQuestion:
          'Sekat bakar vegetasi jenis apa yang tetap produktif secara ekonomi sekaligus tahan terhadap rambatan api?',
      },
    ],
  },
  'kota-pontianak': {
    regionId: 'kota-pontianak',
    commanderArchetype: 'coastal',
    defaultLandType: 'Gambut Dangkal Perkotaan',
    defaultMissionCode: 'SIM-KB-10',
    defaultScenarioTitle: 'Pengendalian Gambut Pinggiran Utara',
    dialogOpening:
      'Anda ditugaskan pada Sektor Kota Pontianak tepat di garis khatulistiwa, titik pertemuan Sungai Kapuas Besar dan Sungai Landak.',
    dialogTechnical:
      'Meski luasnya paling ringkas, kantong gambut pinggiran di Pontianak Utara dan Tenggara berdampak langsung pada kualitas udara kawasan padat penduduk.',
    dialogClosing:
      'Tinjau dua studi kasus kualitas udara perkotaan dan manajemen parit kota sebelum menuju pusat analisis GIS.',
    environmentSummary:
      'Kantong lahan kosong bergambut dangkal di pinggiran kota mengalami pengeringan lokal, dengan sensitivitas tinggi terhadap paparan partikulat asap PM2.5.',
    environmentMetrics: [
      { label: 'Kualitas Udara Awal (PM2.5)', value: '38 µg/m³', note: 'Masih dalam batas sedang perkotaan' },
      { label: 'Muka Air Parit Primer', value: '-32 cm', note: 'Terhubung pasang surut Kapuas' },
      { label: 'Kepadatan Permukiman', value: 'Tinggi', note: 'Radius < 500 m dari lahan terbuka' },
      { label: 'Waktu Respons Damkar', value: '12 menit', note: 'Akses jalan kota tersedia baik' },
    ],
    caseStudies: [
      {
        id: 'cs-pontianak-1',
        code: 'Studi Kasus 01',
        title: 'Dispersi Asap Gambut Perkotaan terhadap Kesehatan Publik',
        category: 'Sains Atmosfer & Kesehatan Lingkungan',
        narrative:
          'Kebakaran kecil pada gambut dangkal perkotaan menghasilkan konsentrasi asap tinggi di permukaan tanah saat terjadi inversi suhu malam hari.',
        stemFocusLabel: 'Science & Mathematics',
        keyQuestion:
          'Bagaimana menghitung radius zona waspada paparan asap berdasarkan kecepatan angin malam yang rendah?',
      },
      {
        id: 'cs-pontianak-2',
        code: 'Studi Kasus 02',
        title: 'Sumur Bor Pantau & Jaringan Parit Kapuas untuk Pemadaman Cepat',
        category: 'Infrastruktur Hidrologi Kota',
        narrative:
          'Keberadaan sumur bor dalam di lahan gambut pinggiran kota memastikan ketersediaan air bertekanan saat parit permukaan sedang surut.',
        stemFocusLabel: 'Engineering & Technology',
        keyQuestion:
          'Bagaimana memetakan kombinasi parit pasang surut dan sumur bor agar cakupan selang menjangkau 100% petak rawan?',
      },
    ],
  },
  sanggau: {
    regionId: 'sanggau',
    commanderArchetype: 'central',
    defaultLandType: 'Tanah Mineral & Hutan Lindung',
    defaultMissionCode: 'SIM-KB-11',
    defaultScenarioTitle: 'Patroli Preventif DAS Kapuas Tengah',
    dialogOpening:
      'Selamat bertugas di Sektor Sanggau. Saat ini status wilayah berada pada kondisi aman dengan tutupan hutan lindung dan tanah mineral yang relatif lembap.',
    dialogTechnical:
      'Tugas Kepala Misi pada wilayah berstatus aman adalah mempertahankan ketahanan ekosistem serta menyiapkan skema dukungan logistik lintas kabupaten.',
    dialogClosing:
      'Pelajari dua studi kasus pencegahan dini dan perbandingan ambang batas aman sebelum membuka pusat analisis GIS.',
    environmentSummary:
      'Dominasi tanah mineral lempung dan kanopi hutan primer di beberapa koridor menjaga suhu lantai hutan tetap sejuk, namun pemantauan preventif tetap diwajibkan.',
    environmentMetrics: [
      { label: 'Kelembapan Kanopi Hutan', value: '74%', note: 'Kondisi stabil dan terkendali' },
      { label: 'Suhu Lantai Hutan', value: '27,8 °C', note: 'Naungan tajuk rapat terjaga' },
      { label: 'Status Pasokan Air DAS', value: 'Melimpah', note: 'Aliran Sungai Kapuas Tengah normal' },
      { label: 'Kesiapan Regu Preventif', value: 'Siaga', note: 'Patroli rutin lintas kecamatan' },
    ],
    caseStudies: [
      {
        id: 'cs-sanggau-1',
        code: 'Studi Kasus 01',
        title: 'Peran Tajuk Hutan Primer sebagai Peredam Iklim Mikro',
        category: 'Ekologi Hutan Tropis',
        narrative:
          'Kanopi bertingkat di hutan lindung Sanggau menahan sinar matahari langsung dan mempertahankan kelembapan relatif tinggi sehingga serasah sulit terbakar.',
        stemFocusLabel: 'Science & Technology',
        keyQuestion:
          'Bagaimana perbedaan nilai indeks vegetasi antara hutan lindung rapat dan koridor perkebunan terbuka di sekitarnya?',
      },
      {
        id: 'cs-sanggau-2',
        code: 'Studi Kasus 02',
        title: 'Skema Dukungan Logistik Air dari Wilayah Aman ke Sektor Waspada',
        category: 'Manajemen Sumber Daya Strategis',
        narrative:
          'Karena koridor tengah relatif terkendali, Sanggau berperan strategis sebagai basis penyuplai peralatan cadangan bagi kabupaten tetangga saat puncak kemarau.',
        stemFocusLabel: 'Mathematics & Engineering',
        keyQuestion:
          'Berapa porsi kapasitas regu dan pompa yang aman digeser ke wilayah tetangga tanpa menurunkan kesiagaan lokal?',
      },
    ],
  },
  sekadau: {
    regionId: 'sekadau',
    commanderArchetype: 'central',
    defaultLandType: 'Lembah Sungai Mineral',
    defaultMissionCode: 'SIM-KB-12',
    defaultScenarioTitle: 'Kesiapsiagaan Desa Siaga Api Belitang',
    dialogOpening:
      'Anda masuk ke Sektor Sekadau di tepian Sungai Kapuas dan Sungai Sekadau. Wilayah ini berstatus aman dengan dukungan sumber air sungai yang baik.',
    dialogTechnical:
      'Fokus pengarahan kita adalah memastikan desa-desa di sepanjang Belitang dan Sekadau Hilir mempertahankan praktik pengelolaan lahan tanpa bakar.',
    dialogClosing:
      'Tinjau dua studi kasus sistem tandon desa dan audit akses sungai sebelum memulai analisis GIS.',
    environmentSummary:
      'Tanah mineral aluvial mempertahankan kelembapan dasar dengan baik; potensi gangguan hanya muncul pada pembukaan lahan kecil yang tidak diawasi.',
    environmentMetrics: [
      { label: 'Kelembapan Tanah Mineral', value: '68%', note: 'Dalam rentang aman preventif' },
      { label: 'Akses Sumber Air Sungai', value: '0,8 km', note: 'Jaringan anak sungai aktif' },
      { label: 'Kesiapan Tandon Desa', value: '85%', note: 'Tersebar di titik rawan lokal' },
      { label: 'Intensitas Angin Lembah', value: '9 km/jam', note: 'Tenang hingga sedang' },
    ],
    caseStudies: [
      {
        id: 'cs-sekadau-1',
        code: 'Studi Kasus 01',
        title: 'Kapasitas Tandon Air Desa Siaga Api untuk Penanganan Awal',
        category: 'Rekayasa Infrastruktur Desa',
        narrative:
          'Penempatan tandon air berkapasitas 5.000 liter pada titik jauh dari sungai memastikan regu desa dapat memadamkan percikan api dalam 15 menit pertama.',
        stemFocusLabel: 'Engineering & Mathematics',
        keyQuestion:
          'Berapa lama suplai tandon 5.000 liter bertahan jika digunakan satu unit pompa berdebit 250 liter/menit?',
      },
      {
        id: 'cs-sekadau-2',
        code: 'Studi Kasus 02',
        title: 'Pemetaan Jalur Akses Sungai sebagai Sekat Bakar Alami',
        category: 'Analisis Spasial Wilayah',
        narrative:
          'Sungai Sekadau dan anak-anak sungainya berfungsi ganda sebagai sumber air sekaligus pemutus alami penjalaran api permukaan antarpetak lahan.',
        stemFocusLabel: 'Technology & Science',
        keyQuestion:
          'Di segmen mana lebar badan sungai cukup efektif menjadi pembatas alami tanpa perlu sekat tambahan?',
      },
    ],
  },
  'kapuas-hulu': {
    regionId: 'kapuas-hulu',
    commanderArchetype: 'northern',
    defaultLandType: 'Hutan Hujan Tropis Hulu',
    defaultMissionCode: 'SIM-KB-13',
    defaultScenarioTitle: 'Konservasi Daerah Tangkapan Hulu Kapuas',
    dialogOpening:
      'Selamat datang di Sektor Hulu Sungai Kapuas, benteng konservasi terbesar Kalimantan Barat yang mencakup Danau Sentarum dan Betung Kerihun.',
    dialogTechnical:
      'Meski berstatus aman, ekosistem danau musiman Danau Sentarum mengalami penyusutan air signifikan pada kemarau panjang yang memerlukan pengawasan cermat.',
    dialogClosing:
      'Pelajari dua studi kasus fungsi hidrologis hulu dan pos pantau bertenaga surya sebelum memasuki pusat analisis GIS.',
    environmentSummary:
      'Hutan hujan tropis pegunungan menjaga kestabilan daerah tangkapan air Provinsi Kalimantan Barat; hanya tepian danau musiman yang perlu diawasi saat surut ekstrem.',
    environmentMetrics: [
      { label: 'Tutupan Tajuk Hutan Hulu', value: '86%', note: 'Integritas ekosistem sangat tinggi' },
      { label: 'Tinggi Muka Danau Sentarum', value: 'Normal', note: 'Penyangga hidrologi utama Kalbar' },
      { label: 'Kelembapan Hutan Pegunungan', value: '79%', note: 'Rendah risiko sulutan alami' },
      { label: 'Cakupan Pos Surya', value: 'Aktif', note: 'Pemantauan telemetri daerah terpencil' },
    ],
    caseStudies: [
      {
        id: 'cs-kapuashulu-1',
        code: 'Studi Kasus 01',
        title: 'Dinamika Surut Musiman Danau Sentarum dan Risiko Kebakaran Tepian',
        category: 'Hidrologi Danau & Ekosistem',
        narrative:
          'Saat puncak kemarau, danau musiman Danau Sentarum menyusut sehingga padang rumput dan hutan rawa air tawar di tepiannya menjadi lebih rentan terhadap api.',
        stemFocusLabel: 'Science & Technology',
        keyQuestion:
          'Bagaimana perubahan luas permukaan air pada citra GIS menjadi indikator awal kerawanan musiman di tepian danau?',
      },
      {
        id: 'cs-kapuashulu-2',
        code: 'Studi Kasus 02',
        title: 'Desain Pos Pemantau Konservasi Mandiri Energi di Wilayah Terpencil',
        category: 'Rekayasa Sistem Lingkungan',
        narrative:
          'Jarak yang jauh dari jaringan listrik utama menuntut pos pengawasan kehutanan memanfaatkan panel surya dan penyimpanan daya yang efisien.',
        stemFocusLabel: 'Engineering & Mathematics',
        keyQuestion:
          'Berapa kapasitas panel surya dan baterai minimum agar perangkat sensor cuaca dan radio komunikasi tetap aktif 24 jam?',
      },
    ],
  },
  'kota-singkawang': {
    regionId: 'kota-singkawang',
    commanderArchetype: 'northern',
    defaultLandType: 'Hutan Lindung Pegunungan Poteng',
    defaultMissionCode: 'SIM-KB-14',
    defaultScenarioTitle: 'Proteksi Hutan Lindung Gunung Poteng',
    dialogOpening:
      'Selamat bertugas di Sektor Kota Singkawang. Misi Anda menjaga kestabilan kawasan resapan Gunung Poteng serta lahan semak di selatan kota.',
    dialogTechnical:
      'Kontur pertemuan laut dan pegunungan menyebabkan variasi angin lokal antara siang dan malam di sepanjang kaki bukit Singkawang Selatan.',
    dialogClosing:
      'Tinjau dua studi kasus daerah tangkapan air Poteng dan akses hidran perbukitan sebelum memulai simulasi GIS.',
    environmentSummary:
      'Kawasan pegunungan Poteng berada dalam status aman dengan kelembapan baik, sementara lahan semak terbuka di bagian selatan membutuhkan patroli preventif.',
    environmentMetrics: [
      { label: 'Kelembapan Hutan Poteng', value: '73%', note: 'Menjaga cadangan air bersih kota' },
      { label: 'Angin Lembah–Gunung', value: '12 km/jam', note: 'Berbalik arah antara siang dan malam' },
      { label: 'Elevasi Kawasan Lindung', value: '420 mdpl', note: 'Kontur lereng pesisir barat' },
      { label: 'Kesiapan Kelurahan Tangguh', value: 'Aktif', note: 'Jalur komunikasi dini tersedia' },
    ],
    caseStudies: [
      {
        id: 'cs-singkawang-1',
        code: 'Studi Kasus 01',
        title: 'Dampak Kehilangan Vegetasi Lereng terhadap Cadangan Air Gunung Poteng',
        category: 'Konservasi Daerah Tangkapan Air',
        narrative:
          'Gunung Poteng adalah sumber air bersih utama warga; kebakaran di zona lereng tidak hanya merusak vegetasi tetapi juga menurunkan kapasitas resapan tanah.',
        stemFocusLabel: 'Science & Mathematics',
        keyQuestion:
          'Bagaimana penurunan luas tutupan vegetasi lereng memengaruhi proyeksi ketersediaan air pada musim kemarau berikutnya?',
      },
      {
        id: 'cs-singkawang-2',
        code: 'Studi Kasus 02',
        title: 'Penempatan Hidran Kering pada Kontur Perbukitan Singkawang Selatan',
        category: 'Rekayasa Akses Pemadaman',
        narrative:
          'Jalan menanjak yang sempit di kaki bukit menyulitkan manuver truk pemadam berkapasitas besar sehingga dibutuhkan jaringan hidran kering terhubung.',
        stemFocusLabel: 'Engineering & Technology',
        keyQuestion:
          'Pada elevasi dan jarak interval berapa sambungan hidran kering paling efektif mempercepat pengisian air di lereng?',
      },
    ],
  },
};
