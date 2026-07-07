# Beat 4 Beat - TODO

## UI/UX Features

### Category Image Upload

- [x] Allow users to upload an image for each category
- [x] Image acts as the category "title" header instead of text
- [x] Requirements:
  - File upload component (accept: image/\*)
  - Image cover-cropped/resized to 400x200 (2:1 header shape)
  - Stored as a compressed WebP data URL inline on the room document (no Firebase Storage needed — ~5–15 KB per image, far under Firestore's 1 MB doc limit)
  - Display image in category header on RoomPlay.tsx
  - Fallback to text title if no image uploaded
- [x] Image preview during room creation (shown in the builder header; click to replace, hover to remove)
- [x] Image compression before upload (canvas → WebP q0.8, JPEG fallback)

### Future Considerations

- [ ] Allow animated GIFs for categories?
- [ ] Category image templates/presets for common genres?
