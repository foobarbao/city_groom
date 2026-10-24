"""URL routes of the lockers application, mounted under ``/api/``."""

from rest_framework.routers import DefaultRouter

from apps.lockers.views import LockerViewSet, OperatorLockerViewSet

router = DefaultRouter(trailing_slash=True)
router.register("lockers", LockerViewSet, basename="locker")
router.register("operator/lockers", OperatorLockerViewSet, basename="operator-locker")

urlpatterns = router.urls
