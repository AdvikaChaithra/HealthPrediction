// backend/config/diseaseAdvice.js
const diseaseAdvice = {
  "Flu": {
    short: "Likely viral flu — rest, fluids, monitor symptoms.",
    avoid: ["Avoid crowded places", "Avoid heavy exercise", "Avoid alcohol"],
    do: ["Stay hydrated", "Take paracetamol for fever/pain", "Get plenty of rest"],
    urgent: false,
    notes: "If you have difficulty breathing, chest pain, persistent vomiting, or high fever > 39°C, seek urgent medical care."
  },

  "Heart Disease": {
    short: "Possible cardiac risk — see a doctor soon.",
    avoid: ["Strenuous physical activity until checked", "High-salt foods", "Smoking"],
    do: ["Seek immediate medical evaluation", "Avoid heavy lifting", "Follow prescribed medicines"],
    urgent: true,
    notes: "Chest pain, fainting, heavy sweating, or breathlessness require emergency care."
  },

  "Diabetes": {
    short: "Signs of metabolic issues — check blood glucose and lifestyle.",
    avoid: ["Sugary drinks", "Refined carbs", "Skipping medications"],
    do: ["Check blood sugar", "Balanced meals with fibre", "See GP for labs"],
    urgent: false,
    notes: "If very high thirst, frequent urination, confusion — seek medical attention."
  },

  "COVID-19": {
    short: "Possible COVID-like symptoms — isolate and test.",
    avoid: ["Contact with others until tested", "Ignoring breathlessness"],
    do: ["Get tested if available", "Isolate, rest, hydrate"],
    urgent: true,
    notes: "If oxygen level drops or breathing becomes difficult, go to ER."
  },

  // add more diseases as needed...
};

export default diseaseAdvice;
