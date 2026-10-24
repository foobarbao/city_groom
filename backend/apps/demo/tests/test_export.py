import json
from typing import Any

import pytest
from django.core.management import CommandError, call_command

from apps.lockers.simulation import create_simulated_locker
from apps.lockers.tests.factories import FAKE_SITES


@pytest.mark.django_db
def test_export_writes_the_three_datasets(tmp_path: Any) -> None:
    create_simulated_locker(FAKE_SITES[0], code="fake-centre", model="compact")

    call_command(
        "export_demo_data", "--output-dir", str(tmp_path), "--now", "2026-10-21T18:30:00+02:00"
    )

    public = json.loads((tmp_path / "public.json").read_text())
    operator = json.loads((tmp_path / "operator.json").read_text())
    activity = json.loads((tmp_path / "activity.json").read_text())
    assert list(public["details"]) == ["fake-centre"]
    assert "status" in operator["details"]["fake-centre"]["compartments"][0]
    assert activity["fictitious"] is True


@pytest.mark.django_db
def test_export_needs_lockers(tmp_path: Any) -> None:
    with pytest.raises(CommandError, match="casier"):
        call_command("export_demo_data", "--output-dir", str(tmp_path))
