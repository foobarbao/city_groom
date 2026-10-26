"""Data model of connected lockers.

A ``Locker`` is a unit installed at one location, made of vertical columns.
Each column holds stacked ``Compartment`` objects of various sizes; one column
also holds the control panel. The layout (column and position of every
compartment) is stored so that apps can draw the locker front and show the user
exactly which door opens.
"""

from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.lockers.sizes import CompartmentSize


class AccessMethod(models.TextChoices):
    """Ways a user can open a compartment; they depend on the locker vendor."""

    BLUETOOTH = "bluetooth", "Bluetooth"
    NFC = "nfc", "NFC"
    QR_CODE = "qr_code", "QR code"


class Connectivity(models.TextChoices):
    """How a locker communicates with the platform.

    Lockers on the market use a wired network, a cellular modem, or work
    offline with Bluetooth and sync through the user's phone (docs/LOCKERS.md).
    """

    ETHERNET = "ethernet", "Ethernet"
    CELLULAR = "cellular", "4G / cellulaire"
    WIFI = "wifi", "Wi-Fi"
    BLUETOOTH_OFFLINE = "bluetooth_offline", "Hors ligne (Bluetooth)"


class SiteCategory(models.TextChoices):
    """Kind of place where a locker stands, shown to customers to find one.

    Tram stops host service lockers; the other categories are strategic places
    for the consigne (docs/PRODUCT.md §4).
    """

    TRAM_STOP = "tram_stop", "Arrêt de tram"
    TOURISM = "tourism", "Site touristique"
    TRANSPORT = "transport", "Gare"
    CAMPUS = "campus", "Campus"
    SCHOOL = "school", "Lycée"
    SHOPPING = "shopping", "Centre commercial ou marché"
    HEALTH = "health", "Hôpital"
    BUSINESS = "business", "Pôle d'activité"
    SQUARE = "square", "Place (restaurants, cafés)"
    LEISURE = "leisure", "Parc ou équipement sportif"
    OTHER = "other", "Autre"


class Locker(models.Model):
    """A connected locker unit installed at one location in the city."""

    class Status(models.TextChoices):
        """Operational status of the whole locker."""

        ACTIVE = "active", "En service"
        MAINTENANCE = "maintenance", "En maintenance"
        OFFLINE = "offline", "Hors ligne"

    name = models.CharField(
        "nom",
        max_length=120,
        help_text="Nom affiché aux utilisateurs, généralement le lieu (ex. arrêt de tram).",
    )
    code = models.SlugField(
        "code",
        max_length=40,
        unique=True,
        help_text="Identifiant court et stable du casier, utilisé dans les URLs et les échanges.",
    )
    location = gis_models.PointField(
        "position",
        srid=4326,
        help_text="Position GPS du casier (WGS 84).",
    )
    address = models.CharField(
        "adresse",
        max_length=255,
        blank=True,
        help_text="Adresse ou description du lieu, si connue.",
    )
    status = models.CharField(
        "statut",
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        help_text="Statut opérationnel du casier.",
    )
    access_methods = ArrayField(
        models.CharField(max_length=20, choices=AccessMethod.choices),
        verbose_name="modes d'ouverture",
        default=list,
        help_text="Modes d'ouverture proposés par ce casier (selon le fabricant).",
    )
    site_category = models.CharField(
        "type de lieu",
        max_length=20,
        choices=SiteCategory.choices,
        default=SiteCategory.OTHER,
        help_text="Type de lieu où se trouve le casier (arrêt de tram, site touristique…).",
    )
    connectivity = models.CharField(
        "connectivité",
        max_length=20,
        choices=Connectivity.choices,
        default=Connectivity.CELLULAR,
        help_text="Mode de communication du casier avec la plateforme.",
    )
    last_seen_at = models.DateTimeField(
        "dernier contact",
        null=True,
        blank=True,
        help_text="Dernier message reçu du casier (vide si jamais connecté).",
    )
    control_panel_column = models.PositiveSmallIntegerField(
        "colonne du panneau de contrôle",
        default=0,
        help_text="Index (à partir de 0) de la colonne contenant l'écran et les lecteurs.",
    )
    is_simulated = models.BooleanField(
        "simulé",
        default=True,
        help_text="Vrai pour un casier fictif de démonstration, faux pour un casier réel.",
    )
    placement_source = models.CharField(
        "origine de l'emplacement",
        max_length=255,
        blank=True,
        help_text=(
            "D'où vient la position (ex. « OpenStreetMap, arrêt de tram, nœud 123 »). "
            "Les emplacements de la démo sont provisoires."
        ),
    )
    created_at = models.DateTimeField("créé le", auto_now_add=True)
    updated_at = models.DateTimeField("modifié le", auto_now=True)

    class Meta:
        verbose_name = "casier"
        verbose_name_plural = "casiers"
        ordering = ["name"]

    def __str__(self) -> str:
        """Return the locker name, used in the admin and logs."""
        return self.name


class Compartment(models.Model):
    """A lockable box inside a locker, where one order's items are placed."""

    class Status(models.TextChoices):
        """Occupancy status of a compartment."""

        FREE = "free", "Libre"
        RESERVED = "reserved", "Réservé"
        OCCUPIED = "occupied", "Occupé"
        OUT_OF_SERVICE = "out_of_service", "Hors service"

    locker = models.ForeignKey(
        Locker,
        on_delete=models.CASCADE,
        related_name="compartments",
        verbose_name="casier",
        help_text="Casier auquel appartient ce compartiment.",
    )
    label = models.CharField(
        "étiquette",
        max_length=8,
        help_text="Étiquette visible sur la porte (ex. « B3 » : colonne B, 3e position).",
    )
    size = models.CharField(
        "taille",
        max_length=2,
        choices=CompartmentSize.choices,
        help_text="Catégorie de taille du compartiment.",
    )
    column = models.PositiveSmallIntegerField(
        "colonne",
        help_text="Index de la colonne, à partir de 0, de gauche à droite.",
    )
    position = models.PositiveSmallIntegerField(
        "position",
        help_text="Index dans la colonne, à partir de 0, de haut en bas.",
    )
    status = models.CharField(
        "statut",
        max_length=20,
        choices=Status.choices,
        default=Status.FREE,
        help_text="Occupation actuelle du compartiment.",
    )

    class Meta:
        verbose_name = "compartiment"
        verbose_name_plural = "compartiments"
        ordering = ["locker", "column", "position"]
        constraints = [
            models.UniqueConstraint(fields=["locker", "label"], name="unique_compartment_label"),
            models.UniqueConstraint(
                fields=["locker", "column", "position"], name="unique_compartment_slot"
            ),
        ]

    def __str__(self) -> str:
        """Return ``<locker> – <label>``, used in the admin and logs."""
        return f"{self.locker} – {self.label}"


class LockerEvent(models.Model):
    """Something a locker reported: door movement, fault, connection change.

    Events form an append-only audit trail. They are produced by the locker's
    ``LockerDriver`` (simulated or real) and are exposed to operators and
    integrations, e.g. for real-time tracking.
    """

    class Kind(models.TextChoices):
        """Type of event reported by a locker."""

        DOOR_OPENED = "door_opened", "Porte ouverte"
        DOOR_CLOSED = "door_closed", "Porte fermée"
        DOOR_LEFT_OPEN = "door_left_open", "Porte restée ouverte"
        FAULT = "fault", "Panne"
        CONNECTION_LOST = "connection_lost", "Connexion perdue"
        CONNECTION_RESTORED = "connection_restored", "Connexion rétablie"

    locker = models.ForeignKey(
        Locker,
        on_delete=models.CASCADE,
        related_name="events",
        verbose_name="casier",
        help_text="Casier ayant émis l'événement.",
    )
    compartment = models.ForeignKey(
        Compartment,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="events",
        verbose_name="compartiment",
        help_text="Compartiment concerné, vide pour un événement du casier entier.",
    )
    kind = models.CharField(
        "type", max_length=30, choices=Kind.choices, help_text="Type d'événement."
    )
    access_method = models.CharField(
        "mode d'ouverture",
        max_length=20,
        choices=AccessMethod.choices,
        blank=True,
        help_text="Mode d'ouverture utilisé, pour une ouverture de porte.",
    )
    occurred_at = models.DateTimeField(
        "survenu le",
        db_index=True,
        help_text="Horodatage fourni par le casier.",
    )
    received_at = models.DateTimeField(
        "reçu le",
        auto_now_add=True,
        help_text=(
            "Horodatage de réception par la plateforme (différé si le casier était hors ligne)."
        ),
    )
    is_simulated = models.BooleanField(
        "simulé",
        default=True,
        help_text="Vrai si l'événement a été produit par la simulation.",
    )
    details = models.JSONField(
        "détails",
        default=dict,
        blank=True,
        help_text="Données complémentaires propres au fabricant ou au simulateur.",
    )

    class Meta:
        verbose_name = "événement de casier"
        verbose_name_plural = "événements de casier"
        ordering = ["-occurred_at", "-id"]
        indexes = [models.Index(fields=["locker", "-occurred_at"])]

    def __str__(self) -> str:
        """Return ``<kind> – <locker> – <time>``, used in the admin and logs."""
        return f"{self.get_kind_display()} – {self.locker} – {self.occurred_at:%Y-%m-%d %H:%M}"
