from rest_framework import serializers

from .models import Course, Enrollment, Grade, Schedule, Teacher


class ScheduleSerializer(serializers.ModelSerializer):
    day_display = serializers.CharField(source="get_day_display", read_only=True)

    class Meta:
        model = Schedule
        fields = ["id", "day", "day_display", "start_time", "end_time", "classroom"]


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ["id", "full_name", "department", "employee_id"]

    def get_full_name(self, obj):
        return obj.user.get_full_name()


class CourseSerializer(serializers.ModelSerializer):
    schedules = ScheduleSerializer(many=True, read_only=True)
    teacher = TeacherSerializer(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "code", "name", "description", "credits",
            "teacher", "period", "capacity", "is_active",
            "schedules", "enrolled_count", "available_slots",
        ]

    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status="ACTIVE").count()

    def get_available_slots(self, obj):
        active = obj.enrollments.filter(status="ACTIVE").count()
        return max(obj.capacity - active, 0)


class GradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Grade
        fields = ["id", "name", "score", "max_score", "date"]


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(is_active=True),
        source="course",
        write_only=True,
    )
    grades = GradeSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    average_grade = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            "id", "course", "course_id",
            "enrolled_at", "status", "status_display",
            "grades", "average_grade",
        ]
        read_only_fields = ["enrolled_at", "status"]

    def get_average_grade(self, obj):
        scored = obj.grades.filter(score__isnull=False)
        if not scored.exists():
            return None
        total = sum(float(g.score) for g in scored)
        return round(total / scored.count(), 2)

    def validate(self, attrs):
        student = self.context["request"].user.student_profile
        course = attrs["course"]
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError("Ya estás matriculado en este curso.")
        active_count = course.enrollments.filter(status="ACTIVE").count()
        if active_count >= course.capacity:
            raise serializers.ValidationError("El curso ya alcanzó su capacidad máxima.")
        return attrs

    def create(self, validated_data):
        student = self.context["request"].user.student_profile
        return Enrollment.objects.create(student=student, **validated_data)
