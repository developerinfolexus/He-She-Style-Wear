from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='admin_dashboard'),
    path('products/', views.products, name='admin_products'),
    path('add-product/', views.add_product, name='admin_add_product'),
    path('addmedia/', views.addmedia, name='admin_addmedia'),
    path('orders/', views.orders, name='admin_orders'),
    path('order/<int:order_id>/', views.order_detail, name='admin_order_detail'),
    path('customers/', views.customers, name='admin_customers'),
    path('analytics/', views.analytics, name='admin_analytics'),
    path('settings/', views.settings_view, name='admin_settings'),
    path("login/", views.admin_login_view, name="admin_login"),  # ✅ Login Page URL
    # path('', views.dashboard, name='admin_dashboard'),           # ✅ Dashboard
   path('discount/', views.admin_discount, name='admin_discount'),
   path('admin/discount/', views.admin_discount, name='admin_discount'),
   path("discount/save-banner/", views.save_running_banner, name="save_running_banner"),
   path("discount/toggle-banner/<int:banner_id>/", views.toggle_running_banner, name="toggle_running_banner"),
   path("discount/delete-banner/<int:banner_id>/", views.delete_running_banner, name="delete_running_banner"),
   path("discount/rotating-banner/save/", views.save_rotating_banner, name="save_rotating_banner"),
   path("discount/rotating-banner/delete/<int:banner_id>/", views.delete_rotating_banner, name="delete_rotating_banner"),
   path("discount/rotating-banner/toggle/<int:banner_id>/", views.toggle_rotating_banner, name="toggle_rotating_banner"),
   path("discount/traditional-look/save/", views.save_traditional_look, name="save_traditional_look"),
   path("discount/traditional-look/delete/<int:look_id>/", views.delete_traditional_look, name="delete_traditional_look"),
   path("discount/traditional-look/toggle/<int:look_id>/", views.toggle_traditional_look, name="toggle_traditional_look"),



    path('api/coupons/save/', views.save_coupon, name='api_save_coupon'),
    path('api/coupons/delete/', views.delete_coupon, name='api_delete_coupon'),
    path('api/coupons/get/', views.get_coupons, name='api_get_coupons'),





    # API endpoints
    path('api/products/', views.get_products_json, name='api_get_products'),
    path('api/products/<int:product_id>/delete/', views.delete_product, name='api_delete_product'),
    path('api/products/<int:product_id>/toggle-status/', views.toggle_product_status, name='api_toggle_product_status'),
    path('api/orders/', views.get_orders_api, name='admin_get_orders_api'),
    path('api/orders/update/', views.update_order_api, name='admin_update_order_api'),
    path('api/customers/', views.get_customers_api, name='admin_get_customers_api'),
    path('api/subcategories/', views.get_unique_subcategories, name='api_get_unique_subcategories'),
    path('api/grant-access/', views.grant_admin_access, name='api_grant_admin_access'),
    path('api/revoke-access/', views.revoke_admin_access, name='api_revoke_admin_access'),
    path('api/manage-permissions/', views.manage_manager_permissions, name='api_manage_permissions'),
    path('api/get-manager-permissions/', views.get_manager_permissions, name='api_get_manager_permissions'),
    path('api/order-status-breakdown/', views.get_order_status_breakdown, name='api_order_status_breakdown'),
    path('api/forgot-password/generate/', views.api_forgot_pass_generate_otp, name='api_fp_generate'),
    path('api/forgot-password/verify/', views.api_verify_pass_otp, name='api_fp_verify'),
    path('api/forgot-password/reset/', views.api_reset_pass_confirm, name='api_fp_reset'),
    
    # Excel Export
    path('api/orders/export-excel/', views.export_orders_excel, name='export_orders_excel'),

    # Manage Subcategories
    path('api/managed-subcategories/get/', views.get_managed_subcategories, name='api_get_managed_subcategories'),
    path('api/managed-subcategories/save/', views.save_subcategory, name='api_save_subcategory'),
    path('api/managed-subcategories/<int:sub_id>/delete/', views.delete_subcategory, name='api_delete_subcategory'),
]
