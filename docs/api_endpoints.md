
# API Endpoints — AI Health Predictor

**Base URL (Backend):** `http://127.0.0.1:8000`  
**ML Service:** `http://127.0.0.1:5000`

---

## Auth
### Register
- **POST** `/api/auth/register`
- **Body**
```json
{ "name":"Advika", "age":20, "sex":"Female", "email":"a@b.com", "password":"Secret@123" }
```
- **Response:** 201 Created

### Login
- **POST** `/api/auth/login`
- **Body**
```json
{ "email":"a@b.com", "password":"Secret@123" }
```
- **Response:**
```json
{ "token":"<JWT>", "user": { "...": "..." } }
```

---

## Prediction
> Requires `Authorization: Bearer <JWT>`

### Predict Disease
- **POST** `/api/predict`
- **Body**
```json
{
  "features": {
    "Age": 40,
    "Sex": "Female",
    "SmokingHistory": "Never",
    "DietType": "Healthy",
    "ExerciseFrequency": "Regular",
    "Fever": 1,
    "Cough": 1,
    "Headache": 1
  }
}
```
- **Response**
```json
{
  "prediction": "Flu",
  "confidence": 0.97,
  "explanation": { "method":"shap", "top_contributors":[...] },
  "historyId": "<ObjectId>"
}
```

### Get History
- **GET** `/api/predict/history`
- **Response:** Array of history entries (latest first).

---

## User
> Requires `Authorization: Bearer <JWT>`

### Profile
- **GET** `/api/user/profile`

---

## ML Service (Flask)
### Health
- **GET** `/health`

### Schema (features for form)
- **GET** `/schema`
- **Response:**
```json
{
  "numeric": ["Age"],
  "categorical": ["Sex", "SmokingHistory", "DietType", "ExerciseFrequency"],
  "symptoms": ["Fever","Cough","Headache", "..."],
  "target": "Disease",
  "feature_order": ["Age", "Sex", ...]
}
```

---

## Environment (.env in backend/)

```
MONGO_URI=mongodb://127.0.0.1:27017/ai_health_db
JWT_SECRET=supersecretkey
ML_API_URL=http://127.0.0.1:5000
PORT=8000
```

---

_Last updated: 2025-11-06_
