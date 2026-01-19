from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Custom admin panel (replaces default Django admin)
    path('admin/', include('adminpanel.urls')),

    # Customer-facing website
    path('', include('customer.urls')),
    
    path('admin/', include('adminpanel.urls')),  # our custom admin panel
    path('', include('customer.urls')), 
    path('adminpanel/', include('adminpanel.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)