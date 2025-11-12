// backend/config/diseaseAdvice.js
const diseaseAdvice = {
  Flu: {
    short: "Likely viral flu — rest, fluids, monitor symptoms.",
    avoid: ["Avoid crowded places", "Avoid heavy exercise", "Avoid alcohol"],
    do: [
      "Stay hydrated",
      "Take paracetamol for fever/pain",
      "Get plenty of rest",
    ],
    urgent: false,
    notes:
      "If you have difficulty breathing, chest pain, persistent vomiting, or high fever > 39°C, seek urgent medical care.",
  },

  "Heart Disease": {
    short: "Possible cardiac risk — see a doctor soon.",
    avoid: [
      "Strenuous physical activity until checked",
      "High-salt foods",
      "Smoking",
    ],
    do: [
      "Seek immediate medical evaluation",
      "Avoid heavy lifting",
      "Follow prescribed medicines",
    ],
    urgent: true,
    notes:
      "Chest pain, fainting, heavy sweating, or breathlessness require emergency care.",
  },

  Diabetes: {
    short: "Signs of metabolic issues — check blood glucose and lifestyle.",
    avoid: ["Sugary drinks", "Refined carbs", "Skipping medications"],
    do: ["Check blood sugar", "Balanced meals with fibre", "See GP for labs"],
    urgent: false,
    notes:
      "If very high thirst, frequent urination, confusion — seek medical attention.",
  },

  "COVID-19": {
    short: "Possible COVID-like symptoms — isolate and test.",
    avoid: ["Contact with others until tested", "Ignoring breathlessness"],
    do: ["Get tested if available", "Isolate, rest, hydrate"],
    urgent: true,
    notes: "If oxygen level drops or breathing becomes difficult, go to ER.",
  },

  Anemia: {
    short:
      "Low red blood cell or hemoglobin levels — may cause tiredness and pale skin.",
    avoid: [
      "Skipping meals",
      "Drinking tea or coffee right after meals",
      "Crash dieting without medical guidance",
    ],
    do: [
      "Eat iron-rich foods (spinach, beetroot, red meat, lentils, jaggery)",
      "Include vitamin C sources (orange, amla, lemon) to boost iron absorption",
      "Take iron or folic acid supplements if prescribed",
      "Get regular hemoglobin checkups",
    ],
    urgent: false,
    notes:
      "If you experience severe fatigue, dizziness, or shortness of breath, consult a doctor for blood tests to find the underlying cause.",
  },

  Dengue: {
    short: "Possible dengue infection — monitor fever and hydration closely.",
    avoid: [
      "Painkillers like ibuprofen or aspirin (can increase bleeding risk)",
      "Dehydration",
      "Ignoring persistent vomiting or abdominal pain",
    ],
    do: [
      "Drink plenty of fluids (ORS, water, fresh juices)",
      "Take paracetamol for fever (avoid NSAIDs)",
      "Rest as much as possible",
      "Monitor platelet count as advised by your doctor",
    ],
    urgent: true,
    notes:
      "If you have bleeding gums, abdominal pain, vomiting, or restlessness, go to a hospital immediately. Dengue can become severe and life-threatening if untreated.",
  },

  "Kidney Disease": {
    short:
      "Possible kidney function issue — manage fluids, salt, and diet carefully.",
    avoid: [
      "High-salt and processed foods",
      "Overuse of painkillers (NSAIDs)",
      "Excess protein supplements without guidance",
      "Dehydration",
    ],
    do: [
      "Drink adequate water (as advised by your doctor)",
      "Eat fresh fruits and vegetables (avoid high-potassium ones if prescribed)",
      "Monitor blood pressure regularly",
      "Follow a renal-friendly diet if diagnosed",
    ],
    urgent: true,
    notes:
      "If you notice swelling in feet, reduced urination, or frothy urine, consult a nephrologist immediately — early management helps prevent kidney failure.",
  },
};

// ✅ Add fallback (default advice)
diseaseAdvice["default"] = {
  short: "No specific guidance available for this condition.",
  avoid: [],
  do: ["Consult a healthcare provider for personalized advice."],
  urgent: false,
  notes: "",
};

// ✅ Add lowercase aliases for model compatibility
diseaseAdvice["flu"] = diseaseAdvice["Flu"];
diseaseAdvice["heart disease"] = diseaseAdvice["Heart Disease"];
diseaseAdvice["diabetes"] = diseaseAdvice["Diabetes"];
diseaseAdvice["covid-19"] = diseaseAdvice["COVID-19"];
diseaseAdvice["anemia"] = diseaseAdvice["Anemia"];
diseaseAdvice["dengue"] = diseaseAdvice["Dengue"];
diseaseAdvice["kidney disease"] = diseaseAdvice["Kidney Disease"];

export default diseaseAdvice;
