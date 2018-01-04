"""
Definition of urls for wbd.
"""

from datetime import datetime
from django.contrib.auth.decorators import login_required, permission_required
from django.conf.urls import url, include
from django.conf.urls.static import static
from django.contrib import admin
import django.contrib.auth.views

# Enable the admin:
from wbd.settings import APP_PREFIX, STATIC_ROOT

# Imports for the app 'dictionary'
import wbd.dictionary.forms
from wbd.dictionary.views import *
from wbd.dictionary.adminviews import EntryListView, InfoListView

# Other Django stuff
from django.core import urlresolvers
from django.shortcuts import redirect
from django.core.urlresolvers import reverse, reverse_lazy
from django.views.generic.base import RedirectView
from django.views.generic import TemplateView

admin.autodiscover()

# set admin site names
admin.site.site_header = 'e-WBD Admin'
admin.site.site_title = 'e-WBD Site Admin'

pfx = APP_PREFIX

urlpatterns = [
    # Examples:
    url(r'^$', wbd.dictionary.views.home, name='home'),
    url(r'^contact$', wbd.dictionary.views.contact, name='contact'),
    url(r'^about', wbd.dictionary.views.about, name='about'),
    url(r'^guide', wbd.dictionary.views.guide, name='guide'),
    url(r'^robots.txt', TemplateView.as_view(template_name='dictionary/robots.txt', content_type='text/plain')),
    url(r'^delen', DeelListView.as_view(), name='delen'),
    url(r'^definitions$', RedirectView.as_view(url='/'+pfx+'admin/'), name='definitions'),
    url(r'^entries$', RedirectView.as_view(url='/'+pfx+'admin/dictionary/entry/'), name='entries'),
    url(r'^entries/import/$', permission_required('dictionary.search_gloss')(InfoListView.as_view()), name='admin_import_list'),
    url(r'^lemmas$', LemmaListView.as_view(), name='lemmas'),
    url(r'^lemma/search/$', LemmaListView.as_view(), name='lemmasearch'),
    url(r'^trefwoord/search/$', TrefwoordListView.as_view(), name='trefwoordsearch'),
    url(r'^dialects', DialectListView.as_view(), name='dialects'),
    url(r'^dialect/search/$', DialectListView.as_view(), name='dialectsearch'),
    url(r'^locations', LocationListView.as_view(), name='locations'),
    url(r'^location/search/$', LocationListView.as_view(), name='locationsearch'),
    url(r'^mines', MijnListView.as_view(), name='mines'),
    url(r'^mine/search/$', MijnListView.as_view(), name='minesearch'),
    url(r'^list/$', permission_required('dictionary.search_gloss')(EntryListView.as_view()), name='admin_entry_list'), 
    url(r'^dictionary/search/$', permission_required('dictionary.search_gloss')(EntryListView.as_view())),
    url(r'^entry/(?P<pk>\d+)', DictionaryDetailView.as_view(), name='output'),
    url(r'^import/start/$', wbd.dictionary.views.import_csv_start, name='import_start'),
    url(r'^import/progress/$', wbd.dictionary.views.import_csv_progress, name='import_progress'),
    url(r'^repair/$', permission_required('dictionary.search_gloss')(wbd.dictionary.views.do_repair), name='repair'),
    url(r'^repair/start/$', wbd.dictionary.views.do_repair_start, name='repair_start'),
    url(r'^repair/progress/$', wbd.dictionary.views.do_repair_progress, name='repair_progress'),
    url(r'^static/(?P<path>.*)$',django.views.static.serve, {'document_root': STATIC_ROOT}),

    url(r'^login/$',
        django.contrib.auth.views.login,
        {
            'template_name': 'dictionary/login.html',
            'authentication_form': wbd.dictionary.forms.BootstrapAuthenticationForm,
            'extra_context':
            {
                'title': 'Log in',
                'year': datetime.now().year,
            }
        },
        name='login'),
    url(r'^logout$',
        django.contrib.auth.views.logout,
        {
            'next_page': reverse_lazy('home'),
        },
        name='logout'),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls), name='admin_base'),
]
