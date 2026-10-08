package com.rvce.classtrack

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rvce.classtrack.data.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class MainActivity : ComponentActivity() {
    private lateinit var repository: AttendanceRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = AttendanceRepository(applicationContext)

        setContent {
            MaterialTheme(
                colorScheme = lightColorScheme(
                    primary = Color(0xFF2563EB),
                    secondary = Color(0xFF4F46E5),
                    background = Color(0xFFF8FAFC),
                    surface = Color.White
                )
            ) {
                MainAppScreen(repository)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScreen(repository: AttendanceRepository) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var refreshTrigger by remember { mutableIntStateOf(0) }
    val todayDate = remember { LocalDate.now() }
    val dateStr = remember { todayDate.format(DateTimeFormatter.ISO_DATE) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("ClassTrack", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Surface(
                                color = Color(0xFFDBEAFE),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    "85% CIE Gate",
                                    color = Color(0xFF1E40AF),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            "RVCE CSE (AIML) CI-A • Room AIML CR-001",
                            fontSize = 11.sp,
                            color = Color(0xFF64748B)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.CheckCircle, contentDescription = "Today") },
                    label = { Text("Today's Classes") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "CIE") },
                    label = { Text("CIE Eligibility") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.CalendarMonth, contentDescription = "Schedule") },
                    label = { Text("Timetable") }
                )
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize().background(Color(0xFFF8FAFC))) {
            when (selectedTab) {
                0 -> TodayScreen(repository, dateStr, todayDate.dayOfWeek.value) { refreshTrigger++ }
                1 -> CieScreen(repository, refreshTrigger)
                2 -> TimetableScreen()
            }
        }
    }
}

@Composable
fun TodayScreen(
    repository: AttendanceRepository,
    dateStr: String,
    dayOfWeek: Int, // 1 = Monday, 5 = Friday
    onMarked: () -> Unit
) {
    // Filter slots for today's day of week
    val todaySlots = remember(dayOfWeek) {
        RVCE_CI_A_SCHEDULE.filter { it.dayOfWeek == dayOfWeek }
    }
    val records = remember(onMarked) { repository.getRecords() }
    val allStats = remember(onMarked) { repository.getAllSubjectStats() }

    if (todaySlots.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Weekend, contentDescription = null, tint = Color(0xFF94A3B8), modifier = Modifier.size(54.dp))
                Spacer(modifier = Modifier.height(8.dp))
                Text("No classes scheduled for today!", fontWeight = FontWeight.Bold, color = Color(0xFF334155))
                Text("Enjoy your holiday!", fontSize = 12.sp, color = Color(0xFF64748B))
            }
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(todaySlots) { slot ->
            val record = records.find { it.date == dateStr && it.slotId == slot.id }
            val currentStatus = record?.status ?: AttendanceStatus.UNMARKED
            val subjStat = allStats.find { it.subjectCode == slot.subjectCode }

            ClassCard(
                slot = slot,
                status = currentStatus,
                stats = subjStat,
                onStatusChange = { newStatus ->
                    repository.saveRecord(dateStr, slot.id, slot.subjectCode, newStatus)
                    onMarked()
                }
            )
        }
    }
}

@Composable
fun ClassCard(
    slot: TimetableSlot,
    status: AttendanceStatus,
    stats: CieSubjectStats?,
    onStatusChange: (AttendanceStatus) -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "${slot.subjectCode}: ${slot.subjectName}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = Color(0xFF0F172A)
                    )
                    Text(
                        "${slot.startTime} - ${slot.endTime} • ${slot.room} • ${slot.faculty}",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B)
                    )
                }

                // Current CIE Status pill
                if (stats != null) {
                    val pillColor = if (stats.isEligible) Color(0xFFDCFCE7) else Color(0xFFFEE2E2)
                    val textColor = if (stats.isEligible) Color(0xFF166534) else Color(0xFF991B1B)
                    Surface(color = pillColor, shape = RoundedCornerShape(8.dp)) {
                        Text(
                            "${stats.percentage}%",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = textColor,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // CIE Recommendation message
            if (stats != null) {
                val advice = if (stats.conducted == 0) {
                    "No classes logged yet for this course."
                } else if (stats.isEligible) {
                    if (stats.safeBunks > 0) "✅ CIE Safe: Can miss ${stats.safeBunks} more classes"
                    else "⚠️ CIE Edge: Do not miss this class!"
                } else {
                    "🚨 CIE Shortage: Must attend next ${stats.classesNeeded} classes to write CIE!"
                }

                val boxColor = if (stats.isEligible) Color(0xFFF0FDF4) else Color(0xFFFEF2F2)
                val textCol = if (stats.isEligible) Color(0xFF15803D) else Color(0xFFB91C1C)

                Surface(
                    color = boxColor,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        advice,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = textCol,
                        modifier = Modifier.padding(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
            }

            // Attendance Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = { onStatusChange(if (status == AttendanceStatus.PRESENT) AttendanceStatus.UNMARKED else AttendanceStatus.PRESENT) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (status == AttendanceStatus.PRESENT) Color(0xFF10B981) else Color(0xFFECFDF5),
                        contentColor = if (status == AttendanceStatus.PRESENT) Color.White else Color(0xFF047857)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (status == AttendanceStatus.PRESENT) "✓ Present" else "Present", fontSize = 12.sp)
                }

                Button(
                    onClick = { onStatusChange(if (status == AttendanceStatus.ABSENT) AttendanceStatus.UNMARKED else AttendanceStatus.ABSENT) },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (status == AttendanceStatus.ABSENT) Color(0xFFEF4444) else Color(0xFFFEF2F2),
                        contentColor = if (status == AttendanceStatus.ABSENT) Color.White else Color(0xFFB91C1C)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(if (status == AttendanceStatus.ABSENT) "✗ Absent" else "Absent", fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = { onStatusChange(if (status == AttendanceStatus.CANCELLED) AttendanceStatus.UNMARKED else AttendanceStatus.CANCELLED) },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(if (status == AttendanceStatus.CANCELLED) "Cancelled" else "Free", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun CieScreen(repository: AttendanceRepository, refreshKey: Int) {
    val statsList = remember(refreshKey) { repository.getAllSubjectStats() }
    val shortageCount = statsList.count { !it.isEligible && it.conducted > 0 }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E40AF)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text("RVCE Autonomous CIE Criteria", color = Color(0xFFBFDBFE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        if (shortageCount == 0) "All Courses CIE Eligible! 🎉" else "$shortageCount Course(s) Below 85%!",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Attendance is calculated independently per course. You must meet 85% in each course to write its CIE exam.",
                        color = Color(0xFFE2E8F0),
                        fontSize = 12.sp
                    )
                }
            }
        }

        items(statsList) { stat ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "${stat.subjectCode}: ${stat.subjectName}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.weight(1f)
                        )
                        Text(
                            "${stat.percentage}%",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = if (stat.isEligible) Color(0xFF16A34A) else Color(0xFFDC2626)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "Attended ${stat.attended} of ${stat.conducted} classes conducted",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    val adviceText = if (stat.conducted == 0) {
                        "No classes conducted yet."
                    } else if (stat.isEligible) {
                        if (stat.safeBunks > 0) "Eligible for CIE. You can safely miss ${stat.safeBunks} more classes."
                        else "CIE Borderline. Do not miss the next class!"
                    } else {
                        "🚨 CIE Shortage! You must attend the next ${stat.classesNeeded} classes consecutively to qualify for CIE!"
                    }

                    Text(
                        adviceText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (stat.isEligible) Color(0xFF15803D) else Color(0xFFB91C1C)
                    )
                }
            }
        }
    }
}

@Composable
fun TimetableScreen() {
    val days = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(days.indices.toList()) { index ->
            val dayName = days[index]
            val daySlots = RVCE_CI_A_SCHEDULE.filter { it.dayOfWeek == index + 1 }

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(dayName, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF1E3A8A))
                    Spacer(modifier = Modifier.height(8.dp))

                    daySlots.forEach { slot ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("${slot.subjectCode} (${slot.subjectName})", fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                Text("${slot.room} • ${slot.faculty}", fontSize = 10.sp, color = Color(0xFF64748B))
                            }
                            Text("${slot.startTime} - ${slot.endTime}", fontSize = 11.sp, color = Color(0xFF475569))
                        }
                        Divider(color = Color(0xFFF1F5F9))
                    }
                }
            }
        }
    }
}
