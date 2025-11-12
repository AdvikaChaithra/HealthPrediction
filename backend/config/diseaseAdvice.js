// backend/config/diseaseAdvice.js

const diseaseAdvice = {
  "Flu": {
    short: "Likely viral flu — rest, fluids, and monitor symptoms closely.",

    avoid: [
      "Avoid crowded places to prevent spreading infection",
      "Avoid heavy physical exertion until recovery",
      "Avoid alcohol and smoking as they slow recovery",
      "Avoid cold or refrigerated food/drinks during fever",
    ],

    do: [
      "Stay hydrated — drink warm water, soups, and herbal tea",
      "Take paracetamol/acetaminophen for fever or pain (as advised)",
      "Get plenty of rest and sleep",
      "Eat light, nutritious meals (soups, fruits, and cooked vegetables)",
      "Use a humidifier or inhale steam to relieve congestion",
      "Cover mouth and nose when sneezing or coughing",
      "Wash hands frequently with soap or sanitizer",
    ],

    prevention: [
      "Get a yearly flu vaccination if available",
      "Maintain good personal hygiene",
      "Avoid close contact with sick individuals",
      "Keep your immune system strong with a healthy diet and enough sleep",
    ],

    nutrition: {
      recommended: [
        "Citrus fruits (Vitamin C)",
        "Garlic",
        "Ginger",
        "Honey",
        "Warm soups",
        "Turmeric milk",
      ],
      avoid: ["Cold drinks", "Fried and processed foods", "Sugar-rich foods"],
    },

    urgent: false,

    notes:
      "Seek urgent medical care if you experience difficulty breathing, chest pain, persistent vomiting, confusion, dehydration, or a high fever (>39°C) lasting more than 3 days. Elderly, pregnant women, or those with chronic conditions should consult a doctor early.",
  },

  "Heart Disease": {
    short:
      "Possible cardiac risk — seek medical advice and maintain heart-healthy habits.",

    avoid: [
      "Avoid strenuous exercise until cleared by a doctor",
      "Avoid high-salt and high-fat foods (processed meats, fried foods, junk food)",
      "Avoid smoking and alcohol",
      "Avoid stress, anxiety, and lack of sleep",
      "Avoid skipping prescribed medications",
    ],

    do: [
      "Consult a cardiologist for evaluation and tests (ECG, Echo, etc.)",
      "Take prescribed medications regularly and on time",
      "Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean protein",
      "Engage in light physical activity (like walking) if approved by your doctor",
      "Monitor blood pressure, cholesterol, and blood sugar regularly",
      "Get adequate rest and hydration",
      "Practice yoga or meditation for stress relief",
    ],

    prevention: [
      "Maintain a healthy weight and BMI",
      "Control diabetes, cholesterol, and hypertension",
      "Exercise regularly (after doctor approval)",
      "Limit salt and sugar intake",
      "Quit smoking",
      "Have regular heart check-ups, especially with family history",
    ],

    nutrition: {
      recommended: [
        "Oats and whole grains",
        "Leafy greens (spinach, kale)",
        "Berries and citrus fruits",
        "Fish rich in omega-3 (salmon, tuna)",
        "Nuts (almonds, walnuts)",
        "Olive oil instead of butter",
      ],
      avoid: [
        "Fried foods and processed snacks",
        "Red meats and full-fat dairy",
        "Salted chips and pickles",
        "Sugary drinks and sweets",
      ],
    },

    urgent: true,

    notes:
      "Seek **emergency care** if you experience severe chest pain, pain radiating to the arm/jaw, sweating, fainting, or shortness of breath.",
  },

  "Kidney Disease": {
    short:
      "Possible kidney function issue — maintain hydration and avoid kidney stress.",

    avoid: [
      "High-salt and high-protein diets (red meat, processed food)",
      "Painkillers like ibuprofen or diclofenac without advice",
      "Dehydration or skipping fluids",
      "Unregulated supplements or herbal medicines",
      "Smoking and alcohol",
    ],

    do: [
      "Drink adequate water (as advised by your doctor)",
      "Limit salt and potassium if prescribed",
      "Monitor blood pressure and blood sugar regularly",
      "Eat a kidney-friendly diet (low sodium, moderate protein)",
      "Consult a nephrologist for diagnosis and tests",
      "Track urine output and swelling signs daily",
    ],

    prevention: [
      "Control diabetes and blood pressure",
      "Avoid overuse of painkillers",
      "Regular kidney checkups (creatinine, GFR)",
      "Maintain healthy weight and regular exercise",
    ],

    nutrition: {
      recommended: [
        "Apples, cabbage, cauliflower",
        "Egg whites and lean meats (in moderation)",
        "Rice, pasta, and unsalted snacks",
      ],
      avoid: [
        "Bananas, oranges, tomatoes (high potassium)",
        "Processed meats, pickles, and chips",
        "Colas and caffeine-heavy drinks",
      ],
    },

    urgent: true,

    notes:
      "Seek medical care if you notice swelling, reduced urination, or frothy urine. Early diagnosis can prevent kidney failure.",
  },

  "Anemia": {
    short:
      "Low hemoglobin or red blood cell count — may cause fatigue and weakness.",

    avoid: [
      "Skipping meals",
      "Tea or coffee right after meals",
      "Crash dieting without supervision",
    ],

    do: [
      "Eat iron-rich foods (spinach, beetroot, lentils, red meat, jaggery)",
      "Include vitamin C sources (orange, amla, lemon)",
      "Take iron supplements if prescribed",
      "Regular hemoglobin checkups",
    ],

    prevention: [
      "Eat balanced meals",
      "Ensure adequate iron and folate intake",
      "Avoid long gaps between meals",
      "Regular health screening",
    ],

    nutrition: {
      recommended: [
        "Leafy greens, pomegranate, beetroot, dates",
        "Lean meats and lentils",
        "Vitamin C-rich foods (orange, lemon, amla)",
      ],
      avoid: [
        "Coffee/tea right after meals",
        "Excess dairy (can reduce iron absorption)",
      ],
    },

    urgent: false,

    notes:
      "If you experience severe fatigue, dizziness, or shortness of breath, consult a doctor for blood tests.",
  },

  "Dengue": {
    short: "Possible dengue infection — monitor fever and hydration closely.",

    avoid: [
      "Painkillers like ibuprofen or aspirin (increase bleeding risk)",
      "Dehydration",
      "Ignoring persistent vomiting or abdominal pain",
    ],

    do: [
      "Drink plenty of fluids (ORS, water, juices)",
      "Take paracetamol for fever (avoid NSAIDs)",
      "Rest as much as possible",
      "Monitor platelet count and temperature daily",
    ],

    prevention: [
      "Avoid mosquito bites (use repellents, nets)",
      "Remove stagnant water near your home",
      "Wear long-sleeved clothing",
      "Stay indoors during mosquito-active hours",
    ],

    nutrition: {
      recommended: [
        "Papaya leaves extract (if advised)",
        "Coconut water",
        "Pomegranate, kiwi, oranges",
        "Soups and juices",
      ],
      avoid: ["Caffeine", "Oily or spicy food", "Junk food"],
    },

    urgent: true,

    notes:
      "If you notice bleeding, abdominal pain, or restlessness, visit a hospital immediately. Severe dengue can be life-threatening.",
  },
};

// ✅ Default fallback
diseaseAdvice["default"] = {
  short: "No specific guidance available for this condition.",
  avoid: [],
  do: ["Consult a healthcare provider for personalized advice."],
  urgent: false,
  notes: "",
};

// ✅ Lowercase aliases
for (const key of Object.keys(diseaseAdvice)) {
  diseaseAdvice[key.toLowerCase()] = diseaseAdvice[key];
}

export default diseaseAdvice;
