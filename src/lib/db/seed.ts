import { saveClass, saveTestDoc, saveAnnouncementDoc } from "@/lib/db/services";
import { MOCK_CLASSES, INITIAL_ANNOUNCEMENTS } from "@/lib/classroom-store";
import { INITIAL_TESTS } from "@/lib/test-center-store";
import type { ClassDoc, JLPTTestDoc, AnnouncementDoc } from "@/lib/db/schema";

/**
 * Seed all initial realistic Shinme data to Cloud Firestore
 */
export async function seedFirestoreInitialData(): Promise<{
  classesCount: number;
  testsCount: number;
  announcementsCount: number;
}> {
  // 1. Seed Classes
  let classesCount = 0;
  for (const c of MOCK_CLASSES) {
    const classDoc: ClassDoc = {
      id: c.id,
      code: c.shortName,
      name: c.name,
      shortName: c.shortName,
      level: c.level,
      senseiId: c.senseiId,
      senseiName: c.sensei,
      schedule: c.schedule,
      time: c.time,
      room: c.room,
      totalSessions: c.totalSessions,
      completedSessions: c.completedSessions,
      studentsCount: c.studentsCount,
      currentLesson: c.currentLesson,
      currentLessonJa: c.currentLessonJa,
      createdAt: new Date().toISOString(),
    };
    await saveClass(classDoc);
    classesCount++;
  }

  // 2. Seed Tests
  let testsCount = 0;
  for (const t of INITIAL_TESTS) {
    const testDoc: JLPTTestDoc = {
      id: t.id,
      code: t.code,
      title: t.title,
      titleJa: t.titleJa,
      classId: t.classId,
      className: t.className,
      level: t.level,
      durationMinutes: t.durationMinutes,
      deadline: t.deadline,
      maxAttempts: t.maxAttempts,
      passScore: t.passScore,
      totalPoints: t.totalPoints,
      shuffleQuestions: t.shuffleQuestions,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      questions: t.questions,
    };
    await saveTestDoc(testDoc);
    testsCount++;
  }

  // 3. Seed Announcements
  let announcementsCount = 0;
  for (const a of INITIAL_ANNOUNCEMENTS) {
    const annDoc: AnnouncementDoc = {
      id: a.id,
      classId: a.classId,
      className: a.className,
      title: a.title,
      titleJa: a.titleJa,
      content: a.content,
      authorName: a.authorName,
      authorRole: a.authorRole,
      category: a.category,
      isPinned: a.isPinned,
      createdAt: a.createdAt,
    };
    await saveAnnouncementDoc(annDoc);
    announcementsCount++;
  }

  return { classesCount, testsCount, announcementsCount };
}
