from django.contrib import admin

from .models import Course, Enrollment, Grade, Schedule, Teacher


class ScheduleInline(admin.TabularInline):
    model = Schedule
    extra = 1


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    readonly_fields = ["student", "enrolled_at", "status"]
    can_delete = False


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ["employee_id", "get_full_name", "department"]
    search_fields = ["employee_id", "user__first_name", "user__last_name", "department"]

    @admin.display(description="Nombre completo")
    def get_full_name(self, obj):
        return obj.user.get_full_name()


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "period", "credits", "teacher", "capacity", "is_active"]
    list_filter = ["period", "is_active"]
    search_fields = ["code", "name"]
    inlines = [ScheduleInline, EnrollmentInline]


class GradeInline(admin.TabularInline):
    model = Grade
    extra = 1


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ["student", "course", "status", "enrolled_at"]
    list_filter = ["status", "course__period"]
    search_fields = ["student__student_id", "student__user__first_name", "course__code"]
    inlines = [GradeInline]


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ["enrollment", "name", "score", "max_score", "date"]
    list_filter = ["enrollment__course__period"]
    search_fields = ["enrollment__student__student_id", "name"]
