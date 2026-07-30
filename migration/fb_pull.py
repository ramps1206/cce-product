#!/usr/bin/env python3
"""
Pull all Firestore data the logged-in user can read from the old CCE Firebase
project, using the SAME embedded web apiKey the old HTML app uses. Signs in
with your Firebase email+password (read from env — never hardcoded), then
recursively dumps every readable collection/document to firestore_dump.json.

Usage (password stays on your machine, not in chat):
    cd ~/cce-product/migration
    FB_EMAIL='you@example.com' FB_PASSWORD='yourpassword' python3 fb_pull.py

Output: firestore_dump.json  (then Claude maps it into Postgres)
"""
import json
import os
import sys
import urllib.request
import urllib.error

API_KEY = "AIzaSyCfOPUar1OKozU0k_FhJ_0X_nO7JsKUkoc"  # public web key from the old HTML app
PROJECT = "cce-software"
FS = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)/documents"

# Top-level collections known from the old app's source.
KNOWN_ROOT = ["schools", "schoolCreds", "deviceLoginLog", "emailLoginLog"]


def _post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def _get(url, token):
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def sign_in(email, password):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    res = _post(url, {"email": email, "password": password, "returnSecureToken": True})
    return res["idToken"], res.get("localId")


def list_collection_ids(doc_path, token):
    """List subcollection ids under a document path (root = '')."""
    url = f"{FS}{doc_path}:listCollectionIds?key={API_KEY}"
    try:
        res = _post_auth(url, token, {})
        return res.get("collectionIds", [])
    except urllib.error.HTTPError:
        return []


def _post_auth(url, token, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def read_collection(coll_path, token):
    """Return list of (docId, fields, docName) for a collection path."""
    docs, page = [], None
    while True:
        url = f"{FS}/{coll_path}?key={API_KEY}&pageSize=300"
        if page:
            url += f"&pageToken={page}"
        try:
            res = _get(url, token)
        except urllib.error.HTTPError as e:
            print(f"   (skip {coll_path}: HTTP {e.code})")
            break
        for d in res.get("documents", []):
            name = d["name"]
            docs.append((name.split("/")[-1], d.get("fields", {}), name))
        page = res.get("nextPageToken")
        if not page:
            break
    return docs


def rel(doc_name):
    """Firestore doc 'name' -> path relative to /documents."""
    marker = "/documents/"
    return doc_name[doc_name.index(marker) + len(marker):]


def crawl_doc(doc_name, token, depth, out):
    """Recursively descend a document's subcollections."""
    if depth > 4:
        return
    doc_path = "/" + rel(doc_name)
    for cid in list_collection_ids(doc_path, token):
        coll_path = rel(doc_name) + "/" + cid
        print(f"   subcollection: {coll_path}")
        rows = read_collection(coll_path, token)
        out[coll_path] = [{"id": i, "fields": f} for (i, f, _n) in rows]
        for (_i, _f, n) in rows:
            crawl_doc(n, token, depth + 1, out)


def main():
    email = os.environ.get("FB_EMAIL") or (sys.argv[1] if len(sys.argv) > 1 else None)
    password = os.environ.get("FB_PASSWORD") or (sys.argv[2] if len(sys.argv) > 2 else None)
    if not email or not password:
        print("Set FB_EMAIL and FB_PASSWORD (env vars) and re-run.")
        sys.exit(1)

    print("Signing in as", email, "…")
    token, uid = sign_in(email, password)
    print("✓ signed in, uid =", uid)

    dump = {}
    # Also try root-level collection discovery (may be denied for non-admin).
    root_ids = list_collection_ids("", token) or KNOWN_ROOT
    print("Root collections to try:", root_ids)
    for coll in root_ids:
        print(f" reading /{coll} …")
        rows = read_collection(coll, token)
        dump[coll] = [{"id": i, "fields": f} for (i, f, _n) in rows]
        for (_i, _f, n) in rows:
            crawl_doc(n, token, 1, dump)

    with open("firestore_dump.json", "w", encoding="utf-8") as fh:
        json.dump(dump, fh, ensure_ascii=False, indent=2)
    total = sum(len(v) for v in dump.values())
    print(f"\n✓ wrote firestore_dump.json — {len(dump)} paths, {total} documents")
    print("Now tell Claude: 'the dump is ready' and it will load it into Postgres.")


if __name__ == "__main__":
    main()
