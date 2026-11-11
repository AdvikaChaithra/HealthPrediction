# Learning Guide — Health Risk Predictor (Hybrid Framework for Health Prediction)

A complete, A-to-Z walkthrough of this project: what every part does, **why** each technology was chosen, how a request travels through the system, a **7-day build plan** that recreates the project from scratch, and **20 interview questions** with answers and reasoning.

> **Medical disclaimer:** This is an educational project trained on a **synthetic** dataset. It is not a medical device and must never be used for real diagnosis.

---

## Table of Contents

1. [The Project in One Paragraph](#1-the-project-in-one-paragraph)
2. [The Problem and the Idea](#2-the-problem-and-the-idea)
3. [Big-Picture Architecture](#3-big-picture-architecture)
4. [Technology Choices and Why](#4-technology-choices-and-why)
5. [Folder-by-Folder, File-by-File Tour](#5-folder-by-folder-file-by-file-tour)
6. [The Machine Learning Part in Depth](#6-the-machine-learning-part-in-depth)
7. [The Backend in Depth](#7-the-backend-in-depth)
8. [The Frontend in Depth](#8-the-frontend-in-depth)
9. [The Database in Depth](#9-the-database-in-depth)
10. [End-to-End Request Walkthrough](#10-end-to-end-request-walkthrough)
11. [Security Model](#11-security-model)
12. [Bugs Found and Lessons Learned](#12-bugs-found-and-lessons-learned)
13. [How to Run Everything](#13-how-to-run-everything)
14. [Limitations and What to Improve](#14-limitations-and-what-to-improve)
15. [The 7-Day Build Plan](#15-the-7-day-build-plan)
16. [20 Interview Questions with Answers](#16-20-interview-questions-with-answers)
17. [Glossary (A to Z)](#17-glossary-a-to-z)

---

## 1. The Project in One Paragraph

A signed-in user enters their **age, sex, diet quality, smoking history, physical activity, and symptoms**. A **React + TypeScript** frontend sends this to a **Node.js/Express** API, which validates it, converts it into the exact 33 features the model expects, and calls a **Python Flask** microservice. Flask runs a trained **Random Forest** (scikit-learn) and returns the most likely of **7 diseases**, a **confidence score**, and a **SHAP explanation** of which inputs drove that prediction. The Express API attaches **health guidance** (what to avoid, what to do, prevention, nutrition, urgency), saves everything to **MongoDB** as the user's history, and returns it to the UI.

The 7 conditions: **Anemia, COVID-19, Dengue, Diabetes, Flu, Heart Disease, Kidney Disease.**

---

## 2. The Problem and the Idea

**Problem:**
- People search their symptoms online and get alarming, contradictory results with **no explanation** of why a condition is suggested and no record over time.
- Many ML student projects stop in a Jupyter notebook. They never answer: *how does a trained model become a secure, usable app?*

**Idea:** build the whole pipeline end to end:

| Need | Solution in this project |
|---|---|
| Predict a disease from symptoms | Random Forest classifier |
| Explain *why* | SHAP (per prediction) + global feature importance |
| Check it's not biased | Fairness report by sex and age group |
| Secure, per-user experience | JWT authentication + bcrypt password hashing |
| Remember past results | MongoDB history collection |
| Be useful, not just a label | Structured guidance per disease |

This is called a **hybrid framework** because it combines two worlds: a **web stack** (JavaScript) and an **ML stack** (Python), each doing what it is best at.

---

## 3. Big-Picture Architecture

```text
┌──────────────────────┐   HTTP + JWT   ┌──────────────────────────┐   HTTP (JSON)   ┌──────────────────────────┐
│  Frontend (React/TS) │ ─────────────▶ │  Backend (Node/Express)  │ ──────────────▶ │  ML Service (Flask)      │
│  Vite dev server     │ ◀───────────── │  port 8000               │ ◀────────────── │  port 5000               │
│  port 5173           │    JSON        │  auth, validation,       │   prediction,   │  model.pkl (Pipeline)    │
└──────────────────────┘                │  advice, history         │   confidence,   │  SHAP TreeExplainer      │
                                        └────────────┬─────────────┘   explanation   └──────────────────────────┘
                                                     │ Mongoose
                                                     ▼
                                        ┌──────────────────────────┐
                                        │  MongoDB (port 27017)    │
                                        │  users, histories        │
                                        └──────────────────────────┘
```

**Three processes + one database.** Each one can be started, restarted, scaled or replaced independently.

**Why split into a separate ML service instead of doing everything in Node?**
- The ML ecosystem (scikit-learn, pandas, SHAP) lives in **Python**. There is no equal in JavaScript.
- Web concerns (auth, users, routing, JSON APIs) are very comfortable in **Node/Express**.
- The model is loaded **once** into memory by Flask and reused for every request. The web server stays light.
- If the model changes, only the ML service is redeployed. If the UI or auth changes, the model is untouched.
- This is the same pattern used in industry: **model serving as a microservice**.

---

## 4. Technology Choices and Why

### 4.1 Machine Learning layer

| Technology | What it does here | Why it was chosen |
|---|---|---|
| **Python** | Language for training and serving | The standard language of data science; all the libraries below are Python-first. |
| **pandas** | Loads the CSV, builds the 1-row DataFrame per request | Column-named tables make it easy to keep feature order consistent between training and serving. |
| **NumPy** | Numeric arrays, `argmax`, sorting SHAP values | Fast vector math underneath pandas/scikit-learn. |
| **scikit-learn** | `RandomForestClassifier`, `ColumnTransformer`, `OneHotEncoder`, `StandardScaler`, `Pipeline`, metrics | Mature, well-documented, perfect for tabular data. `Pipeline` bundles preprocessing + model into one object. |
| **Random Forest** | The classifier | Great default for **tabular** data with mixed numeric/categorical/binary features; robust to noise; little tuning needed; gives feature importances; works with **TreeSHAP** for fast, exact explanations. |
| **SHAP** | Explains each prediction | Grounded in game theory (Shapley values); shows how much each feature pushed the prediction toward or away from the predicted class. `TreeExplainer` is fast for tree models. |
| **joblib** | Saves/loads `model.pkl` | Efficient for objects containing large NumPy arrays (a 600-tree forest is ~21 MB). |
| **Flask** | Serves `/health`, `/schema`, `/predict` | Tiny, minimal web framework; perfect for a small internal API with 3 routes. |
| **Flask-CORS** | Allows cross-origin calls | Lets the service be called from other origins during development. |
| **Git LFS** | Stores `model.pkl` | Git is bad at large binaries; LFS stores them outside normal history (see `.gitattributes`). |

**Why not deep learning?** The data is small (5,000 rows) and tabular (33 columns). Neural networks need much more data and give little benefit on this kind of data, while being harder to explain. Tree ensembles usually win on small tabular datasets.

**Why not Logistic Regression or a single Decision Tree?**
- Logistic Regression is linear; it cannot capture symptom *combinations* (for example "fever + bleeding gums + joint pain → Dengue") without manual feature engineering.
- A single tree overfits easily. A **forest** of 600 trees averages many trees trained on random samples and random feature subsets, which reduces variance.

### 4.2 Backend layer

| Technology | What it does here | Why it was chosen |
|---|---|---|
| **Node.js** | JavaScript runtime for the server | Same language as the frontend; non-blocking I/O is ideal for an API that mostly waits on the database and the ML service. |
| **Express 5** | Routing, middleware, JSON parsing | The most widely used Node framework. Express 5 forwards errors from `async` handlers to the error handler automatically. |
| **ES Modules** (`"type": "module"`) | `import`/`export` syntax | Modern, standard JavaScript; matches the frontend style. |
| **Mongoose 8** | MongoDB object modeling | Schemas, validation (`enum`, `min`, `max`, `required`), defaults and timestamps on top of a schemaless database. |
| **jsonwebtoken** | Creates/verifies JWTs | Stateless auth: the server doesn't store sessions, it just verifies a signed token. |
| **bcryptjs** | Hashes passwords | Slow, salted hashing designed for passwords; pure JS so it installs everywhere without native build tools. |
| **axios** | Calls the Flask service | Simple promise API, timeouts, readable error objects. |
| **cors** | Allows the browser app (port 5173) to call the API (port 8000) | Browsers block cross-origin requests unless the server allows them. |
| **dotenv** | Loads `backend/.env` | Keeps secrets (`JWT_SECRET`, `MONGO_URI`) out of source code. |
| **nodemon** (dev) | Restarts the server on file changes | Faster development loop (`npm run dev`). |

### 4.3 Frontend layer

| Technology | What it does here | Why it was chosen |
|---|---|---|
| **React 18** | Component-based UI | Industry standard; components (pages, cards) are easy to reuse. |
| **TypeScript** | Static types | Catches mistakes at build time (for example a missing `loading` field in the auth context was a real bug caught by `tsc`). |
| **Vite 5** | Dev server and bundler | Very fast startup and hot reload; simple config. |
| **Tailwind CSS 3** | Styling with utility classes | No separate CSS files to manage; responsive classes like `md:grid-cols-2` built in. |
| **lucide-react** | Icons | Lightweight, consistent icon set as React components. |
| **axios** | HTTP client | An **interceptor** attaches the JWT to every request automatically. |
| **React Context** | Global auth state | Only one piece of global state (the user/token), so Redux would be overkill. |
| **ESLint** | Linting | Enforces hook rules and catches unused variables / `any` types. |

### 4.4 Database layer

| Technology | Why it was chosen |
|---|---|
| **MongoDB** | A prediction record is a **nested document**: form inputs, 33 features, an explanation list, and an advice object with arrays and a sub-object. Storing that as one JSON-like document is natural; in SQL it would need several tables or JSON columns. MongoDB also fits the JavaScript stack (the "M" in MERN). |

---

## 5. Folder-by-Folder, File-by-File Tour

```text
Project/
├── backend/                      Node + Express REST API (port 8000)
│   ├── app.js                    Entry point: loads env, middleware, routes, error handler, starts server
│   ├── config/diseaseAdvice.js   Guidance text for each of the 7 diseases + a default
│   ├── controllers/
│   │   ├── authController.js     register, login
│   │   ├── predictionController.js  validate → map features → call ML → advice → save history
│   │   └── userController.js     get/update profile
│   ├── middleware/verifyToken.js Checks "Authorization: Bearer <JWT>", sets req.userId
│   ├── models/
│   │   ├── User.js               Mongoose schema for users
│   │   └── History.js            Mongoose schema for predictions
│   ├── routes/                   authRoutes, predictionRoutes, userRoutes
│   ├── utils/
│   │   ├── connectDB.js          mongoose.connect with exit on failure
│   │   └── mlService.js          axios calls to Flask /schema and /predict
│   └── package.json
│
├── frontend/                     React + TypeScript + Vite + Tailwind (port 5173)
│   ├── src/
│   │   ├── main.tsx              Mounts <App/> into #root
│   │   ├── App.tsx               Auth gate + simple page switch (home/history/about)
│   │   ├── context/AuthContext.tsx  user, token, loading, login/register/logout/refreshProfile
│   │   ├── lib/api.ts            axios instance + JWT interceptor
│   │   ├── types.ts              Shared types, dropdown options, getErrorMessage()
│   │   ├── components/
│   │   │   ├── Navigation.tsx    Top bar
│   │   │   ├── AdviceCards.tsx   Guidance cards (used by Home and History)
│   │   │   └── ExplanationList.tsx  "Top Contributing Factors" bars
│   │   └── pages/
│   │       ├── Login.tsx         Sign in / sign up
│   │       ├── Home.tsx          Symptom checker form + result
│   │       ├── History.tsx       List of past predictions + details modal
│   │       └── About.tsx         User profile editor
│   ├── supabase/migrations/      Leftover from the scaffold; NOT used by the app
│   ├── vite.config.ts, tailwind.config.js, postcss.config.js, tsconfig*.json, eslint.config.js
│   └── package.json
│
├── ml/                           Python ML service and training (port 5000)
│   ├── app.py                    Flask API: /health, /schema, /predict
│   ├── preprocessing.py          Column lists + ColumnTransformer builder
│   ├── model_training.py         Train, evaluate, save model.pkl + training_report.json
│   ├── explainability.py         Local (per request) and global SHAP explanations
│   ├── fairness_check.py         Metrics by sex and age group → fairness_report.csv
│   ├── model.pkl                 Trained Pipeline + schema (Git LFS, ~21 MB)
│   ├── training_report.json      Accuracy/precision/recall/F1 + per-class report
│   ├── fairness_report.csv       Output of fairness_check.py
│   ├── global_explain.json       Output of explainability.py
│   ├── requirements.txt          Pinned Python dependencies
│   └── dataset/                  (git-ignored) realistic_symptom_disease_dataset.csv
│
├── database/mongo_setup.js       One-time: create indexes, optionally seed a test user
├── docs/                         api_endpoints.md, architecture_diagram.png, project_report.docx
├── .gitattributes                Git LFS rules for *.pkl, *.joblib, *.pt, *.onnx, *.h5
├── .gitignore                    node_modules, dist, .venv, .env files, ml/dataset/
├── README.md
└── learning.md                   This file
```

---

## 6. The Machine Learning Part in Depth

### 6.1 The dataset

File: `ml/dataset/realistic_symptom_disease_dataset.csv` (not committed; git-ignored).

| Property | Value |
|---|---|
| Rows | 5,000 |
| Columns | 34 (33 features + 1 target) |
| Target | `Disease` (7 classes, ~660–735 rows each, so roughly **balanced**) |
| Numeric | `Age` (18–79, mean ≈ 49) |
| Categorical | `Sex` (Male/Female), `SmokingHistory` (Never/Former/Current), `DietType` (Healthy/Average/Unhealthy), `ExerciseFrequency` (Rarely/Occasional/Regular) |
| Binary symptoms (28) | Back Pain, Bleeding Gums, Blurred Vision, Body Ache, Chest Pain, Cold Hands, Cough, Dizziness, Fatigue, Fever, Frequent Urination, Headache, High Fever, Increased Thirst, Irregular Heartbeat, Itching, Joint Pain, Loss of Smell, Nausea, Pale Skin, Rash, Shortness of Breath, Slow Healing, Sore Throat, Sweating, Swelling, Weakness, Weight Loss |

**Important:** the dataset is **synthetic**. Real clinical data is messy and overlapping; this data is cleanly separable, which is why accuracy is almost perfect.

### 6.2 Preprocessing (`preprocessing.py`)

```python
NUMERIC_COLS     = ["Age"]
CATEGORICAL_COLS = ["Sex", "SmokingHistory", "DietType", "ExerciseFrequency"]
# everything else except "Disease" = symptom columns
```

`build_preprocessor()` creates a **ColumnTransformer**:

| Step | Applied to | What it does | Why |
|---|---|---|---|
| `StandardScaler` | Age | (x − mean) / std | Puts age on a standard scale. *Note:* tree models don't actually need scaling; it is harmless and would help if you swapped in a linear model. |
| `OneHotEncoder(handle_unknown="ignore")` | 4 categorical columns | `Sex=Male` → `[0, 1]` etc. | Models need numbers. `handle_unknown="ignore"` means an unseen value becomes all zeros instead of crashing. |
| `remainder="passthrough"` | 28 symptoms | Left as 0/1 | Already numeric. |

After transformation there are 1 + 2 + 3 + 3 + 3 + 28 = **40 model inputs**.

`get_feature_schema()` saves the column lists so serving can rebuild the exact same column order.

### 6.3 Training (`model_training.py`)

```python
train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

RandomForestClassifier(
    n_estimators=600,       # 600 trees: more trees = more stable averages
    max_depth=18,           # limits tree depth to reduce overfitting
    class_weight="balanced",# protects against any class imbalance
    random_state=42,        # reproducible results
    n_jobs=-1,              # use all CPU cores
)

pipe = Pipeline([("prep", preprocessor), ("clf", clf)])
pipe.fit(X_train, y_train)
joblib.dump({"pipeline": pipe, "schema": schema}, "model.pkl")
```

**Why a `Pipeline`?** The preprocessor is *fitted on training data only* and saved together with the model. At prediction time the same scaler mean/std and the same one-hot categories are applied. This prevents **training/serving skew** and **data leakage**.

**Why `stratify=y`?** Keeps the same class proportions in train and test sets, so the test score is fair for every disease.

**Why save the schema with the model?** The Flask app reads `bundle["schema"]` to know the exact feature names and order. The model and the feature list can never get out of sync.

### 6.4 Results (`training_report.json`)

| Metric (weighted) | Score |
|---|---|
| Accuracy | 0.998 |
| Precision | 0.998 |
| Recall | 0.998 |
| F1 | 0.998 |

Per-class F1: Anemia 1.000, COVID-19 0.993, Dengue 1.000, Diabetes 1.000, Flu 0.993, Heart Disease 1.000, Kidney Disease 1.000.

**How to read this honestly:** 99.8% on synthetic data shows the pipeline works, **not** that the model would diagnose real patients well. COVID-19 and Flu are the only classes with errors because their symptoms overlap (fever, cough, sore throat), which is exactly what you would expect.

### 6.5 Fairness (`fairness_check.py` → `fairness_report.csv`)

The script re-creates the same test split and computes metrics per group:

| Group | Accuracy |
|---|---|
| Overall | 0.998 |
| Sex = Male | 1.000 |
| Sex = Female | 0.996 |
| Age ≤ 30 | 0.995 |
| Age 31–45 | 1.000 |
| Age 46–60 | 1.000 |
| Age 60+ | 0.997 |

**Why it matters:** a model can have high overall accuracy but fail a subgroup. Here the gap is under 0.5 percentage points, so no group is noticeably disadvantaged *on this data*.

### 6.6 Explainability (`explainability.py`)

**Local explanation (one prediction):**
1. Build the same 1-row DataFrame as `/predict`.
2. Transform it with the fitted preprocessor.
3. Run `shap.TreeExplainer` on the Random Forest.
4. For a multiclass model SHAP returns values with shape `(1 sample, 40 features, 7 classes)`. Take the column for the **predicted class**.
5. Sort by absolute value and return the top 6, with names cleaned (`remainder__Fever` → `Fever`).

Positive value = pushed the model **toward** the predicted disease. Negative = pushed it **away**.

Example from a real run (Fever, Joint Pain, Bleeding Gums → Dengue):

```text
Bleeding Gums  +0.175
Joint Pain     +0.099
High Fever     -0.055   (absence of High Fever counts against Dengue)
```

**Global explanation** (`python explainability.py` → `global_explain.json`): averages absolute SHAP values over 200 sampled rows and all classes, giving the features that matter most overall (for example Swelling, Shortness of Breath, Headache).

**Fallback:** if SHAP fails for any reason, the code returns the forest's built-in `feature_importances_` and labels the method `feature_importances_fallback`, so the API never breaks because of explanation errors.

**Performance:** the model and the SHAP explainer are cached in module-level variables, so they are built once per process, not on every request.

### 6.7 The Flask service (`app.py`)

| Route | Purpose |
|---|---|
| `GET /health` | Liveness check + feature list |
| `GET /schema` | Feature lists, **allowed categories** (read from the fitted encoder), class names |
| `POST /predict` | Body `{"features": {...}}` → `{prediction, confidence, explanation}` |

`/predict` steps:
1. Validate the JSON body (400 if not `{"features": {...}}`).
2. Start every feature at 0, overwrite the ones provided (unknown keys are ignored).
3. Convert numeric columns to `float` (400 if not a number).
4. `predict_proba` → `argmax` gives the class and its probability (the **confidence**).
5. Add the SHAP explanation.

The model path is built from the file's own folder (`os.path.dirname(__file__)`), so the service starts correctly no matter which directory you run it from.

---

## 7. The Backend in Depth

### 7.1 `app.js` — startup order matters

```js
import "dotenv/config";   // FIRST: loads .env before any other module reads process.env
import express from "express";
...
for (const key of ["MONGO_URI", "JWT_SECRET"]) { if (!process.env[key]) process.exit(1); }
app.use(cors());
app.use(express.json());
app.get("/api/health", ...);
app.use("/api/auth", authRoutes);
app.use("/api/prediction", predictionRoutes);
app.use("/api/user", userRoutes);
app.use(404 handler);
app.use(error handler);   // turns malformed JSON etc. into clean JSON errors
connectDB().then(() => app.listen(PORT));   // only accept traffic once the DB is ready
```

**Why `import "dotenv/config"` at the very top?** In ES Modules all `import` statements are **hoisted** and run before the file's body. If you call `dotenv.config()` in the body, modules like `mlService.js` have already read `process.env.ML_API_URL` (still undefined). This was a real bug in the project.

**Why fail fast on missing env vars?** Without `JWT_SECRET`, the first login would crash with a confusing error. Exiting at startup with a clear message is far easier to debug.

### 7.2 Routes

| Method | Path | Auth | Controller |
|---|---|---|---|
| POST | `/api/auth/register` | – | `register` |
| POST | `/api/auth/login` | – | `login` |
| POST | `/api/prediction` | JWT | `predict` |
| GET | `/api/prediction/history` | JWT | `getHistory` |
| GET | `/api/prediction/schema` | – | proxies Flask `/schema` |
| GET | `/api/user/profile` | JWT | `getProfile` |
| PUT | `/api/user/profile` | JWT | `updateProfile` |
| GET | `/api/health` | – | inline |

**Pattern: Route → Middleware → Controller → Model.** Routes only wire URLs; middleware handles cross-cutting concerns (auth); controllers hold the logic; models talk to the database. This is the **MVC-style separation of concerns** that keeps each file small and testable.

### 7.3 `middleware/verifyToken.js`

```js
const [scheme, token] = (req.headers.authorization || "").split(" ");
if (scheme !== "Bearer" || !token) return 401;
const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if tampered/expired
req.userId = decoded.id;
next();
```

- **401** = you didn't send credentials. **403** = you sent them but they are invalid/expired.
- The user id comes **from the token**, never from the request body, so a user cannot read someone else's history by changing an id.

### 7.4 `authController.js`

- **Register:** trims and lowercases the email, checks the email format and password length (≥ 6), rejects duplicates (including the race case: MongoDB error code `11000` from the unique index), hashes with `bcrypt.hash(password, 10)`, returns a token so the user is signed in immediately.
- **Login:** finds the user by normalized email, `bcrypt.compare`, signs `{ id }` with a **7-day** expiry.
- `publicUser()` makes sure the password hash is **never** sent to the client.

### 7.5 `predictionController.js` — the heart of the API

1. **Validate** every field: age 0–120, sex in {Male, Female, Other}, smoking in {Never, Former, Current}, diet and activity via maps.
2. **Map form values to model categories.** The model only knows specific words:

   ```js
   DIET_MAP     = { healthy: "Healthy", average: "Average", unhealthy: "Unhealthy",
                    vegetarian: "Healthy", vegan: "Healthy", pescatarian: "Healthy",
                    "non vegetarian": "Average", other: "Average" };       // last five = legacy values
   ACTIVITY_MAP = { rarely: "Rarely", occasional: "Occasional", regular: "Regular",
                    low: "Rarely", moderate: "Occasional", high: "Regular" }; // last three = legacy
   ```

3. **Parse symptoms:** split on commas, semicolons or newlines; `normalize()` lowercases and turns `-`/`_` into spaces, so `loss-of-smell` matches `Loss of Smell`. Each of the 28 symptoms becomes 0 or 1.
4. **Reject** the request if **no** symptom was recognised (a prediction from zero symptoms would be meaningless).
5. **Call Flask** through `mlService.js` (30 s timeout; returns **502 Bad Gateway** if Flask is down).
6. **Look up advice** with a normalized key (`"COVID-19"` → `"covid 19"`), falling back to the `default` advice.
7. **Save** a `History` document and **respond** with prediction, confidence, explanation, `matchedSymptoms`, `unrecognizedSymptoms`, advice and the history id.

### 7.6 `userController.js`

- `getProfile` returns the user without the password (`.select("-password")`).
- `updateProfile` only accepts a whitelist of fields (`phone, address, age, sex, diet_type, smoking_history`). This prevents **mass assignment** (a user can't change their `email` or `password` hash through this route). Empty string or `null` **unsets** a field. `runValidators: true` makes Mongoose enforce enums on updates; validation errors return **400**, not 500.

### 7.7 `config/diseaseAdvice.js`

A plain object keyed by disease name. Each entry has:

```js
{ short, avoid: [], do: [], prevention: [], nutrition: { recommended: [], avoid: [] }, urgent, notes }
```

**Why hard-coded in the backend and not in the ML model?** Guidance is **content**, not a prediction. Keeping it separate means a doctor or content writer can change the text without retraining or redeploying the model.

---

## 8. The Frontend in Depth

### 8.1 App shell (`App.tsx`)

```tsx
if (loading) return <Spinner/>;     // checking a stored token
if (!user)   return <Login/>;       // not signed in
return <Navigation/> + (home | history | about page);
```

There is no React Router. Pages are switched with a `currentPage` state variable. **Why:** only 3 pages and no need for shareable URLs, so a router would add complexity without benefit. (Trade-off: the browser Back button doesn't move between pages.)

### 8.2 Auth (`context/AuthContext.tsx`)

- Holds `user`, `token`, `loading` and the functions `login`, `register`, `logout`, `refreshProfile`.
- On startup, if a token is stored, it calls `/user/profile` to **validate** it. While that runs, `loading` is true so the user sees a spinner instead of a flash of the login screen.
- It only logs out on **401/403/404**, so a temporary network error doesn't sign the user out.
- The token is stored in `localStorage` so the session survives a page refresh.

### 8.3 API client (`lib/api.ts`)

```ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api" });
api.interceptors.request.use(cfg => { cfg.headers.Authorization = `Bearer ${token}`; return cfg; });
```

**Why an interceptor?** Every protected call needs the header. Adding it in one place avoids forgetting it in some page.

**Why `VITE_` prefix?** Vite only exposes env variables starting with `VITE_` to browser code, so server secrets can't leak into the bundle by accident.

### 8.4 Shared types (`types.ts`)

- TypeScript types for `User`, `Advice`, `Explanation`, `PredictionResult`, `HistoryItem`.
- The dropdown option lists (`DIET_OPTIONS`, `ACTIVITY_OPTIONS`, …) **match the model's categories**, defined once and reused by Home and About.
- `getErrorMessage(err)` turns any error (axios, network, plain Error) into a friendly sentence, for example *"Cannot reach the server. Is the backend running?"*.

### 8.5 Pages and components

| File | What it shows | Notable details |
|---|---|---|
| `Login.tsx` | Sign in / sign up toggle | HTML5 validation (`required`, `type="email"`, `minLength={6}`) for instant feedback; server validates again. |
| `Home.tsx` | Symptom checker | Pre-fills age/sex/diet/smoking from the profile; clickable symptom chips add known symptoms; shows confidence bar, symptoms used/ignored, top factors and advice. |
| `History.tsx` | Past predictions, newest first | Click opens a modal; closes with ✕, backdrop click, or **Escape**; cancels state updates if you leave the page mid-request. |
| `About.tsx` | Profile editor | Name/email read-only; empty fields clear the saved value. |
| `AdviceCards.tsx` | Avoid / Do / Prevention / Nutrition / Notes / Urgent banner | One component used by both Home and History (no duplicate markup). |
| `ExplanationList.tsx` | Bars for top SHAP factors | Green = toward the prediction, red = away. |
| `Navigation.tsx` | Top bar | Labels hide on small screens, icons stay. |

### 8.6 Styling

Tailwind scans `index.html` and `src/**/*.tsx` (see `tailwind.config.js`) and generates only the classes used. PostCSS runs Tailwind + Autoprefixer. Result: ~17 KB of CSS in the production build.

---

## 9. The Database in Depth

### 9.1 `users` collection (`models/User.js`)

| Field | Type | Rules |
|---|---|---|
| name | String | required, trimmed |
| email | String | required, **unique**, lowercased, trimmed |
| password | String | required (bcrypt hash, never plain text) |
| phone, address | String | optional |
| age | Number | 0–120 |
| sex | String | Male / Female / Other |
| diet_type | String | Healthy / Average / Unhealthy (+ legacy values) |
| smoking_history | String | Never / Former / Current |
| createdAt, updatedAt | Date | automatic (`timestamps: true`) |

### 9.2 `histories` collection (`models/History.js`)

```js
{
  userId:      ObjectId (ref User, indexed),
  form:        { age, sex, diet_type, smoking_history, physical_activity, symptoms_text }, // what the user typed
  features:    { Age, Sex, ..., Fever: 1, Cough: 0, ... },                                // what the model saw
  prediction:  "Dengue",
  confidence:  0.57,                 // 0..1
  explanation: { method, top_contributors: [...] },
  advice:      { short, avoid, do, prevention, nutrition, urgent, notes },
  createdAt, updatedAt
}
```

**Why store both `form` and `features`?** `form` is for humans (show what was entered). `features` is for auditing and debugging (what exactly the model received). If the mapping logic changes later, old records still show what really happened.

**Why store `advice` as a copy instead of looking it up later?** If the advice text is updated, the user's history still shows the advice they actually saw at that time.

### 9.3 Indexes

- `users.email` unique: fast login lookups and no duplicate accounts.
- `histories { userId: 1, createdAt: -1 }` compound index: the history query is `find({ userId }).sort({ createdAt: -1 })`, and this index serves it directly without an in-memory sort.

`database/mongo_setup.js` creates these indexes and can optionally seed a local test user (development only).

---

## 10. End-to-End Request Walkthrough

User enters: Age 28, Female, Healthy, Never, Regular, "Fever, Joint Pain, Bleeding Gums".

```text
1. Browser   POST /api/prediction  { features: { age: "28", sex: "Female", ... symptoms: "Fever, Joint Pain, Bleeding Gums" } }
             Header: Authorization: Bearer eyJ...
2. Express   express.json() parses the body
3. Express   verifyToken → jwt.verify → req.userId = "6af2..."
4. Express   predict(): validate → map → { Age: 28, Sex: "Female", DietType: "Healthy",
             ExerciseFrequency: "Regular", SmokingHistory: "Never", Fever: 1, "Joint Pain": 1, "Bleeding Gums": 1, others: 0 }
5. Express   axios POST http://127.0.0.1:5000/predict { features: {...} }
6. Flask     DataFrame (1 row, 33 cols) → ColumnTransformer → 40 numbers → 600 trees vote
             predict_proba → Dengue 0.57 → SHAP for class "Dengue"
7. Flask     → { prediction: "Dengue", confidence: 0.57, explanation: {...} }
8. Express   advice = diseaseAdvice["dengue"]; History.create({...})
9. Express   → 200 { prediction, confidence, explanation, matchedSymptoms, advice, historyId, ... }
10. React    setResult(data) → confidence bar, factors, guidance cards, urgent banner
```

Why only 57% confidence here? Because "Fever + Joint Pain" alone also fits Flu and others; Bleeding Gums is the strongest Dengue signal. Adding more Dengue symptoms (High Fever, Rash) raises confidence.

---

## 11. Security Model

| Concern | How it is handled | Possible improvement |
|---|---|---|
| Password storage | bcrypt with salt, cost factor 10 | Raise cost to 12 on modern hardware |
| Authentication | JWT signed with `JWT_SECRET`, 7-day expiry | Shorter access token + refresh token |
| Token storage | `localStorage` | `httpOnly` cookie protects against XSS token theft |
| Authorization | `userId` taken from the token, never the body | — |
| Mass assignment | Profile update whitelists fields | — |
| Secrets | `.env` files are git-ignored | Use a secret manager in production |
| Input validation | Server-side checks on every prediction field | Schema validator (e.g. zod/Joi) |
| CORS | Open (`cors()`) for development | Restrict to the frontend origin in production |
| Brute force | Not handled | Rate limiting on `/auth/login` |
| User enumeration | Login returns 404 vs 401 (reveals if an email exists) | Return one generic "invalid credentials" message |
| ML service | Not exposed to users directly; called by the backend | Bind Flask to `127.0.0.1` in production and use a WSGI server (gunicorn/waitress) |

---

## 12. Bugs Found and Lessons Learned

These were real bugs found in a full audit of this project. Each one teaches a general lesson.

| # | Bug | Effect | Lesson |
|---|---|---|---|
| 1 | Form sent `Vegetarian/Low/Moderate/High`, model trained on `Healthy/Average/Unhealthy` and `Rarely/Occasional/Regular` | `OneHotEncoder(handle_unknown="ignore")` silently turned them into zeros, so diet and activity **never influenced** predictions | Silent fallbacks hide bugs. Validate inputs against the model's real categories (now exposed at `/schema`). |
| 2 | SHAP code averaged a 3-D array the wrong way and crashed on every call | Every prediction showed the **same** 6 global features | Check shapes for multiclass outputs; test that explanations change with input. |
| 3 | `model.pkl` reloaded inside every SHAP call | ~21 MB disk read per request | Load heavy objects once and cache them. |
| 4 | `dotenv.config()` called after imports in ESM | `ML_API_URL` from `.env` was ignored | ES imports are hoisted; load env with `import "dotenv/config"` first. |
| 5 | `History.form.sex` had `enum` without `""` but `default: ""` | Saving failed when sex was empty | Defaults must satisfy their own validators. |
| 6 | `App.tsx` used `loading` that the context never provided | TypeScript error; login screen flashed on refresh | Run `tsc` in CI; types catch integration mistakes. |
| 7 | Any profile-fetch error logged the user out | Wi-Fi blip = signed out | Distinguish auth errors (401/403) from network errors. |
| 8 | `global_explain.json` refit the preprocessor and used the wrong axis | Global importance listed only demographics | Never `fit` again on a fitted pipeline; use `transform`. |

---

## 13. How to Run Everything

Prerequisites: Node 18+, Python 3.9+, MongoDB running locally, Git LFS.

```bash
# 1. ML service
cd ml
python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
python app.py                   # http://127.0.0.1:5000
```

```bash
# 2. Backend  (create backend/.env with MONGO_URI, JWT_SECRET, ML_API_URL, PORT)
cd backend
npm install
npm run dev                     # http://127.0.0.1:8000
```

```bash
# 3. Frontend (create frontend/.env with VITE_API_BASE_URL=http://127.0.0.1:8000/api)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Useful checks:

```bash
cd frontend && npm run typecheck && npm run lint && npm run build
```

```bash
cd ml && python model_training.py && python explainability.py && python fairness_check.py
```

---

## 14. Limitations and What to Improve

1. **Synthetic data** — metrics don't reflect real clinical performance.
2. **Closed label set** — the model always picks one of 7 diseases, even for unrelated symptoms. Add an "uncertain, see a doctor" threshold on confidence.
3. **Keyword symptom matching** — no synonyms or spelling tolerance. Could use fuzzy matching or NLP extraction.
4. **Sex = "Other"** — accepted by the UI but not in the training data, so it has no effect on the model.
5. **No automated tests** — add pytest for the ML service, Jest/Supertest for the API, and React Testing Library for the UI.
6. **No router** — add React Router for URLs and back-button support.
7. **Development servers** — Flask dev server and Vite dev server are not for production; use gunicorn/waitress and a static build behind nginx.
8. **Hard-coded advice** — should be reviewed by medical professionals and stored in the database or a CMS.
9. **Show top-3 predictions** with probabilities instead of only the top one.
10. **Docker Compose** to start all services with one command.

---

## 15. The 7-Day Build Plan

A step-by-step plan to recreate this project from an empty folder. Each day ends with something that **works**, so you always have a checkpoint.

### Day 1 — Planning, Data, and Environment

**Goal:** understand the problem, explore the data, and set up the repository.

1. Write the problem statement and the list of features (form fields, outputs, history, auth).
2. Draw the architecture: React → Express → Flask, with MongoDB beside Express.
3. Create the repo and folders: `frontend/`, `backend/`, `ml/`, `database/`, `docs/`.
4. Add `.gitignore` (node_modules, .venv, .env, dist, `ml/dataset/`) and set up **Git LFS** for `*.pkl`.
5. Create the Python virtual environment; install pandas, numpy, scikit-learn, shap, flask, flask-cors, joblib.
6. Load the CSV in a notebook or script and explore:
   - `df.shape`, `df.columns`, `df["Disease"].value_counts()` (is it balanced?)
   - Value counts for each categorical column (**write these down — the form must use exactly these values**).
   - `df.isna().sum()` and `df["Age"].describe()`.

**Why first:** every later decision (model choice, form options, validation) depends on what the data looks like.

**End of day:** repo exists, environment works, you know the 33 features and 7 classes.

### Day 2 — Preprocessing and Model Training

**Goal:** a trained, evaluated, saved model.

1. Write `preprocessing.py`: column lists, `get_feature_schema()`, `build_preprocessor()` with `StandardScaler` + `OneHotEncoder(handle_unknown="ignore")` + passthrough.
2. Write `model_training.py`:
   - Stratified 80/20 split with `random_state=42`.
   - `Pipeline([("prep", ...), ("clf", RandomForestClassifier(...))])`.
   - Evaluate accuracy, weighted precision/recall/F1, `classification_report`.
   - Save `{"pipeline", "schema"}` with joblib; save `training_report.json`.
3. Try a baseline (Logistic Regression or a single Decision Tree) and compare, so you can **justify** the Random Forest choice.

**Why a Pipeline:** preprocessing and model travel together, so serving uses the exact same transformations as training.

**End of day:** `model.pkl` and `training_report.json` exist; you can explain the scores.

### Day 3 — Explainability, Fairness, and the Flask Service

**Goal:** the model is served over HTTP with explanations.

1. Write `explainability.py`:
   - `local_explain()` with `shap.TreeExplainer`, picking the **predicted class** slice for multiclass output.
   - `global_explain()` writing `global_explain.json`.
   - A fallback to `feature_importances_`.
2. Write `fairness_check.py`: metrics by sex and by age band → `fairness_report.csv`.
3. Write `app.py` with `/health`, `/schema`, `/predict`. Load the model **once** at startup.
4. Test with curl or Postman:

   ```bash
   curl -X POST http://127.0.0.1:5000/predict -H "Content-Type: application/json" -d "{\"features\":{\"Age\":40,\"Sex\":\"Male\",\"SmokingHistory\":\"Never\",\"DietType\":\"Healthy\",\"ExerciseFrequency\":\"Regular\",\"Fever\":1,\"Cough\":1}}"
   ```
5. Test that **different inputs give different explanations** (this catches the SHAP bug from section 12).

**End of day:** ML microservice runs on port 5000 and returns prediction + confidence + explanation.

### Day 4 — Backend Foundation: Express, MongoDB, Auth

**Goal:** users can register and log in through the API.

1. `npm init`, set `"type": "module"`, install express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, axios, nodemon.
2. `app.js` with `import "dotenv/config"` **first**, CORS, JSON body parser, env checks, error handler.
3. `utils/connectDB.js`; start MongoDB and connect.
4. `models/User.js` with validation and a unique email index.
5. `controllers/authController.js` (register with bcrypt, login with JWT) and `routes/authRoutes.js`.
6. `middleware/verifyToken.js`.
7. Test register → login → use the token on a protected test route.

**Why auth before predictions:** history must belong to a user, so the user model and token must exist first.

**End of day:** working auth API with hashed passwords and JWTs.

### Day 5 — Backend Features: Prediction, History, Profile, Advice

**Goal:** the full API.

1. `utils/mlService.js` (axios to Flask, timeouts, 502 on failure).
2. `config/diseaseAdvice.js` with guidance for all 7 diseases + default.
3. `models/History.js` with the compound index `{ userId: 1, createdAt: -1 }`.
4. `controllers/predictionController.js`: validation, category maps, symptom parsing, call ML, attach advice, save history.
5. `getHistory`, `userController.js` (whitelisted profile update), routes.
6. `database/mongo_setup.js` for indexes and a dev seed user.
7. Test every route, **including the bad cases**: missing token (401), wrong token (403), empty symptoms (400), Flask stopped (502).

**End of day:** the backend is complete and tested with curl/Postman.

### Day 6 — Frontend

**Goal:** a usable UI connected to the API.

1. `npm create vite@latest frontend -- --template react-ts`; add Tailwind, lucide-react, axios.
2. `lib/api.ts` with the JWT interceptor; `frontend/.env` with `VITE_API_BASE_URL`.
3. `types.ts` (types + dropdown options matching the model categories).
4. `context/AuthContext.tsx` with `loading` state and token validation on startup.
5. Pages: `Login.tsx` → `Home.tsx` (form + result) → `History.tsx` (list + modal) → `About.tsx` (profile).
6. Shared components: `Navigation`, `AdviceCards`, `ExplanationList`.
7. Make it responsive (`md:grid-cols-2`, hide nav labels on mobile).

**Why build the API first:** the UI is then just a client of a known, tested contract.

**End of day:** you can sign up, predict, see history, and edit the profile in the browser.

### Day 7 — Testing, Hardening, Documentation

**Goal:** confidence that everything works, and clear docs.

1. Run `npm run typecheck`, `npm run lint`, `npm run build` — fix every error.
2. Full manual end-to-end test with all 3 services running (use a **separate test database**).
3. Edge cases: refresh while logged in, expired token, ML service down, unknown symptoms, profile clearing, mobile width.
4. Regenerate `global_explain.json` and `fairness_report.csv`; pin `requirements.txt`.
5. Write `README.md`, `docs/api_endpoints.md`, architecture diagram, and this `learning.md`.
6. Commit with clear messages and push.

**End of day:** a working, documented, demo-ready project.

### Summary Table

| Day | Focus | Deliverable |
|---|---|---|
| 1 | Plan + data exploration | Repo, environment, known features/classes |
| 2 | Preprocessing + training | `model.pkl`, `training_report.json` |
| 3 | Explainability + fairness + Flask | ML service on :5000 |
| 4 | Express + MongoDB + auth | Register/login API |
| 5 | Prediction, history, profile, advice | Complete backend on :8000 |
| 6 | React frontend | Working UI on :5173 |
| 7 | Testing, hardening, docs | Demo-ready, documented project |

---

## 16. 20 Interview Questions with Answers

### Q1. Walk me through the architecture of your project.

**Answer:** Three services. A React + TypeScript frontend, a Node/Express backend, and a Python Flask ML service, plus MongoDB. The frontend sends the form with a JWT to Express. Express validates the input, maps it into the model's 33 features, calls Flask's `/predict`, attaches health guidance, saves the result in MongoDB, and returns it.

**Reasoning:** Interviewers want to see that you understand the flow and the *responsibilities* of each part, not just the list of technologies. Mention ports and the direction of calls.

### Q2. Why did you use a separate Python service instead of running the model in Node?

**Answer:** The ML ecosystem (scikit-learn, pandas, SHAP) is Python-only in practice. A separate service loads the model once into memory, can be scaled or redeployed independently, and keeps the web server simple. Node is good at I/O-heavy API work; Python is good at numerical work.

**Reasoning:** Shows you understand microservices, separation of concerns, and choosing the right tool for each job.

### Q3. Why Random Forest?

**Answer:** The data is small (5,000 rows) and tabular with numeric, categorical and binary features. Random Forest handles mixed features well, captures interactions between symptoms, needs little tuning, resists overfitting by averaging many trees built on bootstrap samples with random feature subsets, and works with TreeSHAP for fast, exact explanations. A linear model can't capture symptom combinations without manual feature engineering, and a single tree overfits.

**Reasoning:** Always justify a model choice with properties of *your data*. Be ready to say how you'd compare alternatives (for example Logistic Regression and Gradient Boosting on the same stratified split). If you build this yourself, actually run that comparison (Day 2 of the plan) so you can quote the numbers.

### Q4. Your model has 99.8% accuracy. Is that good?

**Answer:** It shows the pipeline works, but I wouldn't trust it for real use. The dataset is synthetic and cleanly separable. Real clinical data has overlapping symptoms, missing values and noise. The only errors are between COVID-19 and Flu, which share symptoms, which is the expected pattern. Real validation would need de-identified clinical data, calibration checks and a confusion matrix review.

**Reasoning:** Very high accuracy is a red flag interviewers use to test critical thinking. Never just say "yes, it's great".

### Q5. What is a scikit-learn Pipeline and why did you use it?

**Answer:** It chains preprocessing and the model into one object. `fit` fits the scaler and encoder on training data only, then trains the model. Saving the pipeline means serving applies the exact same transformations. It prevents data leakage and training/serving skew.

**Reasoning:** Training/serving skew is one of the most common real-world ML bugs.

### Q6. What does `OneHotEncoder(handle_unknown="ignore")` do, and what problem did it cause?

**Answer:** It encodes an unseen category as all zeros instead of raising an error. In this project the form originally sent "Vegetarian" and "Low/Moderate/High" while the model knew "Healthy/Average/Unhealthy" and "Rarely/Occasional/Regular". Those values were silently ignored, so diet and activity never affected predictions. I fixed it by aligning the form options, mapping legacy values in the backend, validating inputs, and exposing the real categories at `/schema`.

**Reasoning:** Talking about a real bug you found and fixed is one of the strongest things you can do in an interview.

### Q7. What is SHAP and how do you use it?

**Answer:** SHAP assigns each feature a contribution to a specific prediction based on Shapley values from game theory; contributions plus a base value add up to the model output. I use `TreeExplainer` on the forest. For multiclass it returns values per class, so I take the slice for the predicted class and show the top 6 by absolute value. Positive means it pushed toward that disease, negative away from it.

**Reasoning:** Explainability matters in healthcare for trust and debugging; knowing the multiclass shape detail shows hands-on experience.

### Q8. What is the difference between local and global explanations?

**Answer:** Local explains one prediction (why *this* user got Dengue). Global summarizes which features matter most across the dataset (mean absolute SHAP over many samples, or feature importances). I return local explanations per request and save a global one to `global_explain.json`.

**Reasoning:** Tests whether you understand explainability beyond one library call.

### Q9. How did you check fairness?

**Answer:** `fairness_check.py` recreates the same test split and computes accuracy, precision, recall and F1 per sex and per age band (≤30, 31–45, 46–60, 60+). All groups are within about half a percentage point. With real data I would also look at per-class recall per group and at sample sizes, since small groups give noisy metrics.

**Reasoning:** Responsible AI is a common interview topic, especially for health applications.

### Q10. How does authentication work?

**Answer:** On register the password is hashed with bcrypt (salted, cost 10). On login, `bcrypt.compare` checks it and the server signs a JWT containing the user id with a 7-day expiry. The frontend stores it and an axios interceptor sends `Authorization: Bearer <token>`. Middleware verifies the signature and expiry and sets `req.userId`. Missing token returns 401, invalid returns 403.

**Reasoning:** Explain the full lifecycle: creation, storage, transmission, verification.

### Q11. Why bcrypt instead of SHA-256 for passwords?

**Answer:** SHA-256 is designed to be fast, which helps attackers try billions of guesses. bcrypt is deliberately slow with a tunable cost factor and has a built-in random salt, so identical passwords get different hashes and rainbow tables don't work.

**Reasoning:** A classic security question; the key words are *slow*, *salt*, and *cost factor*.

### Q12. What are the risks of storing the JWT in localStorage?

**Answer:** Any JavaScript on the page can read localStorage, so an XSS bug could steal the token. A safer option is an `httpOnly`, `Secure`, `SameSite` cookie that JavaScript can't read, plus CSRF protection. I'd also use short-lived access tokens with refresh tokens.

**Reasoning:** Shows you know the trade-offs of your own design, which interviewers value more than a perfect design.

### Q13. How do you make sure a user can only see their own history?

**Answer:** The user id comes from the verified JWT (`req.userId`), never from the request body or URL, and the query is `History.find({ userId: req.userId })`. Profile updates also whitelist fields to prevent mass assignment.

**Reasoning:** This is about authorization (what you can access), which is different from authentication (who you are). Broken access control is the #1 OWASP risk.

### Q14. Why MongoDB instead of a SQL database?

**Answer:** Each prediction is a nested document (form, features, explanation list, advice with arrays and a sub-object). MongoDB stores it as one document and reads it back in one query. It fits the JavaScript stack, and Mongoose adds the schema validation I need. If I needed complex joins or strict transactions across many tables, I'd choose PostgreSQL.

**Reasoning:** Justify with your data shape, and show you know when the other option would be better.

### Q15. What indexes did you create and why?

**Answer:** A unique index on `users.email` for fast login and to prevent duplicates, and a compound index `{ userId: 1, createdAt: -1 }` on histories, which matches the history query (filter by user, sort newest first), so MongoDB can return results without an in-memory sort.

**Reasoning:** Indexes should be designed from the actual queries.

### Q16. Why do you store both `form` and `features` in each history record?

**Answer:** `form` is what the user typed, for display. `features` is exactly what the model received, for auditing and debugging. If the mapping logic changes later, old records still show the true input. I also copy the advice so history shows what the user actually saw.

**Reasoning:** Shows thinking about auditability and data versioning, both important in healthcare.

### Q17. Describe a tricky bug you fixed.

**Answer:** Environment variables from `.env` were ignored for the ML URL. The cause: in ES Modules, `import` statements are hoisted and run before the file body, so `mlService.js` read `process.env.ML_API_URL` before `dotenv.config()` ran. I fixed it with `import "dotenv/config"` as the first import and by reading the variable lazily. I also added startup checks for required variables.

**Reasoning:** Use the STAR format: Situation, Task, Action, Result. Root-cause explanations impress more than "I fixed it".

### Q18. How does the frontend manage state, and why not Redux?

**Answer:** Local component state with `useState` for forms and results, and React Context for the only global state: the user, token and loading flag. Redux adds boilerplate that pays off with large, shared, frequently changing state; here there is one small piece of global state.

**Reasoning:** Choosing the simplest tool that fits is a sign of engineering maturity.

### Q19. What happens if the ML service is down?

**Answer:** The axios call has a timeout. On failure `mlService.js` throws an error with status 502 (Bad Gateway) and a clear message, the controller returns it, and the frontend shows "ML service is unavailable". Nothing is saved to history. The backend itself keeps running for login, history and profile.

**Reasoning:** Interviewers want to see that you design for failure, using correct HTTP status codes.

### Q20. How would you take this to production?

**Answer:**
- Run Flask behind gunicorn/waitress and serve the Vite build as static files behind nginx.
- Containerize with Docker Compose; use MongoDB Atlas.
- Move secrets to a secret manager; restrict CORS to the frontend domain.
- Add rate limiting on login, httpOnly cookies, HTTPS everywhere.
- Add tests (pytest, Jest/Supertest, React Testing Library) and CI that runs typecheck, lint, tests and build.
- Add logging and monitoring.
- Most importantly, retrain and validate on real de-identified data, add an "uncertain" threshold, get medical review of the guidance, and consider regulatory requirements for health software.

**Reasoning:** Shows you can see beyond a demo: deployment, security, reliability, and the ethical/regulatory side of ML in healthcare.

---

## 17. Glossary (A to Z)

| Term | Meaning |
|---|---|
| **API** | Application Programming Interface; here, HTTP endpoints that return JSON. |
| **Axios** | JavaScript HTTP client used by both frontend and backend. |
| **bcrypt** | Slow, salted password hashing algorithm. |
| **Class weight (balanced)** | Gives rarer classes more weight during training. |
| **ColumnTransformer** | Applies different preprocessing to different columns. |
| **Confidence** | The model's predicted probability for the chosen class (0–1). |
| **CORS** | Browser rule controlling which origins may call an API. |
| **Data leakage** | Test information influencing training, giving over-optimistic scores. |
| **Environment variable** | Configuration outside the code (`.env`), used for secrets and URLs. |
| **Express** | Minimal Node.js web framework. |
| **F1 score** | Harmonic mean of precision and recall. |
| **Fairness check** | Comparing model performance across groups (sex, age). |
| **Flask** | Minimal Python web framework. |
| **Git LFS** | Git extension for storing large files like `model.pkl`. |
| **Hoisting (ESM)** | `import` statements run before the rest of the module body. |
| **Index (database)** | Data structure that makes lookups and sorts fast. |
| **Interceptor** | Axios hook that modifies every request (adds the JWT). |
| **joblib** | Python library for saving/loading large NumPy-based objects. |
| **JWT** | JSON Web Token; signed token proving identity without server sessions. |
| **Local explanation** | Why the model made *one* specific prediction. |
| **Middleware** | Function that runs before a route handler (e.g. auth check). |
| **Mongoose** | ODM (object document mapper) for MongoDB with schemas and validation. |
| **Normalization (text)** | Lowercasing and cleaning text so variants match. |
| **One-hot encoding** | Turning a category into 0/1 columns, one per value. |
| **Pipeline** | scikit-learn object chaining preprocessing and model. |
| **Precision / Recall** | Of predicted X, how many were X / of real X, how many were found. |
| **Random Forest** | Ensemble of decision trees trained on random samples and features; majority vote. |
| **React Context** | Built-in way to share state across components without prop drilling. |
| **SHAP** | SHapley Additive exPlanations; per-feature contribution to a prediction. |
| **Stratified split** | Train/test split that keeps class proportions equal. |
| **Tailwind CSS** | Utility-first CSS framework. |
| **Training/serving skew** | Different preprocessing at training vs prediction time. |
| **TypeScript** | JavaScript with static types. |
| **Vite** | Fast frontend dev server and bundler. |
| **Whitelisting** | Accepting only explicitly allowed fields or values. |
| **Zero-symptom guard** | Rejecting predictions where no symptom was recognised. |
