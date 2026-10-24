import json
from typing import Any
from unittest import mock

from django.core.management import call_command


def test_fetch_osm_data_saves_both_datasets(tmp_path: Any) -> None:
    payload = {"elements": [{"type": "node", "id": 1}]}

    with mock.patch(
        "apps.core.management.commands.fetch_osm_data.fetch_overpass", return_value=payload
    ) as fetch:
        call_command("fetch_osm_data", "--output-dir", str(tmp_path))

    assert fetch.call_count == 2
    for name in ("tram_stops", "merchants"):
        assert json.loads((tmp_path / f"{name}.json").read_text()) == payload
