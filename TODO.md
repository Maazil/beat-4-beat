# Beat 4 Beat - TODO

## UI/UX Features

### Category Image Upload

- [ ] Allow users to upload a square image (100x100px recommended) for each category
- [ ] Image acts as the category "title" header instead of text
- [ ] Requirements:
  - File upload component (accept: image/\*)
  - Image cropping/resizing to 100x100px
  - Store image in Firebase Storage (or similar)
  - Display image in category header on RoomPlay.tsx
  - Fallback to text title if no image uploaded
- [ ] Consider adding image preview during room creation
- [ ] Add image compression before upload to reduce storage costs

### Future Considerations

- [ ] Allow animated GIFs for categories?
- [ ] Category image templates/presets for common genres?
