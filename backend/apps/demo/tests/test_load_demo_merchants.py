"""Tests of the ``load_demo_merchants`` command."""

from io import StringIO

import pytest
from django.contrib.gis.geos import Point
from django.core.management import call_command

from apps.demo.catalogue import DEMO_MERCHANTS
from apps.merchants.models import Merchant

pytestmark = pytest.mark.django_db


def test_loads_every_demo_merchant_once() -> None:
    call_command("load_demo_merchants", stdout=StringIO())
    call_command("load_demo_merchants", stdout=StringIO())

    demo = Merchant.objects.filter(name__startswith="Démo · ")
    assert demo.count() == len(DEMO_MERCHANTS)
    assert not demo.filter(is_partner=True).exists()
    assert not demo.filter(osm_id__isnull=False).exists()


def test_remove_keeps_real_merchants() -> None:
    real = Merchant.objects.create(
        name="Pressing réel",
        category="dry_cleaning",
        location=Point(5.72, 45.19, srid=4326),
        osm_type="node",
        osm_id=42,
    )
    call_command("load_demo_merchants", stdout=StringIO())

    call_command("load_demo_merchants", "--remove", stdout=StringIO())

    assert list(Merchant.objects.all()) == [real]
