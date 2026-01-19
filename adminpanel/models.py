from django.db import models
from django.utils.text import slugify
from django.conf import settings
import json

class RunningBanner(models.Model):
    text = models.CharField(max_length=255, default="", blank=True)
    enabled = models.BooleanField(default=True)

    def __str__(self):
        return self.text[:50]


class Banner(models.Model):
    PAGE_CHOICES = [
        ('home', 'Home Page'),
        ('women', 'Women Page'),
        ('kids', 'Kids Page'),
    ]

    title = models.CharField(max_length=255, blank=True, default="")
    subtitle = models.CharField(max_length=255, blank=True, default="")
    image = models.ImageField(upload_to='banners/')
    link = models.CharField(max_length=500, blank=True, default="")
    page = models.CharField(max_length=20, choices=PAGE_CHOICES, default='home')
    order = models.IntegerField(default=0, help_text="Lower number appears first")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.get_page_display()} - {self.title or 'Banner'}"


class ManagerPermission(models.Model):
    """
    Model to define custom permissions for Manager Admins.
    These permissions control what actions managers can perform.
    """
    class Meta:
        permissions = [
            ("manage_users", "Can manage non-admin users"),
            ("access_analytics", "Can access analytics dashboards"),
            ("manage_billing", "Can manage billing and invoices"),
            ("content_moderation", "Can moderate user-generated content"),
        ]


from django.contrib.auth.models import User
from django.utils import timezone

class AdminOTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_otp')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)

    def is_valid(self):
        # 10 minutes expiry
        return (timezone.now() - self.created_at).total_seconds() < 600


class TraditionalLook(models.Model):
    title = models.CharField(max_length=255, blank=True, default="")
    image = models.ImageField(upload_to='traditional_looks/')
    product = models.ForeignKey('customer.Product', on_delete=models.CASCADE, null=True, blank=True)
    # link field removed as per new requirement
    order = models.IntegerField(default=0, help_text="Lower number appears first")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title or f"Traditional Look {self.id}"
