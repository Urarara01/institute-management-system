from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Course, Enrollment
from .serializers import CourseSerializer, EnrollmentSerializer


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    """Listado y detalle de cursos activos."""
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Course.objects.filter(is_active=True)
            .select_related("teacher__user")
            .prefetch_related("schedules", "enrollments")
        )
        period = self.request.query_params.get("period")
        if period:
            qs = qs.filter(period=period)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
        return qs


class EnrollmentViewSet(viewsets.ModelViewSet):
    """Matrículas del alumno autenticado."""
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        try:
            student = self.request.user.student_profile
        except Exception:
            return Enrollment.objects.none()
        return (
            Enrollment.objects.filter(student=student)
            .select_related("course__teacher__user")
            .prefetch_related("course__schedules", "grades")
            .order_by("-enrolled_at")
        )

    def destroy(self, request, *args, **kwargs):
        """Retiro de curso (cambia estado a DROPPED, no elimina el registro)."""
        enrollment = self.get_object()
        if enrollment.status != "ACTIVE":
            return Response(
                {"error": "Solo puedes retirar matrículas activas."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        enrollment.status = "DROPPED"
        enrollment.save(update_fields=["status"])
        return Response({"message": "Curso retirado exitosamente."})
