"""URL routes of the lockers application, mounted under ``/api/v1/``."""

from rest_framework.routers import DefaultRouter

from apps.lockers.views import LockerViewSet, OperatorLockerEventViewSet, OperatorLockerViewSet

router = DefaultRouter(trailing_slash=True)
router.register("lockers", LockerViewSet, basename="locker")
router.register("operator/lockers", OperatorLockerViewSet, basename="operator-locker")
router.register(
    "operator/locker-events", OperatorLockerEventViewSet, basename="operator-locker-event"
)

urlpatterns = router.urls
