from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import StudentProfile, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "first_name", "last_name", "is_staff", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering = ["email"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Info adicional", {"fields": ()}),
    )


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["student_id", "get_full_name", "career", "phone"]
    search_fields = ["student_id", "user__first_name", "user__last_name", "user__email"]
    list_filter = ["career"]

    @admin.display(description="Nombre completo")
    def get_full_name(self, obj):
        return obj.user.get_full_name()
