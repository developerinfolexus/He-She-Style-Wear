from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-fckn(3&*v6jjd_rr2!xfhp6l^pq8a!q03&43t_-x0n)(1##srx'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    # comment out Django default admin since we use our own
    # 'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Custom apps
    'adminpanel',
    'customer',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'boutique_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # ✅ add global templates folder
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'customer.context_processors.header_categories', # ✅ Dynamic Header Categories
            ],
        },
    },
]

WSGI_APPLICATION = 'boutique_backend.wsgi.application'

# Database (MySQL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'django',
        'USER': 'root',
        'PASSWORD': 'root',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Toronto'
USE_I18N = True
USE_TZ = True

# Global Date/Time Formats (US/Canada Style)
USE_L10N = False 
DATE_FORMAT = 'M d, Y'        # Jan 20, 2026
TIME_FORMAT = 'h:i A'         # 03:21 PM
DATETIME_FORMAT = 'M d, Y, h:i A' 


# Static and Media
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'customer' / 'static',
    BASE_DIR / 'adminpanel' / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Custom exchange rate for converting INR to USD
INR_TO_USD_RATE = 0.012


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =========================
# EMAIL CONFIGURATION
# =========================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

EMAIL_HOST_USER = 'harishjharish2004@gmail.com'
EMAIL_HOST_PASSWORD = 'msrp cdgo kakx xzyl'

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
