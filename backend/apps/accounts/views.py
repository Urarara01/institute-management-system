from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import StudentProfile
from .serializers import StudentProfileSerializer, StudentRegistrationSerializer, UserSerializer


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Autenticación por email + contraseña. Devuelve tokens JWT y datos del alumno."""
    # Uso en la API: POST /api/auth/login/ con JSON: { "email": "test@gmail.com", "password": "secret123" }
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")

    if not email or not password:
        return Response(
            {"error": "Se requiere email y contraseña."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response(
            {"error": "Credenciales inválidas."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)

    student_profile = None
    try:
        student_profile = StudentProfileSerializer(user.student_profile).data
    except StudentProfile.DoesNotExist:
        pass

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data,
            "student_profile": student_profile,
        }
    )


@api_view(["POST"])
def logout_view(request):
    """Invalida el refresh token (blacklist)."""
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"error": "Se requiere el token de refresco."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        return Response(
            {"error": "Token inválido o ya expirado."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({"message": "Sesión cerrada exitosamente."})


@api_view(["GET"])
def me_view(request):
    """Devuelve el perfil del usuario autenticado."""
    student_profile = None
    try:
        student_profile = StudentProfileSerializer(request.user.student_profile).data
    except StudentProfile.DoesNotExist:
        pass
    return Response(
        {
            "user": UserSerializer(request.user).data,
            "student_profile": student_profile,
        }
    )


class RegisterStudentView(generics.CreateAPIView):
    """Registro de nuevos alumnos (público)."""
    # Uso en la API: POST /api/auth/register/ con JSON:
    # {
    #   "email": "test@gmail.com", "password": "secret123",
    #   "first_name": "Test", "last_name": "User", "student_id": "20240001",
    #   "phone": "123456789", "birth_date": "2000-01-01",
    #   "address": "123 Main St", "career": "Computer Science" }
    serializer_class = StudentRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return Response(
            StudentProfileSerializer(student).data,
            status=status.HTTP_201_CREATED,
        )


"""
== API Response Example from POST /api/auth/register/ ==

RESPONSE 201 Created
{
  "id": 1,
  "user": {
    "id": 2,
    "email": "test@gmail.com",
    "first_name": "Test",
    "last_name": "User",
    "username": "test@gmail.com"
  },
  "full_name": "Test User",
  "student_id": "20240001",
  "phone": "123456789",
  "birth_date": "2000-01-01",
  "address": "123 Main St",
  "career": "Computer Science"
}
"""