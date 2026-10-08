package com.rvce.classtrack.data

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

class AttendanceRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("classtrack_offline_db", Context.MODE_PRIVATE)

    fun getRecords(): List<AttendanceRecord> {
        val jsonStr = prefs.getString("attendance_records", "[]") ?: "[]"
        val array = JSONArray(jsonStr)
        val list = mutableListOf<AttendanceRecord>()

        for (i in 0 until array.length()) {
            val obj = array.getJSONObject(i)
            list.add(
                AttendanceRecord(
                    id = obj.getString("id"),
                    date = obj.getString("date"),
                    slotId = obj.getString("slotId"),
                    subjectCode = obj.getString("subjectCode"),
                    status = AttendanceStatus.valueOf(obj.getString("status")),
                    reason = if (obj.has("reason") && !obj.isNull("reason")) obj.getString("reason") else null,
                    timestamp = obj.optLong("timestamp", System.currentTimeMillis())
                )
            )
        }
        return list
    }

    fun saveRecord(date: String, slotId: String, subjectCode: String, status: AttendanceStatus, reason: String? = null) {
        val todayStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ISO_DATE)
        if (date > todayStr) {
            // Cannot mark attendance for future dates
            return
        }

        val current = getRecords().toMutableList()
        // Remove existing record for this slot on this date
        current.removeAll { it.date == date && it.slotId == slotId }

        if (status != AttendanceStatus.UNMARKED) {
            current.add(
                AttendanceRecord(
                    id = "att_${System.currentTimeMillis()}_${(100..999).random()}",
                    date = date,
                    slotId = slotId,
                    subjectCode = subjectCode,
                    status = status,
                    reason = reason
                )
            )
        }

        val array = JSONArray()
        current.forEach { rec ->
            val obj = JSONObject().apply {
                put("id", rec.id)
                put("date", rec.date)
                put("slotId", rec.slotId)
                put("subjectCode", rec.subjectCode)
                put("status", rec.status.name)
                if (rec.reason != null) put("reason", rec.reason)
                put("timestamp", rec.timestamp)
            }
            array.put(obj)
        }

        prefs.edit().putString("attendance_records", array.toString()).apply()
    }

    fun markAllAbsent(date: String, slots: List<TimetableSlot>) {
        val todayStr = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ISO_DATE)
        if (date > todayStr) return

        slots.forEach { slot ->
            saveRecord(date, slot.id, slot.subjectCode, AttendanceStatus.ABSENT)
        }
    }

    fun getAllSubjectStats(): List<CieSubjectStats> {
        val records = getRecords()
        val uniqueCourses = RVCE_CI_A_SCHEDULE.map { it.subjectCode to it.subjectName }.distinctBy { it.first }

        return uniqueCourses.map { (code, name) ->
            val courseRecords = records.filter { it.subjectCode == code }
            CieSubjectStats.calculate(code, name, courseRecords)
        }
    }
}
