from fastapi.testclient import TestClient
import pytest
from copy import deepcopy

from src import app as application_module

client = TestClient(application_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities before each test."""
    original = deepcopy(application_module.activities)
    try:
        yield
    finally:
        application_module.activities.clear()
        application_module.activities.update(deepcopy(original))


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    assert isinstance(res.json(), dict)


def test_signup_success():
    email = "newparticipant@example.com"
    res = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert res.status_code == 200
    assert email in application_module.activities["Chess Club"]["participants"]
    assert "Signed up" in res.json()["message"]


def test_signup_duplicate_returns_409():
    # michael@mergington.edu already exists in the initial data
    email = "michael@mergington.edu"
    res = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert res.status_code == 409
    assert res.json().get("detail") == "Participant already registered"


def test_signup_activity_not_found():
    res = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert res.status_code == 404


def test_unregister_success():
    email = "daniel@mergington.edu"
    res = client.delete(f"/activities/Chess%20Club/participants?email={email}")
    assert res.status_code == 200
    assert email not in application_module.activities["Chess Club"]["participants"]


def test_unregister_not_found_returns_404():
    res = client.delete("/activities/Chess%20Club/participants?email=unknown@example.com")
    assert res.status_code == 404


def test_unregister_activity_not_found():
    res = client.delete("/activities/NoSuchActivity/participants?email=a@b.com")
    assert res.status_code == 404
