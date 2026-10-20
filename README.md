# Mẩu Chuyện: website kể chuyện dạng cuộn dọc

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase. Deploy trên Vercel.

- `/` trang chủ, lưới các truyện đã xuất bản
- `/truyen/[slug]` trang đọc: hero video/ảnh, thanh tiến độ, fade-in, parallax, chia sẻ Facebook/Zalo/sao chép liên kết
- `/dang-nhap` đăng nhập email/mật khẩu và Google
- `/quan-ly` danh sách truyện của tác giả (nháp và đã đăng)
- `/quan-ly/[id]` trình soạn: thêm/xóa/kéo thả khối (đoạn văn, ảnh lớn, thư viện ảnh, trích dẫn, video), xem trước, xuất bản

## 1. Chạy trên máy (VS Code)

```bash
npm install
cp .env.example .env.local     # rồi điền URL + anon key từ Supabase > Project Settings > API
npm run dev                    # http://localhost:3000
```

Chỉ dùng `anon key`. Tuyệt đối không đưa `service_role key` vào dự án. `.env.local` đã nằm trong `.gitignore`.

## 2. Cấu hình Supabase

1. **Chạy migration:** mở `supabase/migration.sql`, dán vào *SQL Editor* và chạy. File này tạo bảng `stories`, `authors`, cập nhật `blocks`, bật RLS và đặt policy cho Storage. Dữ liệu cũ trong `story_settings` và `blocks` được chuyển sang truyện đầu tiên. Bạn có thể xóa `story_settings` sau khi kiểm tra xong.
2. **Đăng ký tài khoản** ở `/dang-nhap`, sau đó chạy câu SQL ở cuối file migration (bỏ dấu `--`, thay email) để thêm mình vào `authors`. Nếu quên, vào `/quan-ly` trang sẽ hiện sẵn câu lệnh với đúng user id của bạn.
3. **Chặn người lạ đăng ký (khuyên dùng):** *Authentication > Sign In / Providers > tắt "Allow new users to sign up"* sau khi bạn đã có tài khoản. Dù không tắt, người lạ cũng không sửa được gì vì RLS chỉ cho người trong `authors` ghi dữ liệu.
4. **Bucket `story-media`** đã tạo (public). Policy tải lên/sửa/xóa chỉ dành cho tác giả được tạo trong migration. Giới hạn mỗi tệp của gói free khoảng 50MB. Video dài nên dán link YouTube/Vimeo.
5. **URL Configuration** (*Authentication > URL Configuration*):
   - Site URL: địa chỉ Vercel của bạn, ví dụ `https://ten-ban.vercel.app`
   - Redirect URLs: `http://localhost:3000/auth/callback` và `https://ten-ban.vercel.app/auth/callback`

## 3. Đăng nhập bằng Google

1. Vào [Google Cloud Console](https://console.cloud.google.com/) > *APIs & Services > Credentials > Create credentials > OAuth client ID* (loại *Web application*).
2. *Authorized redirect URIs*: dán địa chỉ **Callback URL** hiện trong Supabase tại *Authentication > Providers > Google* (dạng `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Copy *Client ID* và *Client secret* vào Supabase ở trang Google provider, bật *Enable*, lưu lại.

## 4. Đẩy lên Git

```bash
git init
git add .
git commit -m "Khởi tạo Mẩu Chuyện"
git branch -M main
git remote add origin <link-repo-cua-ban>
git push -u origin main
```

## 5. Deploy trên Vercel

1. *Add New > Project*, chọn repo vừa push (Vercel tự nhận Next.js).
2. Thêm *Environment Variables*: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (địa chỉ website thật, không có dấu `/` ở cuối).
3. Deploy. Sau đó quay lại bước 2.5 để điền địa chỉ thật vào Supabase.

## 6. Cách viết một truyện

`/quan-ly` > *Viết truyện mới* > điền phần mở đầu, thêm các khối ở thân bài, viết kết bài > *Lưu* > *Xem trước* (mở trang đọc có dải báo "Đang xem bản nháp") > *Xuất bản*. Muốn gỡ truyện khỏi trang chủ thì bấm *Chuyển về nháp*.

## Tùy chỉnh nhanh

- Tên website và câu giới thiệu: `lib/config.ts`
- Màu sắc: `tailwind.config.ts` (mist, ink, sea, tide, sun)
- Phông chữ: `app/layout.tsx` (Fraunces cho tiêu đề, Be Vietnam Pro cho giao diện)

## Làm sau

Số liệu vui, bản đồ, timeline: thêm loại khối mới bằng cách bổ sung vào `lib/types.ts`, `components/BlockForm.tsx` và `components/StoryView.tsx`, đồng thời thêm giá trị vào ràng buộc `blocks_type_check` trong SQL.

## Lưu ý

- Nút Zalo dùng liên kết chia sẻ của Zalo Social Plugin. Nếu Zalo đổi địa chỉ, sửa trong `components/ShareButtons.tsx`.
- Ảnh xem trước khi chia sẻ (Open Graph) chỉ lấy khi ảnh mở đầu là ảnh. Nếu mở đầu là video, link chia sẻ sẽ không có ảnh.
