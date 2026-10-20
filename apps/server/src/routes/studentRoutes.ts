import { Router } from "express";
import { z } from "zod";
import { type AuthedRequest, requireAuth, requireRole } from "../auth.js";
import { asyncHandler, ApiError } from "../lib/http.js";
import { ClassroomModel } from "../models/Classroom.js";
import { ClassSessionModel } from "../models/ClassSession.js";
import { NotificationModel } from "../models/Notification.js";
import { UserModel } from "../models/User.js";
import { AssignmentModel } from "../models/Assignment.js";
import { AssignmentSubmissionModel } from "../models/AssignmentSubmission.js";
import { AssessmentModel } from "../models/Assessment.js";
import { AssessmentAttemptModel } from "../models/AssessmentAttempt.js";
import { AttendanceRecordModel } from "../models/AttendanceRecord.js";
import { AnnouncementModel } from "../models/Announcement.js";

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole("student"));

// 1. Student Dashboard
studentRouter.get(
  "/dashboard",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const now = new Date();

    const [student, classes, notifications] = await Promise.all([
      UserModel.findById(studentId).select("-passwordHash").lean(),
      ClassroomModel.find({ students: studentId })
        .populate("course")
        .populate("teacher", "fullName email")
        .sort({ createdAt: -1 })
        .lean(),
      NotificationModel.find({ user: studentId }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const classIds = classes.map((classroom) => classroom._id);

    const [upcomingLessons, assignments, submissions, attendanceRecords] = await Promise.all([
      ClassSessionModel.find({
        classroom: { $in: classIds },
        startsAt: { $gte: now },
        status: "scheduled",
      })
        .sort({ startsAt: 1 })
        .limit(10)
        .lean(),
      AssignmentModel.find({ classroom: { $in: classIds } }).select("_id").lean(),
      AssignmentSubmissionModel.find({ student: studentId }).lean(),
      AttendanceRecordModel.find({ student: studentId }).lean(),
    ]);

    const totalAttendance = attendanceRecords.length;
    const presentAttendance = attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

    res.json({
      student,
      overview: {
        assignedCourses: classes.length,
        nextLesson: upcomingLessons[0] ?? null,
        placementStatus: student?.studentProfile?.placementStatus ?? "pending",
        pendingAssignments: Math.max(0, assignments.length - submissions.length),
        attendanceRate,
      },
      classes,
      upcomingLessons,
      notifications,
    });
  }),
);

// 2. Classes list
studentRouter.get(
  "/classes",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const classes = await ClassroomModel.find({ students: studentId })
      .populate("course")
      .populate("teacher", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    const classIds = classes.map((c) => c._id);
    const sessions = await ClassSessionModel.find({ classroom: { $in: classIds } })
      .sort({ startsAt: 1 })
      .lean();

    res.json({ classes, sessions });
  }),
);

// 3. Assignments list for enrolled classes
studentRouter.get(
  "/assignments",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const enrolledClasses = await ClassroomModel.find({ students: studentId }).select("_id").lean();
    const classIds = enrolledClasses.map((c) => c._id);

    const [assignments, submissions] = await Promise.all([
      AssignmentModel.find({ classroom: { $in: classIds } })
        .populate("classroom", "title")
        .populate("teacher", "fullName")
        .sort({ dueDate: 1 })
        .lean(),
      AssignmentSubmissionModel.find({ student: studentId }).lean(),
    ]);

    const submissionMap = new Map(submissions.map((s) => [s.assignment.toString(), s]));

    const enriched = assignments.map((a) => ({
      ...a,
      submission: submissionMap.get(a._id.toString()) ?? null,
    }));

    res.json({ assignments: enriched });
  }),
);

// 4. Submit assignment
studentRouter.post(
  "/assignments/:assignmentId/submit",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const data = z.object({
      textResponse: z.string().default(""),
      fileUrl: z.string().default(""),
      originalFilename: z.string().default(""),
    }).parse(req.body);

    const assignment = await AssignmentModel.findById(req.params.assignmentId);
    if (!assignment) {
      throw new ApiError(404, "Assignment not found.");
    }

    const isEnrolled = await ClassroomModel.exists({ _id: assignment.classroom, students: studentId });
    if (!isEnrolled) {
      throw new ApiError(403, "You can only submit assignments for classes you are enrolled in.");
    }

    const existingSubmission = await AssignmentSubmissionModel.findOne({
      assignment: assignment._id,
      student: studentId,
    });

    if (existingSubmission && existingSubmission.status === "graded") {
      throw new ApiError(400, "This assignment has already been graded and cannot be resubmitted.");
    }

    const submission = await AssignmentSubmissionModel.findOneAndUpdate(
      { assignment: assignment._id, student: studentId },
      {
        classroom: assignment.classroom,
        textResponse: data.textResponse,
        fileUrl: data.fileUrl,
        originalFilename: data.originalFilename,
        status: existingSubmission ? "resubmitted" : "submitted",
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    await NotificationModel.create({
      user: assignment.teacher,
      title: "New Assignment Submission",
      message: `A student submitted work for "${assignment.title}".`,
      kind: "submission",
      link: "/teacher/assignments",
    });

    res.status(201).json({ message: "Assignment submitted successfully.", submission });
  }),
);

// 5. Assessments list
studentRouter.get(
  "/assessments",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const enrolledClasses = await ClassroomModel.find({ students: studentId }).select("_id").lean();
    const classIds = enrolledClasses.map((c) => c._id);

    const [assessments, attempts] = await Promise.all([
      AssessmentModel.find({ classroom: { $in: classIds }, isPublished: true })
        .populate("classroom", "title")
        .select("-questions.correctOptionIndex -questions.explanation")
        .sort({ createdAt: -1 })
        .lean(),
      AssessmentAttemptModel.find({ student: studentId }).lean(),
    ]);

    const attemptsMap = new Map(attempts.map((att) => [att.assessment.toString(), att]));

    const enriched = assessments.map((assessment) => ({
      ...assessment,
      latestAttempt: attemptsMap.get(assessment._id.toString()) ?? null,
    }));

    res.json({ assessments: enriched });
  }),
);

// 6. Get single assessment to take (WITHOUT correct answers!)
studentRouter.get(
  "/assessments/:assessmentId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const assessment = await AssessmentModel.findById(req.params.assessmentId)
      .populate("classroom", "title")
      .select("-questions.correctOptionIndex -questions.explanation")
      .lean();

    if (!assessment) {
      throw new ApiError(404, "Assessment not found.");
    }

    const isEnrolled = await ClassroomModel.exists({ _id: assessment.classroom, students: studentId });
    if (!isEnrolled) {
      throw new ApiError(403, "You do not have access to this assessment.");
    }

    const previousAttempt = await AssessmentAttemptModel.findOne({
      assessment: assessment._id,
      student: studentId,
    }).lean();

    res.json({ assessment, previousAttempt });
  }),
);

// 7. Attempt assessment & calculate score server-side
studentRouter.post(
  "/assessments/:assessmentId/attempt",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const data = z.object({
      answers: z.array(
        z.object({
          questionId: z.string(),
          selectedOption: z.number().int(),
        }),
      ),
    }).parse(req.body);

    const assessment = await AssessmentModel.findById(req.params.assessmentId);
    if (!assessment) {
      throw new ApiError(404, "Assessment not found.");
    }

    const isEnrolled = await ClassroomModel.exists({ _id: assessment.classroom, students: studentId });
    if (!isEnrolled) {
      throw new ApiError(403, "You do not have access to this assessment.");
    }

    let earnedScore = 0;
    let maxScore = 0;

    const evaluatedAnswers = assessment.questions.map((question) => {
      const qId = question._id.toString();
      const points = question.points || 1;
      maxScore += points;

      const studentAns = data.answers.find((a) => a.questionId === qId);
      const selected = studentAns !== undefined ? studentAns.selectedOption : -1;
      const isCorrect = selected === question.correctOptionIndex;

      if (isCorrect) {
        earnedScore += points;
      }

      return {
        questionId: question._id,
        selectedOption: selected,
        isCorrect,
      };
    });

    const percentage = maxScore > 0 ? Math.round((earnedScore / maxScore) * 100) : 0;
    const passed = percentage >= assessment.passingScorePercentage;

    const attempt = await AssessmentAttemptModel.create({
      assessment: assessment._id,
      classroom: assessment.classroom,
      student: studentId,
      answers: evaluatedAnswers,
      score: earnedScore,
      maxScore,
      percentage,
      passed,
      completedAt: new Date(),
    });

    res.status(201).json({
      message: "Assessment completed.",
      attempt: {
        score: earnedScore,
        maxScore,
        percentage,
        passed,
        passingScorePercentage: assessment.passingScorePercentage,
      },
    });
  }),
);

// 8. View Attendance history
studentRouter.get(
  "/attendance",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const records = await AttendanceRecordModel.find({ student: studentId })
      .populate("session", "title startsAt endsAt")
      .populate("classroom", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ records });
  }),
);

// 9. Real Progress calculation
studentRouter.get(
  "/progress",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const enrolledClasses = await ClassroomModel.find({ students: studentId }).select("_id").lean();
    const classIds = enrolledClasses.map((c) => c._id);

    const [sessions, attendanceRecords, assignments, submissions, attempts] = await Promise.all([
      ClassSessionModel.find({ classroom: { $in: classIds } }).lean(),
      AttendanceRecordModel.find({ student: studentId }).lean(),
      AssignmentModel.find({ classroom: { $in: classIds } }).lean(),
      AssignmentSubmissionModel.find({ student: studentId }).lean(),
      AssessmentAttemptModel.find({ student: studentId }).lean(),
    ]);

    const totalSessions = sessions.length;
    const attendedSessions = attendanceRecords.filter((r) => r.status === "present" || r.status === "late").length;
    const attendancePercentage = totalSessions > 0 ? Math.min(100, Math.round((attendedSessions / totalSessions) * 100)) : 100;

    const totalAssignments = assignments.length;
    const completedAssignments = submissions.length;
    const assignmentPercentage = totalAssignments > 0 ? Math.min(100, Math.round((completedAssignments / totalAssignments) * 100)) : 100;

    const passedAssessments = attempts.filter((a) => a.passed).length;
    const totalAttempts = attempts.length;

    // Weighted Overall Progress formula: Attendance 40% + Assignments 40% + Quizzes 20%
    const overallProgress = Math.round(
      (attendancePercentage * 0.4) + (assignmentPercentage * 0.4) + ((totalAttempts > 0 ? (passedAssessments / totalAttempts) * 100 : 100) * 0.2),
    );

    res.json({
      progress: {
        overallProgress: Math.min(100, overallProgress),
        attendance: {
          attended: attendedSessions,
          total: totalSessions,
          percentage: attendancePercentage,
        },
        assignments: {
          submitted: completedAssignments,
          total: totalAssignments,
          percentage: assignmentPercentage,
        },
        assessments: {
          passed: passedAssessments,
          totalAttempts,
        },
      },
    });
  }),
);

// 10. Profile preferences update
studentRouter.patch(
  "/profile",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const data = z.object({
      learningInterests: z.array(z.string()).optional(),
      learningGoals: z.string().optional(),
      currentSkillLevel: z.string().optional(),
      preferredSchedule: z.string().optional(),
      preferredLanguage: z.enum(["am", "en"]).optional(),
    }).parse(req.body);

    const user = await UserModel.findById(studentId);
    if (!user) {
      throw new ApiError(404, "Student not found.");
    }

    if (!user.studentProfile) {
      user.studentProfile = {
        learningInterests: [],
        learningGoals: "",
        currentSkillLevel: "",
        preferredSchedule: "",
        preferredLanguage: "am",
        placementStatus: "pending",
      };
    }

    if (data.learningInterests !== undefined) user.studentProfile.learningInterests = data.learningInterests;
    if (data.learningGoals !== undefined) user.studentProfile.learningGoals = data.learningGoals;
    if (data.currentSkillLevel !== undefined) user.studentProfile.currentSkillLevel = data.currentSkillLevel;
    if (data.preferredSchedule !== undefined) user.studentProfile.preferredSchedule = data.preferredSchedule;
    if (data.preferredLanguage !== undefined) {
      user.studentProfile.preferredLanguage = data.preferredLanguage;
      user.languagePreference = data.preferredLanguage;
    }

    await user.save();

    res.json({ message: "Profile preferences updated successfully.", profile: user.studentProfile });
  }),
);

// 11. View announcements
studentRouter.get(
  "/announcements",
  asyncHandler(async (req: AuthedRequest, res) => {
    const studentId = req.user!.id;
    const enrolledClasses = await ClassroomModel.find({ students: studentId }).select("_id").lean();
    const classIds = enrolledClasses.map((c) => c._id);

    const announcements = await AnnouncementModel.find({
      $or: [
        { target: "all" },
        { target: "all_students" },
        { target: "classroom", classroom: { $in: classIds } },
      ],
    })
      .populate("author", "fullName")
      .populate("classroom", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ announcements });
  }),
);
