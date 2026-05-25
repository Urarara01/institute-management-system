from django.db import models


class Teacher(models.Model):
    """Docente del instituto."""
    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="teacher_profile"
    )
    employee_id = models.CharField(max_length=20, unique=True, verbose_name="Código de docente")
    department = models.CharField(max_length=100, blank=True, verbose_name="Departamento")

    class Meta:
        verbose_name = "Docente"
        verbose_name_plural = "Docentes"

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.department}"


class Course(models.Model):
    """Curso/asignatura ofrecida por el instituto."""
    code = models.CharField(max_length=15, unique=True, verbose_name="Código")
    name = models.CharField(max_length=200, verbose_name="Nombre")
    description = models.TextField(blank=True, verbose_name="Descripción")
    credits = models.PositiveIntegerField(default=3, verbose_name="Créditos")
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="courses",
        verbose_name="Docente",
    )
    period = models.CharField(max_length=20, verbose_name="Periodo")  # e.g. "2026-1"
    capacity = models.PositiveIntegerField(default=30, verbose_name="Capacidad")
    is_active = models.BooleanField(default=True, verbose_name="Activo")

    class Meta:
        verbose_name = "Curso"
        verbose_name_plural = "Cursos"
        ordering = ["period", "code"]

    def __str__(self):
        return f"[{self.code}] {self.name} ({self.period})"


class Schedule(models.Model):
    """Horario de clases de un curso."""
    DAY_CHOICES = [
        ("MON", "Lunes"),
        ("TUE", "Martes"),
        ("WED", "Miércoles"),
        ("THU", "Jueves"),
        ("FRI", "Viernes"),
        ("SAT", "Sábado"),
    ]
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="schedules"
    )
    day = models.CharField(max_length=3, choices=DAY_CHOICES, verbose_name="Día")
    start_time = models.TimeField(verbose_name="Hora inicio")
    end_time = models.TimeField(verbose_name="Hora fin")
    classroom = models.CharField(max_length=50, verbose_name="Aula")

    class Meta:
        verbose_name = "Horario"
        verbose_name_plural = "Horarios"

    def __str__(self):
        return (
            f"{self.course.code} — {self.get_day_display()} "
            f"{self.start_time:%H:%M}–{self.end_time:%H:%M} ({self.classroom})"
        )


class Enrollment(models.Model):
    """Matrícula de un alumno en un curso."""
    STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("DROPPED", "Retirado"),
        ("COMPLETED", "Completado"),
    ]
    student = models.ForeignKey(
        "accounts.StudentProfile",
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name="Alumno",
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name="enrollments",
        verbose_name="Curso",
    )
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de matrícula")
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="ACTIVE", verbose_name="Estado"
    )

    class Meta:
        unique_together = ("student", "course")
        verbose_name = "Matrícula"
        verbose_name_plural = "Matrículas"

    def __str__(self):
        return f"{self.student} → {self.course}"


class Grade(models.Model):
    """Nota/calificación asociada a una matrícula."""
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="grades"
    )
    name = models.CharField(max_length=100, verbose_name="Evaluación")  # Ej: "Parcial 1"
    score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="Nota"
    )
    max_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=20, verbose_name="Nota máxima"
    )
    date = models.DateField(null=True, blank=True, verbose_name="Fecha")

    class Meta:
        verbose_name = "Nota"
        verbose_name_plural = "Notas"

    def __str__(self):
        return f"{self.enrollment} — {self.name}: {self.score}/{self.max_score}"
