# Undangan Mei & Najih — GitHub + Vercel

1. Import repository MiftahurRizqy/invitation-mei di Vercel.
2. Framework: Other. Root Directory: biarkan default (root repo). Output Directory: dist. Build Command: kosong.
3. Hubungkan Upstash Redis melalui Vercel Storage/Marketplace ke project ini. Pilih paket sesuai kebutuhan; periksa biaya di penyedia.
4. Pastikan environment variables UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN tersedia di Production (atau KV_REST_API_URL dan KV_REST_API_TOKEN). Jangan masukkan token ke GitHub.
5. Redeploy setelah database terhubung. Uji kirim ucapan dan refresh halaman.

API /api/comments berjalan sebagai Vercel Function. Ucapan disimpan di Redis, terbaru di atas; pengiriman ulang dengan request ID sama tidak membuat duplikat. Database baru dimulai kosong. Data percobaan lokal tidak diunggah.

Jalankan lokal dengan node preview.cjs; server lokal memakai data/comments.json dan terpisah dari database produksi. Nama tamu dapat diisi lewat ?to=Nama%20Tamu.

Folder .openai dan .vercel tidak perlu diunggah. Musik memakai berkas romansa-from-49.mp3 yang dimulai dari detik 49 lagu asli.

Dokumentasi: https://vercel.com/docs/project-configuration/vercel-json dan https://upstash.com/docs/redis/features/restapi
