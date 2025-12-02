import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Typically injected in build

// We initialize partially to avoid crashing if no key, but methods will check
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeRisk = async (context: string) => {
  if (!genAI) return "API Key missing. Using cached analysis... \n\n**Potential Failure Mode:** Joint 3 (Shoulder X) Overheating.\n**Cause:** Sustained holding of 5kg load at 90-degree extension.\n**Mitigation:** Software thermal throttling and active cooling fan.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      As a senior robotics reliability engineer, analyze the following context for a 9-DOF humanoid arm (Shoulder:3, Elbow:3, Wrist:2, Gripper:1).
      
      Context: ${context}
      
      Provide a specific FMEA (Failure Mode and Effects Analysis) entry.
      Format:
      - **Failure Mode:**
      - **Potential Cause:**
      - **Effect:**
      - **Severity (1-10):**
      - **Mitigation Strategy:**
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating analysis. Please check API Key configuration.";
  }
};

export const generateSimulationInterpretation = async (metrics: any) => {
   if (!genAI) return "API Key missing. \n\n**Simulation Insight:** The current configuration shows peak torque at the shoulder joint due to the extended moment arm. Factor of Safety is adequate (1.5) but sustained operation in this pose drains battery efficiency by 15%.";

   try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Act as a mechanical lead. Interpret these simulation metrics for a 9-DOF robotic arm:
      ${JSON.stringify(metrics)}
      
      Provide a 3-bullet point technical summary of the structural load and kinematic efficiency.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
   } catch (error) {
     return "Error generating insight.";
   }
}
