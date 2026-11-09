# API Endpoints — AI Health Predictor

**Backend base URL:** `http://127.0.0.1:8000`
**ML service:** `http://127.0.0.1:5000`

Protected routes need `Authorization: Bearer <JWT>`. Missing token → `401`, invalid/expired token → `403`.

---

## Auth

### Register — `POST /api/auth/register`
```json
{ "name": "Advika", "phone": "9876543210", "email": "a@b.com", "password": "Secret@123" }
```
`201` → `{ "message", "token", "user" }` (the client is signed in immediately).
`400` if a field is missing, the email is invalid, the password is shorter than 6 characters, or the email already exists.

### Login — `POST /api/auth/login`
```json
{ "email": "a@b.com", "password": "Secret@123" }
```
`200` → `{ "message", "token", "user" }`. `404` unknown user, `401` wrong password.

---

## Prediction (requires JWT)

### Predict — `POST /api/prediction`
```json
{
  "features": {
    "age": 40,
    "sex": "Female",
    "diet_type": "Healthy",
    "smoking_history": "Never",
    "physical_activity": "Regular",
    "symptoms": "Fever, Cough, Headache"
  }
}
```
Allowed values (these match the model's training categories):

| Field | Values |
|---|---|
| `sex` | Male, Female, Other |
| `diet_type` | Healthy, Average, Unhealthy (legacy: Vegetarian/Vegan/Pescatarian → Healthy, Non-Vegetarian/Other → Average) |
| `smoking_history` | Never, Former, Current |
| `physical_activity` | Rarely, Occasional, Regular (legacy: Low/Moderate/High) |
| `symptoms` | Comma/semicolon/newline separated; at least one must be a known symptom |

Response:
```json
{
  "prediction": "Flu",
  "confidence": 0.97,
  "explanation": { "method": "shap", "top_contributors": [{ "feature": "Fever", "contribution": 0.21 }] },
  "matchedSymptoms": ["Cough", "Fever", "Headache"],
  "unrecognizedSymptoms": [],
  "historyId": "<ObjectId>",
  "createdAt": "<ISO date>",
  "advice": { "short": "...", "avoid": [], "do": [], "prevention": [], "nutrition": {}, "urgent": false, "notes": "" }
}
```
`400` for invalid input, `502` if the ML service is down or returns an error.

### History — `GET /api/prediction/history`
The logged-in user's predictions, newest first.

### Schema — `GET /api/prediction/schema` (public)
Proxies the ML service schema: feature lists, allowed categories, and class names.

---

## User profile (requires JWT)

- `GET /api/user/profile` — current user (without password)
- `PUT /api/user/profile` — any of `{ phone, address, age, sex, diet_type, smoking_history }`. Sending `""` or `null` clears a field.

---

## Health check

- `GET /api/health` (backend) → `{ "status": "ok" }`
- `GET /health` (ML service)

---

## ML service (internal)

- `POST /predict` — `{ "features": { "Age": 40, "Sex": "Female", "SmokingHistory": "Never", "DietType": "Healthy", "ExerciseFrequency": "Regular", "Fever": 1, ... } }`
- `GET /schema`
