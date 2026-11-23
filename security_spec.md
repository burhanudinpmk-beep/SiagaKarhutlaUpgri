# Spesifikasi Keamanan Firestore SIAGA KARHUTLA

## 1. Data Invariants (Aturan Mutlak Integritas Data)
1. **Kepemilikan Akun & Isolasi PII (`users/{userId}`)**: Tidak ada pengguna yang boleh membaca, mendaftar, atau mengubah profil `users/{userId}` milik UID lain. Field `role` terkunci pada `'student'` (pencegahan eskalasi hak akses mandiri).
2. **Kunci Jawaban & Data Master Tertutup (`questions/{questionId}`, `regions/{regionId}`, `missions/{missionId}`)**: Koleksi `questions` tertutup mutlak (`read, write: if false`) untuk seluruh klien agar kunci jawaban (`correctOptionId`) hanya berada di backend. Koleksi `regions` dan `missions` bersifat read-only bagi pengguna login dan tidak dapat ditulis oleh klien.
3. **Integritas Percobaan & Hasil Simulasi (`missionAttempts`, `simulationResults`)**: Setiap dokumen wajib menyertakan `userId == request.auth.uid`, verifikasi email aktif (`email_verified == true`), ID dokumen valid (`^[a-zA-Z0-9_\-]+$`, max 128 karakter), serta stempel waktu server (`request.time`).
4. **Pemulihan Progres & Anti-Shadow-Fields (`playerProgress/{userId}`)**: Array `completedMissionIds` dan `inProgressMissionIds` dibatasi maksimal 14 elemen string valid, seluruh kunci wajib lolos `hasAll` dan `hasOnly`, serta `createdAt` tidak dapat diubah.
5. **Keabsahan Sertifikat (`certificates/{certificateId}`)**: Dokumen sertifikat bersifat *immutable* setelah diterbitkan (`update, delete: if false`), wajib memiliki `serverVerified == true` dan `validationDigest` HMAC-SHA256 64-heksadesimal yang hanya diterbitkan backend setelah semua misi wajib tervalidasi.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection (`users`)**: Payload create/update menyertakan `{ role: 'admin', isVerified: true }` -> **DITOLAK** oleh `data.keys().hasOnly(...)` dan `data.role == 'student'`.
2. **Cross-User PII Read (`users/{victimUid}`)**: `getDoc` oleh UID penyerang terhadap profil siswa lain -> **DITOLAK** oleh `request.auth.uid == userId`.
3. **User Collection Scraping (`users`)**: `getDocs(collection(db, 'users'))` -> **DITOLAK** oleh `allow list: if false`.
4. **Answer Key Harvesting (`questions`)**: `getDoc` atau `getDocs` pada `questions` oleh siswa login -> **DITOLAK** oleh `allow read, write: if false`.
5. **Master Data Tampering (`regions`, `missions`)**: Penulisan `setDoc(doc(db, 'regions', 'kubu-raya'), ...)` oleh siswa -> **DITOLAK** oleh `allow write: if false`.
6. **ID Poisoning (>128 chars / path chars)**: Penulisan `missionAttempts/{'a'.repeat(300)}` -> **DITOLAK** oleh `isValidId()`.
7. **Unverified Email Spoof Write**: Token autentikasi dengan `email_verified: false` mencoba menulis `playerProgress` -> **DITOLAK** oleh `request.auth.token.email_verified == true`.
8. **Ownership Spoofing (`simulationResults`)**: Siswa A membuat `simulationResults` dengan `userId: 'victim_uid'` -> **DITOLAK** oleh `incoming().userId == request.auth.uid`.
9. **Unbounded Array / DoW Attack (`playerProgress`)**: Mengirim `completedMissionIds` berisi 500 elemen -> **DITOLAK** oleh `data.completedMissionIds.size() <= 14`.
10. **Client Timestamp Forgery**: Mengirim `createdAt: Timestamp.fromMillis(0)` alih-alih `serverTimestamp()` -> **DITOLAK** oleh `incoming().createdAt == request.time`.
11. **Certificate Forgery / Tampering (`certificates`)**: Mencoba `updateDoc` skor atau menghapus `certificates/{id}` atau menulis `serverVerified: false` -> **DITOLAK** oleh `allow update, delete: if false` dan `incoming().serverVerified == true` + `validationDigest` regex 64-hex.
12. **Unscoped List Query (`missionAttempts`, `simulationResults`, `certificates`)**: Menjalankan `getDocs(collection(db, 'simulationResults'))` tanpa filter `where('userId', '==', uid)` -> **DITOLAK** oleh `allow list: if isSignedIn() && existing().userId == request.auth.uid`.
