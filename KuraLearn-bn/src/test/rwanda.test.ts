import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { RWANDA_NESA_GRADING_SCALE, RWANDA_PASS_MARK, gradeForPercentage } from "../config/grading.js";
import { prisma } from "../prisma/client.js";
import { normalizeRwandaPhone } from "../services/sms.service.js";

const app = createApp();
const API = "/api/v1";
const unique = `rw-${Date.now()}`;

function token(user: { id: string; role: string }, schoolId?: string) {
  return jwt.sign({ sub: user.id, tenantId: schoolId, roles: [user.role] }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
}
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

function createUser(name: string, role: "STUDENT" | "PARENT" | "TEACHER" | "SUPER_ADMIN") {
  return prisma.user.create({
    data: { name: `${unique} ${name}`, email: `${name}.${unique}@example.com`, passwordHash: "not-a-real-hash", role },
  });
}

describe("Rwanda grading preset", () => {
  it("uses grade points 6 (A) to 0 (F) and a 50% pass mark", () => {
    expect(RWANDA_PASS_MARK).toBe(50);
    expect(RWANDA_NESA_GRADING_SCALE.map((b) => [b.grade, b.points])).toEqual([
      ["A", 6], ["B", 5], ["C", 4], ["D", 3], ["E", 2], ["S", 1], ["F", 0],
    ]);
  });

  it.each([
    [100, "A"], [80, "A"], [79.995, "B"], [70, "B"], [60, "C"], [50, "D"], [49.99, "E"], [30, "S"], [29.99, "F"], [0, "F"],
  ])("grades %s%% as %s", (score, grade) => {
    expect(gradeForPercentage(score)?.grade).toBe(grade);
  });
});

describe("Rwandan phone numbers for SMS", () => {
  it.each([
    ["0788123456", "+250788123456"],
    ["788 123 456", "+250788123456"],
    ["250-722-123-456", "+250722123456"],
    ["+250731234567", "+250731234567"],
    ["0791234567", "+250791234567"],
  ])("normalises %s", (raw, expected) => {
    expect(normalizeRwandaPhone(raw)).toBe(expected);
  });

  it.each(["", "12345", "0688123456", "+254712345678", null])("rejects %s", (raw) => {
    expect(normalizeRwandaPhone(raw as string | null)).toBeNull();
  });
});

describe("syllabus, lesson plans and attendance alerts", () => {
  let f: Awaited<ReturnType<typeof fixture>>;

  async function fixture() {
    const order = (Math.floor(Date.now() / 1000) % 1_000_000_000) + 7;
    const level = await prisma.level.create({ data: { name: unique, category: "LOWER_PRIMARY", ageRange: "8-9", order } });
    const subject = await prisma.subject.create({
      data: { levelId: level.id, name: `Maths ${unique}`, description: "Test", icon: "book", order: 1 },
    });
    const otherSubject = await prisma.subject.create({
      data: { levelId: level.id, name: `Science ${unique}`, description: "Test", icon: "book", order: 2 },
    });
    const unit = await prisma.syllabusUnit.create({
      data: {
        subjectId: subject.id,
        number: 1,
        title: "Fractions",
        keyUnitCompetence: "Use simple fractions.",
        genericCompetences: ["Critical thinking and problem solving"],
        crossCuttingIssues: ["Inclusive education"],
      },
    });
    const otherUnit = await prisma.syllabusUnit.create({
      data: { subjectId: otherSubject.id, number: 1, title: "Plants", keyUnitCompetence: "Name plant parts." },
    });
    const school = await prisma.school.create({ data: { name: `${unique} School` } });
    const cls = await prisma.class.create({ data: { schoolId: school.id, levelId: level.id, name: "P3 Test" } });

    const teacherUser = await createUser("teacher", "TEACHER");
    const teacher = await prisma.teacher.create({ data: { userId: teacherUser.id, schoolId: school.id } });
    await prisma.teacherClassAssignment.create({
      data: { schoolId: school.id, teacherId: teacher.id, classId: cls.id, subjectName: subject.name },
    });

    const studentUser = await createUser("student", "STUDENT");
    const student = await prisma.student.create({
      data: { userId: studentUser.id, schoolId: school.id, classId: cls.id, levelId: level.id },
    });
    const parentUser = await createUser("parent", "PARENT");
    const parent = await prisma.parent.create({
      data: { userId: parentUser.id, phone: "0788000111", notificationPreference: "sms" },
    });
    await prisma.studentParent.create({ data: { parentId: parent.id, studentId: student.id } });
    const superUser = await createUser("super", "SUPER_ADMIN");

    return {
      level, subject, otherSubject, unit, otherUnit, school, cls, student, parentUser,
      tokens: {
        teacher: token(teacherUser, school.id),
        student: token(studentUser, school.id),
        parent: token(parentUser),
        superAdmin: token(superUser),
      },
    };
  }

  beforeAll(async () => {
    f = await fixture();
  });

  afterAll(async () => {
    if (f) {
      await prisma.lessonPlan.deleteMany({ where: { classId: f.cls.id } });
      await prisma.attendanceRecord.deleteMany({ where: { schoolId: f.school.id } });
      await prisma.attendanceAnalytics.deleteMany({ where: { schoolId: f.school.id } }).catch(() => undefined);
      await prisma.teacherClassAssignment.deleteMany({ where: { schoolId: f.school.id } });
      await prisma.user.deleteMany({ where: { email: { endsWith: `.${unique}@example.com` } } });
      await prisma.school.deleteMany({ where: { id: f.school.id } });
      await prisma.subject.deleteMany({ where: { levelId: f.level.id } });
      await prisma.level.deleteMany({ where: { id: f.level.id } });
    }
    await prisma.$disconnect();
  });

  it("serves the CBC reference lists", async () => {
    const res = await request(app).get(`${API}/syllabus/reference`).set(auth(f.tokens.student));
    expect(res.status).toBe(200);
    expect(res.body.genericCompetences).toHaveLength(6);
    expect(res.body.crossCuttingIssues).toHaveLength(8);
  });

  it("lets staff, but not students, read syllabus units", async () => {
    const ok = await request(app).get(`${API}/syllabus/units?subjectId=${f.subject.id}`).set(auth(f.tokens.teacher));
    expect(ok.status).toBe(200);
    expect(ok.body.units.map((u: { title: string }) => u.title)).toEqual(["Fractions"]);
    const blocked = await request(app).get(`${API}/syllabus/units?subjectId=${f.subject.id}`).set(auth(f.tokens.student));
    expect(blocked.status).toBe(403);
  });

  it("only lets a super admin import the syllabus, with valid competences", async () => {
    const payload = {
      subjects: [{ subjectId: f.subject.id, units: [{ number: 2, title: "Money", keyUnitCompetence: "Use francs." }] }],
    };
    expect((await request(app).post(`${API}/syllabus/import`).set(auth(f.tokens.teacher)).send(payload)).status).toBe(403);

    const invalid = structuredClone(payload) as any;
    invalid.subjects[0].units[0].genericCompetences = ["Made-up competence"];
    expect((await request(app).post(`${API}/syllabus/import`).set(auth(f.tokens.superAdmin)).send(invalid)).status).toBe(400);

    const created = await request(app).post(`${API}/syllabus/import`).set(auth(f.tokens.superAdmin)).send({ ...payload, source: "REB" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ created: 1, updated: 0 });

    const updated = await request(app).post(`${API}/syllabus/import`).set(auth(f.tokens.superAdmin)).send(payload);
    expect(updated.body).toMatchObject({ created: 0, updated: 1 });
  });

  it("keeps every lesson plan field the web form sends, and links the syllabus unit", async () => {
    const form = {
      title: "Halves",
      classId: f.cls.id,
      subjectId: f.subject.id,
      syllabusUnitId: f.unit.id,
      topic: "Halves and quarters",
      learningObjectives: "Identify halves",
      genericCompetencies: ["Critical thinking and problem solving"],
      crossCuttingIssues: ["Inclusive education"],
      teacherActivities: "Demonstrate folding",
      learnerActivities: "Fold paper in pairs",
      assessmentCriteria: "Can show a half",
      lessonContentHtml: "<p>Lesson body</p>",
      status: "published",
    };
    const created = await request(app).post(`${API}/teacher/lesson-plans`).set(auth(f.tokens.teacher)).send(form);
    expect(created.status).toBe(201);
    const id = created.body.lessonPlan.id;

    const read = await request(app).get(`${API}/teacher/lesson-plans/${id}`).set(auth(f.tokens.teacher));
    const plan = read.body.lessonPlan;
    for (const key of ["topic", "learningObjectives", "genericCompetencies", "teacherActivities", "learnerActivities", "assessmentCriteria", "lessonContentHtml", "syllabusUnitId"] as const) {
      expect(plan[key], key).toEqual(form[key]);
    }
    expect(plan.status).toBe("PUBLISHED");

    const coverage = await request(app)
      .get(`${API}/syllabus/coverage?subjectId=${f.subject.id}&classId=${f.cls.id}`)
      .set(auth(f.tokens.teacher));
    expect(coverage.status).toBe(200);
    expect(coverage.body.units.find((u: { id: string }) => u.id === f.unit.id)).toMatchObject({ lessonPlanCount: 1, covered: true });
  });

  it("rejects a syllabus unit from another subject", async () => {
    const res = await request(app).post(`${API}/teacher/lesson-plans`).set(auth(f.tokens.teacher)).send({
      title: "Wrong unit",
      classId: f.cls.id,
      subjectId: f.subject.id,
      syllabusUnitId: f.otherUnit.id,
    });
    expect(res.status).toBe(400);
  });

  it("alerts the parent once when a learner is marked absent", async () => {
    const mark = (status: string) =>
      request(app).post(`${API}/attendance/mark`).set(auth(f.tokens.teacher)).send({
        schoolId: f.school.id,
        classId: f.cls.id,
        date: "2026-11-16",
        records: [{ studentId: f.student.id, status }],
      });

    expect((await mark("ABSENT")).status).toBe(200);
    expect((await mark("ABSENT")).status).toBe(200);
    // Alerts are sent in the background so saving attendance never waits on SMS.
    await new Promise((resolve) => setTimeout(resolve, 500));

    const alerts = await prisma.notification.findMany({ where: { userId: f.parentUser.id, type: "ATTENDANCE" } });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.title).toBe("Attendance alert: absent");
  });
});
