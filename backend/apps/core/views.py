"""Technical endpoints of the API."""

from django.db import connection
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Report whether the API and its database are reachable.

    Public on purpose: hosting platforms and uptime monitors call it without
    credentials. It exposes no data beyond the status itself.
    """

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        summary="Health check",
        responses={
            200: inline_serializer("Health", {"status": serializers.CharField()}),
            503: inline_serializer("HealthError", {"status": serializers.CharField()}),
        },
    )
    def get(self, request: Request) -> Response:
        """Return ``{"status": "ok"}``, or HTTP 503 if the database is unreachable."""
        try:
            connection.ensure_connection()
        except Exception:
            # Any database failure means the service is not usable; the details
            # stay in the server logs rather than in a public response.
            return Response({"status": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"status": "ok"})
