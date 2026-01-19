from django.urls import path
from django.views.generic import TemplateView
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('product/<str:product_id>/', views.product, name='product'),
    path('women/', views.women, name='women'),
    path('discount/', views.discount, name='discount'),
    path('kids/', views.kids, name='kids'),
    path('cart/', views.cart, name='cart'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('search/', views.search, name='search'),
    path('profile/', views.profile, name='profile'),
    path('orders/', views.orders, name='orders'),
    path('order/<int:order_id>/', views.order_detail, name='order_detail'),
    path('checkout/', views.checkout, name='checkout'),

    # Authentication
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('otp-verify/', views.otp_verify_view, name='otp_verify'),
    path('resend-otp/', views.resend_otp_view, name='resend_otp'),
    path('resend-otp/', views.resend_otp_view, name='resend_otp'),
    path('logout/', views.logout_view, name='logout'),

    # Forgot Password
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('forgot-password/verify/', views.forgot_password_verify_view, name='forgot_password_verify'),
    path('reset-password/', views.reset_password_view, name='reset_password'),

    # API endpoints
    path('api/products/', views.get_products_api, name='api_get_products'),
    path("api/fabrics/", views.get_fabrics, name='api_get_fabrics'),
    path("api/subcategories/", views.get_subcategories, name='api_get_subcategories'),
    path("api/kids/subcategories/", views.get_kids_subcategories, name='api_get_kids_subcategories'),
    path("api/kids/fabrics/", views.get_kids_fabrics, name='api_get_kids_fabrics'),
    path('api/orders/', views.get_orders_api, name='api_get_orders'),
    path('api/orders/<int:order_id>/', views.get_order_detail_api, name='api_get_order_detail'),
    path('api/orders/create/', views.create_order, name='api_create_order'),
    path('api/header/', views.header_partial, name='api_header'),
    path('api/orders/cancel/', views.cancel_order_api, name='api_cancel_order'),
    path('api/orders/return/', views.return_order_api, name='api_return_order'),
    path('api/running-banners/', views.api_running_banners, name="api_running_banners"),
    path('api/coupons/', views.api_get_coupons, name='api_get_coupons'),
    path('api/apply-coupon/', views.apply_coupon_api, name='api_apply_coupon'),
    path('product/<slug:slug>/api/', views.get_product_detail, name='product_detail_api'),
    path('api/reviews/submit/', views.submit_review_api, name='api_submit_review'),
    path('api/products/<str:product_id>/reviews/', views.get_product_reviews_api, name='api_get_product_reviews'),
    path('api/profile/update/', views.update_profile_api, name='update_profile_api'),


    # Customer Services Pages
    path('terms-conditions/', TemplateView.as_view(template_name='customer/info/terms_conditions.html'), name='terms_conditions'),
    path('cancellation-return/', TemplateView.as_view(template_name='customer/info/cancellation_return.html'), name='cancellation_return'),
    path('shipping-delivery/', TemplateView.as_view(template_name='customer/info/shipping_delivery.html'), name='shipping_delivery'),
    path('disclaimer-policy/', TemplateView.as_view(template_name='customer/info/disclaimer_policy.html'), name='disclaimer_policy'),
    path('track-order/', TemplateView.as_view(template_name='customer/info/track_order.html'), name='track_order'),
    path('refund-policy/', TemplateView.as_view(template_name='customer/info/refund_policy.html'), name='refund_policy'),
    path('privacy-policy/', TemplateView.as_view(template_name='customer/info/privacy_policy.html'), name='privacy_policy'),
    path('contact-us/', TemplateView.as_view(template_name='customer/info/contact_us.html'), name='contact_us'),
    
    # Quick Links Pages
    path('about-us/', TemplateView.as_view(template_name='customer/info/about_us.html'), name='about_us'),
    path('contact/', TemplateView.as_view(template_name='customer/info/contact.html'), name='contact'),
    path('reviews/', TemplateView.as_view(template_name='customer/info/reviews.html'), name='reviews'),
    path('faqs/', TemplateView.as_view(template_name='customer/info/faqs.html'), name='faqs'),
]
