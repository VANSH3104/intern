from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    
    # Override groups and user_permissions to prevent conflicts
    groups = models.ManyToManyField(Group, related_name="customuser_groups", blank=True)
    user_permissions = models.ManyToManyField(Permission, related_name="customuser_permissions", blank=True)

    REQUIRED_FIELDS = ['email']
