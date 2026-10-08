package com.rvce.classtrack.data

import java.time.LocalDate

enum class AttendanceStatus {
    PRESENT, ABSENT, CANCELLED, UNMARKED
}

enum class ClassType {
    LECTURE, LAB, TUTORIAL, PRACTICAL
}

data class TimetableSlot(
    val id: String,
    val dayOfWeek: Int, // 1 = Monday, 5 = Friday
    val subjectCode: String,
    val subjectName: String,
    val startTime: String,
    val endTime: String,
    val room: String,
    val faculty: String,
    val type: ClassType
) {
    val fullSubjectTitle: String get() = "$subjectCode - $subjectName"
}

data class AttendanceRecord(
    val id: String,
    val date: String, // YYYY-MM-DD
    val slotId: String,
    val subjectCode: String,
    val status: AttendanceStatus,
    val reason: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class CieSubjectStats(
    val subjectCode: String,
    val subjectName: String,
    val attended: Int,
    val conducted: Int,
    val percentage: Float,
    val safeBunks: Int,
    val classesNeeded: Int,
    val isEligible: Boolean
) {
    val allowedAbsent: Int get() = safeBunks
    val requiredPresent: Int get() = classesNeeded
    companion object {
        const val CIE_MIN_PERCENTAGE = 85.0f

        fun calculate(subjectCode: String, subjectName: String, records: List<AttendanceRecord>): CieSubjectStats {
            val attended = records.count { it.status == AttendanceStatus.PRESENT }
            val conducted = records.count { it.status == AttendanceStatus.PRESENT || it.status == AttendanceStatus.ABSENT }

            val percentage = if (conducted > 0) (attended.toFloat() / conducted.toFloat()) * 100.0f else 100.0f
            val isEligible = percentage >= CIE_MIN_PERCENTAGE

            val safeBunks = if (isEligible && conducted > 0) {
                Math.max(0, Math.floor(((attended - 0.85 * conducted) / 0.85)).toInt())
            } else 0

            val classesNeeded = if (!isEligible) {
                Math.max(1, Math.ceil(((0.85 * conducted - attended) / 0.15)).toInt())
            } else 0

            return CieSubjectStats(
                subjectCode = subjectCode,
                subjectName = subjectName,
                attended = attended,
                conducted = conducted,
                percentage = Math.round(percentage * 10f) / 10f,
                safeBunks = safeBunks,
                classesNeeded = classesNeeded,
                isEligible = isEligible
            )
        }
    }
}

// RV College of Engineering — CSE (AIML) Section CI-A Pre-Loaded Timetable
val RVCE_CI_A_SCHEDULE = listOf(
    // MONDAY
    TimetableSlot("mon-1", 1, "HS115YL", "Health & Yoga Practice", "09:00", "11:00", "AIML CR-001", "Rajesh / Manasa", ClassType.PRACTICAL),
    TimetableSlot("mon-2", 1, "CM211IA", "Chemistry of Smart Materials", "11:30", "12:30", "AIML CR-001", "Dr. Girisha kumar", ClassType.LECTURE),
    TimetableSlot("mon-3", 1, "MA211TC", "Linear Algebra & Calculus", "12:30", "13:30", "AIML CR-001", "Dr. Satish V.M.", ClassType.LECTURE),
    TimetableSlot("mon-4", 1, "XX115XIX", "Programming Language Lab", "14:30", "16:30", "Computing Lab", "Dept Faculty", ClassType.LAB),

    // TUESDAY
    TimetableSlot("tue-1", 2, "XX113XTX", "Engineering Science-1", "09:00", "10:00", "AIML CR-001", "ESC Faculty", ClassType.LECTURE),
    TimetableSlot("tue-2", 2, "XX115XIX", "Programming Language Course", "10:00", "11:00", "AIML CR-001", "PLC Faculty", ClassType.LECTURE),
    TimetableSlot("tue-3", 2, "MA211TC", "Linear Algebra & Calculus", "11:30", "12:30", "AIML CR-001", "Dr. Satish V.M.", ClassType.LECTURE),
    TimetableSlot("tue-4", 2, "HS112TC", "Indian Constitution", "12:30", "13:30", "AIML CR-001", "Vageesh Hp", ClassType.LECTURE),
    TimetableSlot("tue-5", 2, "EXP", "Experiential Learning", "14:30", "16:30", "AIML CR-001", "Dept Faculty", ClassType.PRACTICAL),

    // WEDNESDAY
    TimetableSlot("wed-1", 3, "MA211TC", "Linear Algebra & Calculus", "09:00", "10:00", "AIML CR-001", "Dr. Satish V.M.", ClassType.LECTURE),
    TimetableSlot("wed-2", 3, "CM211IA", "Chemistry of Smart Materials", "10:00", "11:00", "AIML CR-001", "Dr. Girisha kumar", ClassType.LECTURE),
    TimetableSlot("wed-3", 3, "XX113XTX", "Engineering Science-1", "11:30", "12:30", "AIML CR-001", "ESC Faculty", ClassType.LECTURE),
    TimetableSlot("wed-4", 3, "XX115XIX", "Programming Language Course", "12:30", "13:30", "AIML CR-001", "PLC Faculty", ClassType.LECTURE),
    TimetableSlot("wed-5", 3, "ME112GL", "CAEG (Theory)", "14:30", "16:30", "AIML CR-001", "Dr. Ramakrishna Hegde", ClassType.LECTURE),

    // THURSDAY
    TimetableSlot("thu-1", 4, "ME112GL", "CAEG (Lab)", "09:00", "11:00", "CCH2 Lab", "Dr. Ramakrishna Hegde", ClassType.LAB),
    TimetableSlot("thu-2", 4, "XX113XTX", "Engineering Science-1", "11:30", "12:30", "AIML CR-001", "ESC Faculty", ClassType.LECTURE),
    TimetableSlot("thu-3", 4, "COUNSEL", "Counselling Session", "12:30", "13:30", "AIML CR-001", "Faculty Counsellor", ClassType.TUTORIAL),
    TimetableSlot("thu-4", 4, "EXP", "Experiential Learning", "14:30", "16:30", "AIML CR-001", "Dept Faculty", ClassType.PRACTICAL),

    // FRIDAY
    TimetableSlot("fri-1", 5, "CM211IA", "Chemistry of Smart Materials", "09:00", "10:00", "AIML CR-001", "Dr. Girisha kumar", ClassType.LECTURE),
    TimetableSlot("fri-2", 5, "MA211TC", "Linear Algebra & Calculus", "10:00", "11:00", "AIML CR-001", "Dr. Satish V.M.", ClassType.LECTURE),
    TimetableSlot("fri-3", 5, "HS111EL", "Communicative English-1", "11:30", "13:30", "AIML CR-001", "Prof. Ramthilak", ClassType.LECTURE),
    TimetableSlot("fri-4", 5, "CM211IA", "Chemistry Lab", "14:30", "16:30", "Chem Lab 1-3", "Dr. Girisha kumar", ClassType.LAB)
)
