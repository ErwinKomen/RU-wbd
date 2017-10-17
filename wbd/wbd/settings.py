"""
Django settings for wbd project.

Generated by 'django-admin startproject' using Django 1.9.1.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.9/ref/settings/
"""

import os
import posixpath
from django.contrib import admin

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITABLE_DIR = os.path.abspath(os.path.join(BASE_DIR, "../../writable/database/"))
MEDIA_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../../writable/media/"))
if "RU-wbd\\writable" in WRITABLE_DIR:
    # Need another string
    WRITABLE_DIR = os.path.abspath(os.path.join(BASE_DIR, "../../../writable/database/"))
    MEDIA_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../../../writable/media/"))

APP_PREFIX = "dd/"
if "d:" in WRITABLE_DIR or "D:" in WRITABLE_DIR:
    APP_PREFIX = ""
elif "/scratch" in WRITABLE_DIR:
    # Configuration for http://ewbd.science.ru.nl/
    # Also works for http://e-wbd.nl
    APP_PREFIX = ""
    admin.site.site_url = '/'
else:
    APP_PREFIX = "ewbd/"
    admin.site.site_url = '/ewbd'


# Not the location of the wsgi.py file for "reload_wbd"
WSGI_FILE = os.path.abspath(os.path.join(BASE_DIR,"wbd/wsgi.py"))

# publishing on a sub-url
# NOTE: possibly remove this for the production environment...
# FORCE_SCRIPT_NAME = "/ru"
FORCE_SCRIPT_NAME = admin.site.site_url


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.9/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '485c409a-daf7-47d3-81af-257049728c58'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost', 
                 'e-wbd.nl', 'www.e-wbd.nl', 'ewbd.science.ru.nl', 
                 'corpus-studio-web.cttnww-meertens.surf-hosted.nl']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.admindocs',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # The apps for RU-wbd
    'wbd.dictionary',
]

MIDDLEWARE_CLASSES = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'wbd.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'wbd/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            'debug': DEBUG,
        },
    },
]

WSGI_APPLICATION = 'wbd.wsgi.application'


# Database
# https://docs.djangoproject.com/en/1.9/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(WRITABLE_DIR, 'wbd.db'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/1.9/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.9/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.9/howto/static-files/

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
if ("/scratch" in WRITABLE_DIR or "ewbd" in APP_PREFIX):
    STATIC_URL = '/'+APP_PREFIX+'static/'
    MEDIA_URL = "/" + APP_PREFIX + "media/"

# STATIC_ROOT = posixpath.join(*(BASE_DIR.split(os.path.sep) + ['static']))
STATIC_ROOT = os.path.abspath(os.path.join("/", posixpath.join(*(BASE_DIR.split(os.path.sep) + ['static']))))
