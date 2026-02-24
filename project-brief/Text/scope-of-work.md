Ruang Lingkup
Perancangan Sistem
Developer akan membangun sistem CRM Segmentation Tools dengan cakupan:
Pengembangan modul filtering customer berdasarkan:
Logic filter AND / OR
Brand
Historical transaction
Timeframe (Tanggal input & Tanggal pengiriman)
Demographics (Nama Customer, No. Telp dan Alamat)
Engagement Status
Customer History
Total Order Frequency
Jenis Cust (New / Repeat / Loyal)
Management
Nama CS
Sumber Leads
Integrasi API dengan sistem Perpack untuk:
Penarikan data transaksi
Penarikan data produk
Penyimpanan dan pengelolaan database menggunakan MySQL / PostgreSQL
Development dashboard summary
Spesifikasi Logic Filter Segmentasi
Segmentation Tools harus mendukung konfigurasi filter dengan ketentuan berikut:
User dapat memilih satu atau lebih produk sebagai parameter filter
User dapat menentukan periode transaksi (tanggal awal dan tanggal akhir).
Sistem mendukung penggunaan logika:
AND → Customer memenuhi seluruh kriteria yang dipilih.
OR → Customer cukup memenuhi salah satu kriteria yang dipilih
Sistem harus memastikan tidak ada duplikasi customer pada hasil akhir segmentasi.
Hasil segmentasi ditampilkan secara real-time atau near real-time setelah user melakukan sync dan filter diterapkan.
Sistem mampu menangani query dengan jumlah data besar tanpa menyebabkan crash atau timeout berlebihan.
Dashboard & Output
Dashboard akan menampilkan:
Hasil segmentasi berdasarkan filter yang dipilih
Jumlah customer hasil segmentasi
Estimasi cost campaign (jumlah customer × Rp 610,-)
Data engagement dari Everpro (import manual), mencakup:
Nomor HP customer
Nama customer
Tanggal terakhir blast
Dengan template import sebagai berikut: Template Import Data Everpro
Sistem akan mengidentifikasi customer yang eligible untuk dilakukan blast berdasarkan filter dan data engagement dimana identifikasi customer berdasarkan unique identifier (Nomor HP).
Export Data
Fitur export hasil segmentasi dalam format CSV.
Format CSV akan disesuaikan dengan template berikut:
Format export jika user filter brand Amura OrdersExportAmura.xlsx
Format export jika user filter brand Reglow OrdersExportReglow
Integrasi API
Developer melakukan Integrasi API ke sistem Perpack
API key dan akses akan dibantu sediakan oleh tim IT Sinergi
Server disediakan oleh tim IT Sinergi
Periode Pelaksanaan
Estimasi durasi pengerjaan: -/+ 2 (dua) bulan sejak tanggal mulai development yang disepakati oleh kedua belah pihak dengan tahapan sebagai berikut:
Minggu ke 1 - Requirement & Setup
Assessment struktur dan endpoint API Perpack.
Implementasi authentication dan koneksi API.
Persiapan sinkronisasi data engagement Everpro.
Minggu ke 2 - API Assessment & Integration Preparation
Assessment struktur dan endpoint API Perpack.
Implementasi authentication dan koneksi API.
Persiapan sinkronisasi data engagement Everpro.
Minggu ke 3 & 4 - Core Development
Pengembangan modul Profile Setting dan Team Management.
Implementasi logic segmentasi dengan filter AND/OR.
Integrasi API Perpack.
Pengembangan fitur export data dalam format CSV sesuai template yang disediakan.
Minggu ke 5 - Testing & Deployment
Pelaksanaan internal testing.
Perbaikan bug apabila ditemukan ketidaksesuaian fungsi.
Deployment ke server Production yang disediakan oleh tim IT Sinergi.
Minggu ke 6 - Post Deployment Support
Monitoring sistem setelah go-live.
Bug fixing dan maintenance.
