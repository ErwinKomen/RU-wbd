"""
Definition of forms.
"""

from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.utils.translation import ugettext_lazy as _
from wbd.dictionary.models import Entry, Lemma, Dialect, Mijn, Trefwoord

DIALECT_CHOICES = (
        ('code', 'Nieuwe Kloekecode'),
        ('stad', 'Plaats'),
        ('alles', 'Plaats en Kloekecode'),
    )

class BootstrapAuthenticationForm(AuthenticationForm):
    """Authentication form which uses boostrap CSS."""
    username = forms.CharField(max_length=254,
                               widget=forms.TextInput({
                                   'class': 'form-control',
                                   'placeholder': 'User name'}))
    password = forms.CharField(label=_("Password"),
                               widget=forms.PasswordInput({
                                   'class': 'form-control',
                                   'placeholder':'Password'}))

class EntrySearchForm(forms.ModelForm):

    search = forms.CharField(label=_("Woord in het dialect"))
    sortOrder = forms.CharField(label=_("Sort Order"), initial="woord")
    lemma = forms.CharField(label=_("Begrip"))
    dialectCode = forms.CharField(label=_("Kloekecode"))
    dialectCity = forms.CharField(label=_("Stad"))
    aflevering = forms.CharField(label=_("Deel/sectie/aflevering"))

    class Meta:

        ATTRS_FOR_FORMS = {'class': 'form-control'};

        model = Entry
        fields = ('lemma', 'dialect', 'trefwoord', 'toelichting', 'kloeketoelichting', 'woord')


class CsvImportForm(forms.Form):
    success = forms.CharField(label=_("Status"), initial="")
    csvfile = forms.FileField(
        label="Selecteer een CSV bestand", 
        help_text="Het bestand moet de [tab] als scheidingsteken gebruiken")


class LemmaSearchForm(forms.ModelForm):

    search = forms.CharField(label=_("Begrip"))
    sortOrder = forms.CharField(label=_("Sort Order"), initial="lemma")
    woord = forms.CharField(label=_("Dialectopgave"))
    dialectCode = forms.CharField(label=_("Kloeke code"))
    dialectCity = forms.CharField(label=_("Stad"))
    bronnen = forms.CharField(label=_("Bronnen"))
    optdialect = forms.CharField(label=_("Dialectweergave"))
    aflevering = forms.CharField(label=_("Deel/sectie/aflevering"))
    mijn = forms.CharField(label=_("Mijn"))
    strict = forms.CharField(label=_("Strict filteren"))

    class Meta:

        ATTRS_FOR_FORMS = {'class': 'form-control'};

        model = Lemma
        fields = ('gloss', 'optdialect')


class TrefwoordSearchForm(forms.ModelForm):

    search = forms.CharField(label=_("Trefwoord"))
    sortOrder = forms.CharField(label=_("Sort Order"), initial="woord")
    dialectwoord = forms.CharField(label=_("Dialectopgave"))
    lemma = forms.CharField(label=_("Begrip"))
    dialectCode = forms.CharField(label=_("Kloekecode"))
    dialectCity = forms.CharField(label=_("Plaats"))
    bronnen = forms.CharField(label=_("Bronnen"))
    optdialect = forms.CharField(label=_("Dialectweergave"))
    aflevering = forms.CharField(label=_("Deel/sectie/aflevering"))
    mijn = forms.CharField(label=_("Mijn"))
    strict = forms.CharField(label=_("Strict filteren"))

    class Meta:

        ATTRS_FOR_FORMS = {'class': 'form-control'};

        model = Trefwoord
        fields = ('woord', 'toelichting', 'optdialect')


class DialectSearchForm(forms.ModelForm):

    search = forms.CharField(label=_("Plaats"))
    nieuw = forms.CharField(label=_("Kloekecode"))
    sortOrder = forms.CharField(label=_("Sort Order"), initial="stad")
    aflevering = forms.CharField(label=_("Deel/sectie/aflevering"))
    mijn = forms.CharField(label=_("Mijn"))

    class Meta:

        ATTRS_FOR_FORMS = {'class': 'form-control'};

        model = Dialect
        fields = ('stad', 'code', 'nieuw')


class MijnSearchForm(forms.ModelForm):

    search = forms.CharField(label=_("Mijn"))
    toelichting = forms.CharField(label=_("Toelichting"))
    locatie = forms.CharField(label=_("Locatie"))
    sortOrder = forms.CharField(label=_("Sort Order"), initial="naam")

    class Meta:

        ATTRS_FOR_FORMS = {'class': 'form-control'};

        model = Mijn
        fields = ('naam', 'locatie', 'toelichting')

