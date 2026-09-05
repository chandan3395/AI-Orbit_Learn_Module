-- Keep the database invariant aligned with API validation: lesson positions start at 1.
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_order_check";
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_order_check" CHECK ("order" > 0);

-- Supports the paginated `WHERE userId = ? ORDER BY createdAt DESC` bookmark query.
CREATE INDEX "Bookmark_userId_createdAt_idx" ON "Bookmark"("userId", "createdAt" DESC);
