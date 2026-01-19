from django.contrib import admin

from .models import Banner

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ('title', 'page', 'order', 'is_active')
    list_filter = ('page', 'is_active')
    search_fields = ('title', 'link')
    list_editable = ('order', 'is_active')

