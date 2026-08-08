def test_signup_creates_user_and_returns_tokens(client):
    resp = client.post(
        "/auth/signup", json={"email": "new@example.com", "password": "password123"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


def test_signup_rejects_duplicate_email(client):
    client.post("/auth/signup", json={"email": "dup@example.com", "password": "password123"})
    resp = client.post("/auth/signup", json={"email": "dup@example.com", "password": "password123"})
    assert resp.status_code == 409


def test_signup_rejects_short_password(client):
    resp = client.post("/auth/signup", json={"email": "short@example.com", "password": "123"})
    assert resp.status_code == 422


def test_login_succeeds_with_correct_credentials(client):
    client.post("/auth/signup", json={"email": "login@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_fails_with_wrong_password(client):
    client.post("/auth/signup", json={"email": "wrong@example.com", "password": "password123"})
    resp = client.post("/auth/login", json={"email": "wrong@example.com", "password": "nope12345"})
    assert resp.status_code == 401


def test_login_fails_for_unknown_email(client):
    resp = client.post("/auth/login", json={"email": "ghost@example.com", "password": "password123"})
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/auth/me")
    assert resp.status_code in (401, 403)


def test_me_returns_current_user(client, auth_headers):
    headers = auth_headers("me@example.com")
    resp = client.get("/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@example.com"


def test_refresh_returns_new_token_pair(client):
    signup = client.post(
        "/auth/signup", json={"email": "refresh@example.com", "password": "password123"}
    )
    refresh_token = signup.json()["refresh_token"]
    resp = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_refresh_rejects_access_token(client):
    signup = client.post(
        "/auth/signup", json={"email": "badrefresh@example.com", "password": "password123"}
    )
    access_token = signup.json()["access_token"]
    resp = client.post("/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401
