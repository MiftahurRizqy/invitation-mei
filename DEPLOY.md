# Undangan Mei & Najih — GitHub + Vercel

1. Import repository MiftahurRizqy/invitation-mei di Vercel.
2. Framework: Other. Root Directory: biarkan default (root repo). Output Directory: dist. Build Command: kosong.
3. Hubungkan database Neon yang dipilih melalui tombol Connect di Vercel Storage ke project ini.
4. Pastikan DATABASE_URL (atau POSTGRES_URL) tersedia di environment Production. Jangan masukkan connection string ke GitHub.
5. Redeploy setelah database terhubung. Uji kirim ucapan dan refresh halaman.

API /api/comments berjalan sebagai Vercel Function. Ucapan disimpan di tabel khusus mei_najih_guestbook pada Neon, terbaru di atas. Tabel dibuat otomatis tanpa mengubah tabel lain. Pengiriman ulang dengan request ID sama tidak membuat duplikat. Data percobaan lokal tidak diunggah. Versi ini menggunakan Neon, bukan Redis; tidak memindahkan data Redis lama.

Jalankan lokal dengan node preview.cjs; server lokal memakai data/comments.json dan terpisah dari database produksi. Nama tamu dapat diisi lewat ?to=Nama%20Tamu.

Folder .openai dan .vercel tidak perlu diunggah. Musik memakai berkas romansa-from-49.mp3 yang dimulai dari detik 49 lagu asli.

Dokumentasi: https://vercel.com/docs/project-configuration/vercel-json dan https://upstash.com/docs/redis/features/restapi
