from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario base del sistema. Usa email como identificador principal."""
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return self.email


class StudentProfile(models.Model):
    """Perfil extendido para alumnos del instituto."""
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    student_id = models.CharField(max_length=20, unique=True, verbose_name="Código de alumno")
    phone = models.CharField(max_length=20, blank=True, verbose_name="Teléfono")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Fecha de nacimiento")
    address = models.TextField(blank=True, verbose_name="Dirección")
    career = models.CharField(max_length=100, blank=True, verbose_name="Carrera / Programa")

    class Meta:
        verbose_name = "Perfil de alumno"
        verbose_name_plural = "Perfiles de alumnos"

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.student_id})"
