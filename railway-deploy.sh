#!/bin/bash
TOKEN=$(python3 -c "import json; d=json.load(open('$HOME/.railway/config.json')); print(d['user']['token'])")

# Get projects
RESPONSE=$(curl -s -X POST https://backboard.railway.com/graphql/v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ me { projects { edges { node { id name services { edges { node { id name deployments(first:1) { edges { node { id } } } } } } } } } } }"}')

echo "$RESPONSE" | python3 -m json.tool
