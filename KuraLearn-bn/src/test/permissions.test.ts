import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { prisma } from "../prisma/client.js";

const app = createApp();
const API = "/api/v1";
const unique = `perm-${Date.now()}`;

type Fixture = Awaited<ReturnType<typeof createFixture>>;
let fixture: Fixture;

function token(user: { id: string; role: string }, schoolId?: string) {
  return jwt.sign({ sub: user.id, tenantId: schoolId, roles: [user.role] }, env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
}

function get(path: string, authToken: string) {
  return request(app).get(`${API}${path}`).set("Authorization", `Bearer ${authToken}`);
}

function createUser(name: string, role: "STUDENT" | "PARENT" | "TEACHER" | "ADMIN" | "HEAD_TEACHER" | "SUPER_ADMIN") {
  return prisma.user.create({
    data: { name: `${unique} ${name}`, email: `${name}.${unique}@example.com`, passwordHash: "not-a-real-hash", role }
  });
}

async function createFixture() {
  const order = Math.floor(Date.now() / 1000) % 1_000_000_000;
  const level = await prisma.level.create({
    data: { name: unique, category: "LOWER_PRIMARY", ageRange: "8-9", order }
  });
  const subject = await prisma.subject.create({
    data: { levelId: level.id, name: unique, description: "Test subject", icon: "book", order: 1 }
  });

  const schoolA = await prisma.school.create({ data: { name: `${unique} School A` } });
  const schoolB = await prisma.school.create({ data: { name: `${unique} School B` } });
  const classA = await prisma.class.create({ data: { schoolId: schoolA.id, levelId: level.id, name: "A1" } });
  const classB = await prisma.class.create({ data: { schoolId: schoolB.id, levelId: level.id, name: "B1" } });
  const year = await prisma.academicYear.create({
    data: { schoolId: schoolA.id, name: unique, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31") }
  });
  const term = await prisma.term.create({
    data: {
      schoolId: schoolA.id,
      academicYearId: year.id,
      name: "Term 1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-04-30")
    }
  });

  const makeStudent = async (name: string, schoolId: string, classId: string) => {
    const user = await createUser(name, "STUDENT");
    const student = await prisma.student.create({
      data: { userId: user.id, schoolId, classId, levelId: level.id, nationalId: "1199900000000000", medicalNotes: "private" }
    });
    return { user, student };
  };
  const studentA = await makeStudent("student-a", schoolA.id, classA.id);
  const classmate = await makeStudent("classmate", schoolA.id, classA.id);
  const studentB = await makeStudent("student-b", schoolB.id, classB.id);

  const teacherUser = await createUser("teacher-a", "TEACHER");
  const teacher = await prisma.teacher.create({ data: { userId: teacherUser.id, schoolId: schoolA.id } });
  const otherTeacherUser = await createUser("teacher-b", "TEACHER");
  const otherTeacher = await prisma.teacher.create({ data: { userId: otherTeacherUser.id, schoolId: schoolB.id } });

  const adminA = await createUser("admin-a", "ADMIN");
  await prisma.staff.create({ data: { userId: adminA.id, schoolId: schoolA.id, staffRole: "SCHOOL_ADMIN" } });
  const adminB = await createUser("admin-b", "ADMIN");
  await prisma.staff.create({ data: { userId: adminB.id, schoolId: schoolB.id, staffRole: "SCHOOL_ADMIN" } });
  const headB = await createUser("head-b", "HEAD_TEACHER");
  await prisma.staff.create({ data: { userId: headB.id, schoolId: schoolB.id, staffRole: "HEADTEACHER" } });

  const parentUser = await createUser("parent-a", "PARENT");
  const parent = await prisma.parent.create({ data: { userId: parentUser.id } });
  await prisma.studentParent.create({ data: { parentId: parent.id, studentId: studentA.student.id } });

  const mark = await prisma.mark.create({
    data: {
      studentId: studentA.student.id,
      teacherId: teacher.id,
      schoolId: schoolA.id,
      classId: classA.id,
      subjectId: subject.id,
      academicYearId: year.id,
      termId: term.id,
      assessmentType: "CAT",
      score: 40,
      maxScore: 100
    }
  });

  return {
    level, subject, schoolA, schoolB, classA, classB, year, term, studentA, classmate, studentB,
    teacherUser, teacher, otherTeacherUser, otherTeacher, adminA, adminB, headB, parentUser, parent, mark,
    tokens: {
      studentA: token(studentA.user, schoolA.id),
      classmate: token(classmate.user, schoolA.id),
      teacher: token(teacherUser, schoolA.id),
      otherTeacher: token(otherTeacherUser, schoolB.id),
      adminA: token(adminA, schoolA.id),
      adminB: token(adminB, schoolB.id),
      headB: token(headB, schoolB.id),
      parent: token(parentUser)
    }
  };
}

beforeAll(async () => {
  fixture = await createFixture();
});

afterAll(async () => {
  if (fixture) {
    const schoolIds = [fixture.schoolA.id, fixture.schoolB.id];
    await prisma.markAuditLog.deleteMany({ where: { markId: fixture.mark.id } });
    await prisma.mark.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.attendanceRecord.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.teacherClassAssignment.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `.${unique}@example.com` } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.subject.deleteMany({ where: { id: fixture.subject.id } });
    await prisma.level.deleteMany({ where: { id: fixture.level.id } });
  }
  await prisma.$disconnect();
});

describe("student reports", () => {
  const reportPath = () => `/reports/student/${fixture.studentA.student.id}?termId=${fixture.term.id}`;

  it.each(["classmate", "otherTeacher", "adminB"] as const)("blocks %s", async (who) => {
    const res = await get(reportPath(), fixture.tokens[who]);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
  });

  it("blocks a parent who is not linked to the student", async () => {
    const res = await get(`/reports/student/${fixture.classmate.student.id}?termId=${fixture.term.id}`, fixture.tokens.parent);
    expect(res.status).toBe(403);
  });

  it("does not block the student or their linked parent for access reasons", async () => {
    for (const who of ["studentA", "parent"] as const) {
      const res = await get(reportPath(), fixture.tokens[who]);
      expect(res.body?.error?.code).not.toBe("STUDENT_FORBIDDEN");
    }
  });

  it("gives staff in the same school a report without hashes or private details", async () => {
    const res = await get(reportPath(), fixture.tokens.teacher);
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("not-a-real-hash");
    expect(res.body.student.nationalId).toBeUndefined();
    expect(res.body.student.medicalNotes).toBeUndefined();
    expect(res.body.student.user.name).toContain("student-a");
  });

  it("limits class reports to staff in that school", async () => {
    const path = `/reports/class?classId=${fixture.classA.id}&termId=${fixture.term.id}`;
    expect((await get(path, fixture.tokens.studentA)).status).toBe(403);
    expect((await get(path, fixture.tokens.adminB)).status).toBe(403);
    expect((await get(path, fixture.tokens.adminA)).status).toBe(200);
  });
});

describe("editing marks", () => {
  const putMark = (authToken: string, body: object) =>
    request(app).put(`${API}/marks/${fixture.mark.id}`).set("Authorization", `Bearer ${authToken}`).send(body);

  it("stops a student changing their own unlocked mark", async () => {
    const res = await putMark(fixture.tokens.studentA, { score: 99 });
    expect(res.status).toBe(403);
    const mark = await prisma.mark.findUniqueOrThrow({ where: { id: fixture.mark.id } });
    expect(mark.score).toBe(40);
  });

  it("stops staff from another school", async () => {
    expect((await putMark(fixture.tokens.adminB, { score: 99 })).status).toBe(403);
    expect((await putMark(fixture.tokens.otherTeacher, { score: 99 })).status).toBe(403);
  });

  it("stops a teacher approving or locking a mark", async () => {
    expect((await putMark(fixture.tokens.teacher, { status: "APPROVED" })).status).toBe(403);
    expect((await putMark(fixture.tokens.teacher, { isLocked: true })).status).toBe(403);
  });

  it("lets the teacher who owns the mark update its score", async () => {
    const res = await putMark(fixture.tokens.teacher, { score: 55, reason: "Permission test" });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(55);
  });
});

describe("marks lists", () => {
  it("only returns a student's own marks, whichever student they ask for", async () => {
    const res = await get(`/marks?studentId=${fixture.classmate.student.id}`, fixture.tokens.classmate);
    expect(res.status).toBe(200);
    expect(res.body.items.every((mark: { studentId: string }) => mark.studentId === fixture.classmate.student.id)).toBe(true);
    const asked = await get(`/marks?studentId=${fixture.studentA.student.id}`, fixture.tokens.classmate);
    expect(asked.body.items).toHaveLength(0);
  });

  it("keeps the review workflow away from students", async () => {
    expect((await get("/marks/submissions", fixture.tokens.studentA)).status).toBe(403);
    expect((await get("/marks/analytics", fixture.tokens.parent)).status).toBe(403);
  });
});

describe("attendance", () => {
  const historyPath = () => `/attendance/student/${fixture.studentA.student.id}/history`;
  const gridPath = () =>
    `/attendance/grid?schoolId=${fixture.schoolA.id}&classId=${fixture.classA.id}&startDate=2026-01-01&endDate=2026-01-31`;

  it("limits student history to the student, their parent and their school's staff", async () => {
    expect((await get(historyPath(), fixture.tokens.classmate)).status).toBe(403);
    expect((await get(historyPath(), fixture.tokens.adminB)).status).toBe(403);
    expect((await get(historyPath(), fixture.tokens.studentA)).status).toBe(200);
    expect((await get(historyPath(), fixture.tokens.parent)).status).toBe(200);
    expect((await get(historyPath(), fixture.tokens.teacher)).status).toBe(200);
  });

  it("keeps a student's own history route working", async () => {
    expect((await get("/attendance/history/me", fixture.tokens.studentA)).status).toBe(200);
  });

  it("limits the class grid to staff in that school", async () => {
    expect((await get(gridPath(), fixture.tokens.studentA)).status).toBe(403);
    expect((await get(gridPath(), fixture.tokens.adminB)).status).toBe(403);
    expect((await get(gridPath(), fixture.tokens.teacher)).status).toBe(200);
  });

  it("refuses another school's class even when the caller names their own school", async () => {
    const path = `/attendance/grid?schoolId=${fixture.schoolB.id}&classId=${fixture.classA.id}&startDate=2026-01-01&endDate=2026-01-31`;
    expect((await get(path, fixture.tokens.adminB)).status).toBe(404);
  });

  it("refuses to mark attendance for another school's students", async () => {
    const res = await request(app)
      .post(`${API}/attendance/mark`)
      .set("Authorization", `Bearer ${fixture.tokens.adminA}`)
      .send({
        schoolId: fixture.schoolA.id,
        classId: fixture.classA.id,
        date: "2026-01-05",
        records: [{ studentId: fixture.studentB.student.id, status: "PRESENT" }]
      });
    expect(res.status).toBe(403);
    expect(await prisma.attendanceRecord.count({ where: { studentId: fixture.studentB.student.id } })).toBe(0);
  });
});

describe("school boundaries elsewhere", () => {
  it("only lists students from the caller's own school", async () => {
    const res = await get("/users/students", fixture.tokens.adminB);
    expect(res.status).toBe(200);
    const ids = res.body.students.map((student: { id: string }) => student.id);
    expect(ids).toContain(fixture.studentB.student.id);
    expect(ids).not.toContain(fixture.studentA.student.id);
  });

  it("hides another school's teachers and parents from a head teacher", async () => {
    expect((await get(`/headteacher/teachers/${fixture.teacher.id}`, fixture.tokens.headB)).status).toBe(404);
    expect((await get(`/headteacher/parents/${fixture.parent.id}/children`, fixture.tokens.headB)).status).toBe(404);
  });

  it("does not treat an admin as belonging to the first school", async () => {
    const res = await get(`/teacher/students?schoolId=${fixture.schoolA.id}`, fixture.tokens.adminB);
    expect(JSON.stringify(res.body)).not.toContain(fixture.studentA.student.id);
  });

  it("keeps audit logs away from students", async () => {
    expect((await get("/audit/logs", fixture.tokens.studentA)).status).toBe(403);
  });

  it("limits a student's enrolled courses to people who can view that student", async () => {
    const path = `/students/${fixture.studentA.student.id}/courses`;
    expect((await get(path, fixture.tokens.classmate)).status).toBe(403);
    expect((await get(path, fixture.tokens.studentA)).status).toBe(200);
  });
});

describe("teacher dashboard attendance by class", () => {
  const path = "/teacher/dashboard/class-attendance";

  beforeAll(async () => {
    const { schoolA, schoolB, classA, classB, teacher, otherTeacher, studentA, classmate, studentB } = fixture;
    await prisma.teacherClassAssignment.create({
      data: { schoolId: schoolA.id, teacherId: teacher.id, classId: classA.id, subjectName: unique }
    });
    const date = new Date("2026-03-10T00:00:00.000Z");
    await prisma.attendanceRecord.createMany({
      data: [
        { schoolId: schoolA.id, classId: classA.id, studentId: studentA.student.id, teacherId: teacher.id, date, status: "LATE" },
        { schoolId: schoolA.id, classId: classA.id, studentId: classmate.student.id, teacherId: teacher.id, date, status: "ABSENT" },
        { schoolId: schoolB.id, classId: classB.id, studentId: studentB.student.id, teacherId: otherTeacher.id, date, status: "PRESENT" }
      ]
    });
  });

  it("counts late as attended and leaves out other schools' classes", async () => {
    const res = await get(`${path}?from=2026-03-10&to=2026-03-10`, fixture.tokens.teacher);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([
      expect.objectContaining({ classId: fixture.classA.id, present: 0, late: 1, absent: 1, total: 2, rate: 50 })
    ]);
  });

  it("returns no rate for a period with nothing marked", async () => {
    const res = await get(`${path}?from=2026-03-11&to=2026-03-20`, fixture.tokens.teacher);
    expect(res.body.items).toEqual([expect.objectContaining({ classId: fixture.classA.id, total: 0, rate: null })]);
  });

  it("rejects a reversed date range and non-teaching roles", async () => {
    expect((await get(`${path}?from=2026-03-20&to=2026-03-10`, fixture.tokens.teacher)).status).toBe(400);
    expect((await get(`${path}?from=2026-03-10&to=2026-03-20`, fixture.tokens.studentA)).status).toBe(403);
  });
});

describe("super admin platform data", () => {
  const paths = ["/super-admin/overview", "/super-admin/schools", "/super-admin/users", "/super-admin/activity"];
  let superToken: string;

  beforeAll(async () => {
    superToken = token(await createUser("super", "SUPER_ADMIN"));
  });

  it.each(paths)("blocks school roles from %s", async (path) => {
    for (const who of ["adminA", "teacher", "studentA", "parent"] as const) {
      expect((await get(path, fixture.tokens[who])).status).toBe(403);
    }
    expect((await request(app).get(`${API}${path}`)).status).toBe(401);
  });

  it("shows schools from every tenant with real counts", async () => {
    const res = await get(`/super-admin/schools?search=${unique}`, superToken);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.find((school: { id: string }) => school.id === fixture.schoolA.id)).toMatchObject({ learners: 2, teachers: 1 });
  });

  it("never returns password hashes or audit metadata", async () => {
    const users = await get(`/super-admin/users?search=${unique}`, superToken);
    expect(users.status).toBe(200);
    expect(users.body.total).toBeGreaterThan(0);
    expect(JSON.stringify(users.body)).not.toContain("passwordHash");
    expect(JSON.stringify(users.body)).not.toContain("not-a-real-hash");

    const overview = await get("/super-admin/overview", superToken);
    expect(overview.status).toBe(200);
    expect(JSON.stringify(overview.body)).not.toContain("metadata");
  });

  it("rejects an unknown role filter", async () => {
    expect((await get("/super-admin/users?role=WIZARD", superToken)).status).toBe(400);
  });
});

describe("super admin actions", () => {
  let superUser: { id: string; role: string };
  let superToken: string;
  const send = (method: "patch" | "post", path: string, body: object, authToken: string) =>
    request(app)[method](`${API}${path}`).set("Authorization", `Bearer ${authToken}`).send(body);

  beforeAll(async () => {
    superUser = await createUser("super-actions", "SUPER_ADMIN");
    superToken = token(superUser);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId: superUser.id } });
  });

  it("blocks school roles from every action", async () => {
    const { tokens, schoolB, classmate } = fixture;
    const subscription = `/super-admin/schools/${schoolB.id}/subscription`;
    const status = `/super-admin/users/${classmate.user.id}/status`;
    for (const who of ["adminA", "headB", "teacher", "studentA"] as const) {
      expect((await send("patch", subscription, { status: "ACTIVE" }, tokens[who])).status).toBe(403);
      expect((await send("patch", status, { status: "SUSPENDED" }, tokens[who])).status).toBe(403);
    }
  });

  it("changes a subscription and records who did it", async () => {
    const res = await send("patch", `/super-admin/schools/${fixture.schoolB.id}/subscription`, { status: "PAST_DUE" }, superToken);
    expect(res.status).toBe(200);
    expect(res.body.subscriptionStatus).toBe("PAST_DUE");
    const log = await prisma.auditLog.findFirst({ where: { userId: superUser.id, action: "UPDATE_SUBSCRIPTION" } });
    expect(log?.entityId).toBe(fixture.schoolB.id);
  });

  it("suspends and reactivates a user, and a suspended user cannot refresh a session", async () => {
    const target = await prisma.user.create({
      data: { name: `${unique} target`, email: `target.${unique}@example.com`, passwordHash: "not-a-real-hash", role: "TEACHER" }
    });
    const path = `/super-admin/users/${target.id}/status`;
    const suspended = await send("patch", path, { status: "SUSPENDED" }, superToken);
    expect(suspended.body.status).toBe("SUSPENDED");
    expect(JSON.stringify(suspended.body)).not.toContain("passwordHash");

    const refresh = jwt.sign({ sub: target.id }, env.JWT_REFRESH_SECRET, { expiresIn: "5m" });
    expect((await request(app).post(`${API}/auth/refresh`).send({ refreshToken: refresh })).status).toBe(403);

    expect((await send("patch", path, { status: "ACTIVE" }, superToken)).body.status).toBe("ACTIVE");
  });

  it("refuses to suspend your own account or set an invalid status", async () => {
    const own = `/super-admin/users/${superUser.id}/status`;
    expect((await send("patch", own, { status: "SUSPENDED" }, superToken)).status).toBe(400);
    expect((await send("patch", `/super-admin/users/${fixture.classmate.user.id}/status`, { status: "PENDING" }, superToken)).status).toBe(400);
  });

  it("creates a whole school with its admin, and leaves nothing behind on a clash", async () => {
    const body = {
      name: `${unique} New School`,
      type: "PRIVATE",
      adminName: "New Admin",
      adminEmail: `new-admin.${unique}@example.com`,
      adminPassword: "Temporary123!"
    };
    const created = await send("post", "/admin/schools", body, superToken);
    expect(created.status).toBe(201);
    const schoolId = created.body.school.id;
    expect((await send("post", "/admin/schools", body, fixture.tokens.adminA)).status).toBe(403);
    expect((await send("post", "/admin/schools", body, superToken)).status).toBe(409);

    await prisma.auditLog.deleteMany({ where: { schoolId } });
    await prisma.staff.deleteMany({ where: { schoolId } });
    await prisma.class.deleteMany({ where: { schoolId } });
    await prisma.gradingScale.deleteMany({ where: { schoolId } });
    await prisma.school.delete({ where: { id: schoolId } });
  });
});

describe("public sign-up", () => {
  it.each(["SUPER_ADMIN", "ADMIN", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "TEACHER"])("refuses the %s role", async (role) => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ name: "Sneaky Person", email: `sneaky-${role}.${unique}@example.com`, password: "Password123!", role });
    expect(res.status).toBe(400);
    expect(await prisma.user.count({ where: { email: `sneaky-${role.toLowerCase()}.${unique}@example.com` } })).toBe(0);
  });
});

describe("password reset", () => {
  const email = `reset.${unique}@example.com`;
  const newPassword = "BrandNew123!";
  let userId: string;

  const issueToken = async (overrides: { expiresAt?: Date } = {}) => {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000)
      }
    });
    return token;
  };
  const reset = (token: string) => request(app).post(`${API}/auth/reset-password`).send({ token, password: newPassword });

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { name: `${unique} reset`, email, passwordHash: await bcrypt.hash("OldPassword123!", 4), role: "PARENT" }
    });
    userId = user.id;
  });

  it("answers the same for known and unknown emails, and stores only a hash", async () => {
    const known = await request(app).post(`${API}/auth/forgot-password`).send({ email });
    const unknown = await request(app).post(`${API}/auth/forgot-password`).send({ email: `nobody.${unique}@example.com` });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body).toEqual(unknown.body);
    const stored = await prisma.passwordResetToken.findFirst({ where: { userId } });
    expect(stored?.tokenHash).toHaveLength(64);
  });

  it("rejects expired and made-up links", async () => {
    const expired = await issueToken({ expiresAt: new Date(Date.now() - 1000) });
    expect((await reset(expired)).status).toBe(400);
    expect((await reset("f".repeat(64))).status).toBe(400);
  });

  it("changes the password once, and the link cannot be reused", async () => {
    const token = await issueToken();
    expect((await reset(token)).status).toBe(200);
    expect((await reset(token)).status).toBe(400);

    const login = (password: string) => request(app).post(`${API}/auth/login`).send({ email, password });
    expect((await login("OldPassword123!")).status).toBe(401);
    expect((await login(newPassword)).status).toBe(200);
  });
});

describe("assessment lists are limited to the viewer's school", () => {
  it("does not show a school admin another school's assessments", async () => {
    const { schoolA, schoolB, classB, subject, otherTeacher, teacher, tokens } = fixture;
    const makeCourse = (schoolId: string, teacherId: string, code: string) =>
      prisma.course.create({
        data: { schoolId, teacherId, subjectId: subject.id, levelId: fixture.level.id, title: `${unique} ${code}`, description: "Test course" }
      });
    const otherCourse = await makeCourse(schoolB.id, otherTeacher.id, "other");
    const ownCourse = await makeCourse(schoolA.id, teacher.id, "own");
    const other = await prisma.assessment.create({
      data: { title: `${unique} other`, schoolId: schoolB.id, classId: classB.id, courseId: otherCourse.id, teacherId: otherTeacher.id }
    });
    const own = await prisma.assessment.create({
      data: { title: `${unique} own`, schoolId: schoolA.id, courseId: ownCourse.id, teacherId: teacher.id }
    });

    const res = await get(`/assessments?limit=100&search=${unique}`, tokens.adminA);
    expect(res.status).toBe(200);
    const body = JSON.stringify(res.body);
    expect(body).toContain(own.id);
    expect(body).not.toContain(other.id);

    await prisma.assessment.deleteMany({ where: { id: { in: [own.id, other.id] } } });
    await prisma.course.deleteMany({ where: { id: { in: [ownCourse.id, otherCourse.id] } } });
  });

  it("lets a director of studies open the list", async () => {
    const dos = await createUser("dos", "DIRECTOR_OF_STUDIES" as never);
    await prisma.staff.create({ data: { userId: dos.id, schoolId: fixture.schoolA.id, staffRole: "SCHOOL_ADMIN" } });
    expect((await get("/assessments?limit=5", token(dos, fixture.schoolA.id))).status).toBe(200);
  });
});

describe("student self sign-up", () => {
  it("cannot place itself in a school or class", async () => {
    const email = `selfserve.${unique}@example.com`;
    const registered = await request(app)
      .post(`${API}/auth/register`)
      .send({ name: "Self Serve", email, password: "Password123!", role: "STUDENT" });
    expect(registered.status).toBe(201);

    const setup = await request(app)
      .post(`${API}/students/profile-setup`)
      .set("Authorization", `Bearer ${registered.body.accessToken}`)
      .send({ fullName: "Self Serve", levelId: fixture.level.id, schoolId: fixture.schoolA.id, classId: fixture.classA.id });
    expect(setup.status).toBeLessThan(300);

    const update = await request(app)
      .put(`${API}/students/me`)
      .set("Authorization", `Bearer ${registered.body.accessToken}`)
      .send({ schoolId: fixture.schoolB.id, classId: fixture.classB.id });
    expect(update.status).toBeLessThan(300);

    const student = await prisma.student.findFirstOrThrow({ where: { user: { email } } });
    expect(student.schoolId).toBeNull();
    expect(student.classId).toBeNull();
  });
});

describe("linking a self-registered learner to a school", () => {
  const path = `${API}/student-management/link-learner`;
  const link = (body: object, authToken: string) =>
    request(app).post(path).set("Authorization", `Bearer ${authToken}`).send(body);

  const signUpLearner = async (name: string) => {
    const email = `${name}.${unique}@example.com`;
    const registered = await request(app).post(`${API}/auth/register`).send({ name: `Learner ${name}`, email, password: "Password123!", role: "STUDENT" });
    await request(app)
      .post(`${API}/students/profile-setup`)
      .set("Authorization", `Bearer ${registered.body.accessToken}`)
      .send({ fullName: `Learner ${name}`, levelId: fixture.level.id });
    return email;
  };

  it("adds the learner to the admin's school and class, and records it", async () => {
    const email = await signUpLearner("linked");
    const res = await link({ email: email.toUpperCase(), classId: fixture.classA.id }, fixture.tokens.adminA);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ email, className: fixture.classA.name });

    const student = await prisma.student.findFirstOrThrow({ where: { user: { email } }, include: { user: { include: { notifications: true } } } });
    expect(student).toMatchObject({ schoolId: fixture.schoolA.id, classId: fixture.classA.id });
    expect(student.studentCode).toBeTruthy();
    expect(student.user.notifications).toHaveLength(1);
    expect(await prisma.auditLog.count({ where: { action: "LINK_LEARNER", entityId: student.id } })).toBe(1);
    await prisma.auditLog.deleteMany({ where: { entityId: student.id } });
  });

  it("will not take a learner already in a school, and gives the same answer as an unknown email", async () => {
    const { studentA, classB, classA, tokens } = fixture;
    const taken = await link({ email: studentA.user.email, classId: classB.id }, tokens.adminB);
    const unknown = await link({ email: `nobody.${unique}@example.com`, classId: classB.id }, tokens.adminB);
    expect(taken.status).toBe(404);
    expect(taken.body).toEqual(unknown.body);
    const unchanged = await prisma.student.findUniqueOrThrow({ where: { id: studentA.student.id } });
    expect(unchanged).toMatchObject({ schoolId: fixture.schoolA.id, classId: classA.id });
  });

  it("will not use another school's class", async () => {
    const email = await signUpLearner("wrongclass");
    const res = await link({ email, classId: fixture.classB.id }, fixture.tokens.adminA);
    expect(res.status).toBe(404);
    expect((await prisma.student.findFirstOrThrow({ where: { user: { email } } })).schoolId).toBeNull();
  });

  it("is only open to school admins and head teachers", async () => {
    const email = await signUpLearner("roles");
    for (const who of ["teacher", "studentA", "parent"] as const) {
      expect((await link({ email, classId: fixture.classA.id }, fixture.tokens[who])).status).toBe(403);
    }
    expect((await link({ email: "not-an-email", classId: fixture.classA.id }, fixture.tokens.adminA)).status).toBe(400);
  });
});

describe("linking a parent to a learner", () => {
  const send = (method: "post" | "delete" | "get", path: string, authToken: string, body: object = {}) =>
    request(app)[method](`${API}${path}`).set("Authorization", `Bearer ${authToken}`).send(body);

  const signUpParent = async (name: string) => {
    const email = `${name}.${unique}@example.com`;
    const res = await request(app).post(`${API}/auth/register`).send({ name: `Parent ${name}`, email, password: "Password123!", role: "PARENT" });
    return { email, accessToken: res.body.accessToken as string };
  };

  it("shows a new parent an empty dashboard, then the child once linked, and removes it again", async () => {
    const { email, accessToken } = await signUpParent("newparent");
    const studentPath = `/student-management/${fixture.classmate.student.id}/parents`;

    const before = await send("get", "/parents/me/dashboard", accessToken);
    expect(before.status).toBe(200);
    expect(before.body.dashboard.children).toEqual([]);
    expect((await send("get", `/reports/student/${fixture.classmate.student.id}?termId=${fixture.term.id}`, accessToken)).status).toBe(403);

    const linked = await send("post", studentPath, fixture.tokens.adminA, { email: email.toUpperCase(), relationship: "MOTHER" });
    expect(linked.status).toBe(201);
    const after = await send("get", "/parents/me/dashboard", accessToken);
    expect(after.body.dashboard.children).toHaveLength(1);
    expect((await send("post", studentPath, fixture.tokens.adminA, { email })).status).toBe(409);
    expect(await prisma.auditLog.count({ where: { action: "LINK_PARENT", entityId: fixture.classmate.student.id } })).toBe(1);

    const removed = await send("delete", `${studentPath}/${linked.body.data.parentId}`, fixture.tokens.adminA);
    expect(removed.status).toBe(200);
    expect((await send("get", "/parents/me/dashboard", accessToken)).body.dashboard.children).toEqual([]);
    expect((await send("delete", `${studentPath}/${linked.body.data.parentId}`, fixture.tokens.adminA)).status).toBe(404);
    await prisma.auditLog.deleteMany({ where: { entityId: fixture.classmate.student.id } });
  });

  it("stops another school and non-office roles", async () => {
    const { email } = await signUpParent("blockedparent");
    const path = `/student-management/${fixture.classmate.student.id}/parents`;
    expect((await send("post", path, fixture.tokens.adminB, { email })).status).toBe(404);
    for (const who of ["teacher", "studentA", "parent"] as const) {
      expect((await send("post", path, fixture.tokens[who], { email })).status).toBe(403);
    }
    expect(await prisma.studentParent.count({ where: { parent: { user: { email } } } })).toBe(0);
  });

  it("only links accounts that are parents", async () => {
    const path = `/student-management/${fixture.classmate.student.id}/parents`;
    expect((await send("post", path, fixture.tokens.adminA, { email: fixture.teacherUser.email })).status).toBe(404);
    expect((await send("post", path, fixture.tokens.adminA, { email: "not-an-email" })).status).toBe(400);
  });
});
