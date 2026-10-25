"""Data model of merchants.

For the demo, merchants are **real businesses** imported from OpenStreetMap
(public data: name, address, category, opening hours). They have not been
contacted: ``is_partner`` stays false and the apps show that no partnership
is established (docs/PRODUCT.md). No logo or brand asset is stored.
"""

from django.contrib.gis.db import models as gis_models
from django.db import models

from apps.merchants.categories import ServiceCategory


class Merchant(models.Model):
    """A local business performing services on customers' items."""

    name = models.CharField("nom", max_length=200, help_text="Nom public du commerce.")
    category = models.CharField(
        "catégorie",
        max_length=30,
        choices=ServiceCategory.choices,
        help_text="Type de service proposé.",
    )
    location = gis_models.PointField(
        "position", srid=4326, help_text="Position GPS du commerce (WGS 84)."
    )
    address = models.CharField(
        "adresse", max_length=255, blank=True, help_text="Adresse postale, si connue."
    )
    opening_hours = models.CharField(
        "horaires",
        max_length=255,
        blank=True,
        help_text="Horaires au format OpenStreetMap (opening_hours), si connus.",
    )
    website = models.URLField("site web", blank=True, help_text="Site web public, si connu.")
    is_partner = models.BooleanField(
        "partenaire",
        default=False,
        help_text="Vrai seulement si un partenariat a été signé avec ce commerce.",
    )
    osm_type = models.CharField(
        "type OSM",
        max_length=10,
        blank=True,
        help_text="Type d'objet OpenStreetMap d'origine (node, way, relation).",
    )
    osm_id = models.BigIntegerField(
        "identifiant OSM",
        null=True,
        blank=True,
        help_text="Identifiant OpenStreetMap d'origine, pour les mises à jour.",
    )
    imported_at = models.DateTimeField(
        "importé le", null=True, blank=True, help_text="Date du dernier import."
    )

    class Meta:
        verbose_name = "commerce"
        verbose_name_plural = "commerces"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["osm_type", "osm_id"],
                name="unique_merchant_osm_object",
                condition=models.Q(osm_id__isnull=False),
            )
        ]

    def __str__(self) -> str:
        """Return the merchant name, used in the admin and logs."""
        return self.name
