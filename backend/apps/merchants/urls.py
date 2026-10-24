"""URL routes of the merchants application, mounted under ``/api/v1/``."""

from rest_framework.routers import DefaultRouter

from apps.merchants.views import MerchantViewSet

router = DefaultRouter(trailing_slash=True)
router.register("merchants", MerchantViewSet, basename="merchant")

urlpatterns = router.urls
