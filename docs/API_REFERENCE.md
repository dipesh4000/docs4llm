# Platform REST API Reference

This document provides the reference for **Docs4LLM's HTTP APIs**, used by the Web interface, CLI tool, and external integrators.

---

## 1. Core Conversion Endpoints

### 1.1 `POST /api/convert` (or `POST /api/projects/convert`)
Triggers the conversion pipeline for any documentation URL.

* **Request Headers:**
  * `Content-Type: application/json`
  * `Cookie: ...` (User session or anonymous guest cookie)
* **Request Body:**
  ```json
  {
    "url": "https://docs.stripe.com",
    "name": "Stripe Documentation",
    "sourceType": "url"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "pending",
    "mcpUrl": "https://docs4llm.site/api/mcp/a1b2c3d4.../mcp"
  }
  ```

---

### 1.2 `GET /api/projects/{id}`
Polls the conversion progress, live logs, and project metadata.

* **Response (200 OK):**
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Stripe Documentation",
    "status": "ready",
    "sourceUrl": "https://docs.stripe.com",
    "logs": [
      {
        "id": "log_1",
        "timestamp": "2026-10-13T10:00:00Z",
        "level": "info",
        "phase": "crawl",
        "message": "Starting documentation crawl..."
      },
      {
        "id": "log_2",
        "timestamp": "2026-10-13T10:00:25Z",
        "level": "success",
        "phase": "crawl",
        "message": "Crawled 38 pages with TinyFish Agent"
      }
    ],
    "artifacts": {
      "llmsTxt": "# Stripe Documentation Index...",
      "compressedTools": [
        {
          "name": "create_payment_intent",
          "description": "Creates a Stripe payment intent..."
        }
      ]
    }
  }
  ```

---

### 1.3 `POST /api/projects/{id}/retry`
Restarts a failed pipeline job from the beginning.

* **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "crawling"
  }
  ```

---

## 2. MCP Server Protocol Endpoint

### `POST /api/mcp/{projectId}/mcp`
The Streamable HTTP (JSON-RPC 2.0) endpoint conforming to the Model Context Protocol.

* **Request Headers:**
  * `Authorization: Bearer d4l_live_<token>`
  * `Content-Type: application/json`
* **Request Body (JSON-RPC 2.0):**
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_documentation",
      "arguments": {
        "query": "refund customer"
      }
    }
  }
  ```
* **Response:**
  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "content": [
        {
          "type": "text",
          "text": "..."
        }
      ]
    }
  }
  ```

---

## 3. CLI Device Authentication Flow

Used by the `docs4llm` npm CLI for browser-based login:

### 3.1 `POST /api/cli/auth/start`
Starts a device authentication session.
* **Response:**
  ```json
  {
    "deviceCode": "abc-123-xyz",
    "userCode": "ABCD-EFGH",
    "verificationUri": "https://docs4llm.site/cli/auth?code=ABCD-EFGH",
    "expiresIn": 900
  }
  ```

### 3.2 `GET /api/cli/auth/poll?deviceCode={code}`
Polls for authorization completion in the browser.
* **Response (once authorized):**
  ```json
  {
    "status": "authorized",
    "token": "d4l_cli_token_..."
  }
  ```
