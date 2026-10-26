import json
from typing import Any
from unittest import mock

import pytest
from django.core.management import CommandError, call_command


def test_fetch_osm_data_saves_every_dataset(tmp_path: Any) -> None:
    payload = {"elements": [{"type": "node", "id": 1}]}

    with mock.patch(
        "apps.core.management.commands.fetch_osm_data.fetch_overpass_with_retries",
        return_value=payload,
    ) as fetch:
        call_command("fetch_osm_data", "--output-dir", str(tmp_path))

    names = (
        "tram_stops",
        "strategic_sites",
        "merchants",
        "education",
        "grenoble_boundary",
        "company_sites",
    )
    assert fetch.call_count == len(names)
    for name in names:
        assert json.loads((tmp_path / f"{name}.json").read_text()) == payload


def test_retries_then_falls_back_to_the_next_endpoint() -> None:
    from urllib.error import HTTPError

    from apps.core import osm

    calls: list[str] = []

    def fake_fetch(query: str, url: str) -> dict[str, Any]:
        calls.append(url)
        if url == "https://main":
            raise HTTPError(url, 502, "Bad Gateway", {}, None)  # type: ignore[arg-type]
        return {"elements": []}

    with mock.patch.object(osm, "fetch_overpass", side_effect=fake_fetch):
        result = osm.fetch_overpass_with_retries(
            "q", endpoints=("https://main", "https://mirror"), sleep=lambda _: None
        )

    assert result == {"elements": []}
    assert calls == ["https://main"] * osm.ATTEMPTS_PER_ENDPOINT + ["https://mirror"]


def test_empty_answer_is_an_error_and_writes_nothing(tmp_path: Any) -> None:
    with (
        mock.patch(
            "apps.core.management.commands.fetch_osm_data.fetch_overpass_with_retries",
            return_value={"elements": []},
        ),
        pytest.raises(CommandError, match="aucun objet"),
    ):
        call_command("fetch_osm_data", "--output-dir", str(tmp_path))

    assert list(tmp_path.iterdir()) == []
