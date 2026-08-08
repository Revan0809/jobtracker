from datetime import date, timedelta


def _create_application(client, headers, **overrides):
    payload = {
        "company": "Acme Corp",
        "role": "Backend Engineer",
        "status": "Applied",
        "applied_date": "2026-01-01",
    }
    payload.update(overrides)
    return client.post("/applications", json=payload, headers=headers)


def test_create_application(client, auth_headers):
    headers = auth_headers()
    resp = _create_application(client, headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["company"] == "Acme Corp"
    assert body["status"] == "Applied"


def test_create_application_requires_auth(client):
    resp = _create_application(client, headers={})
    assert resp.status_code in (401, 403)


def test_create_application_validates_required_fields(client, auth_headers):
    headers = auth_headers()
    resp = client.post("/applications", json={"role": "No Company"}, headers=headers)
    assert resp.status_code == 422


def test_list_applications_scoped_to_owner(client, auth_headers):
    headers_a = auth_headers("a@example.com")
    headers_b = auth_headers("b@example.com")
    _create_application(client, headers_a, company="A Corp")
    _create_application(client, headers_b, company="B Corp")

    resp = client.get("/applications", headers=headers_a)
    assert resp.status_code == 200
    companies = [app["company"] for app in resp.json()]
    assert companies == ["A Corp"]


def test_get_application_by_id(client, auth_headers):
    headers = auth_headers()
    created = _create_application(client, headers).json()
    resp = client.get(f"/applications/{created['id']}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_application_not_found(client, auth_headers):
    headers = auth_headers()
    resp = client.get("/applications/00000000-0000-0000-0000-000000000000", headers=headers)
    assert resp.status_code == 404


def test_cannot_access_other_users_application(client, auth_headers):
    headers_a = auth_headers("owner@example.com")
    headers_b = auth_headers("intruder@example.com")
    created = _create_application(client, headers_a).json()

    resp = client.get(f"/applications/{created['id']}", headers=headers_b)
    assert resp.status_code == 404


def test_update_application_status(client, auth_headers):
    headers = auth_headers()
    created = _create_application(client, headers).json()
    resp = client.patch(
        f"/applications/{created['id']}", json={"status": "Interview"}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Interview"


def test_partial_update_leaves_other_fields_unchanged(client, auth_headers):
    headers = auth_headers()
    created = _create_application(client, headers, notes="original notes").json()
    resp = client.patch(
        f"/applications/{created['id']}", json={"status": "Offer"}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["notes"] == "original notes"


def test_delete_application(client, auth_headers):
    headers = auth_headers()
    created = _create_application(client, headers).json()
    resp = client.delete(f"/applications/{created['id']}", headers=headers)
    assert resp.status_code == 204

    resp = client.get(f"/applications/{created['id']}", headers=headers)
    assert resp.status_code == 404


def test_filter_by_status(client, auth_headers):
    headers = auth_headers()
    _create_application(client, headers, company="Applied Co", status="Applied")
    _create_application(client, headers, company="Offer Co", status="Offer")

    resp = client.get("/applications", params={"status": "Offer"}, headers=headers)
    assert resp.status_code == 200
    companies = [app["company"] for app in resp.json()]
    assert companies == ["Offer Co"]


def test_filter_by_company_substring(client, auth_headers):
    headers = auth_headers()
    _create_application(client, headers, company="Globex Corporation")
    _create_application(client, headers, company="Initech")

    resp = client.get("/applications", params={"company": "globex"}, headers=headers)
    assert resp.status_code == 200
    companies = [app["company"] for app in resp.json()]
    assert companies == ["Globex Corporation"]


def test_reminders_endpoint_returns_upcoming_deadlines(client, auth_headers):
    headers = auth_headers()
    soon = (date.today() + timedelta(days=2)).isoformat()
    far = (date.today() + timedelta(days=60)).isoformat()
    _create_application(client, headers, company="Due Soon", deadline=soon)
    _create_application(client, headers, company="Due Later", deadline=far)
    _create_application(client, headers, company="No Deadline")

    resp = client.get("/applications/reminders", params={"within_days": 7}, headers=headers)
    assert resp.status_code == 200
    companies = [app["company"] for app in resp.json()]
    assert companies == ["Due Soon"]


def test_stats_overview(client, auth_headers):
    headers = auth_headers()
    _create_application(client, headers, company="A", status="Applied")
    _create_application(client, headers, company="B", status="Interview")
    _create_application(client, headers, company="C", status="Offer")
    _create_application(client, headers, company="D", status="Rejected")

    resp = client.get("/stats/overview", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_applications"] == 4
    assert body["status_breakdown"] == {
        "applied": 1,
        "interview": 1,
        "offer": 1,
        "rejected": 1,
    }
    assert body["interview_rate"] == 50.0
    assert body["offer_rate"] == 25.0
