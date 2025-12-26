import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export interface CVData {
  fullName: string;
  jobTitle: string;
  contactInfo: {
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
    website?: string;
  };
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  projects?: {
    name: string;
    description: string;
    link?: string;
  }[];
  certifications?: {
    name: string;
    issuer?: string;
    year?: string;
  }[];
  volunteering?: {
    role: string;
    organization: string;
    duration?: string;
    description?: string;
  }[];
}

export async function optimizeCV(text: string): Promise<CVData> {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please configure it.");
  }

  // Try primary model, fallback to others if not found
  // Using Gemini 2.5 Flash as requested
  const modelsToTry = ["gemini-2.5-flash"];

  let lastError = null;

  const prompt = `
    You are an expert ATS (Applicant Tracking System) optimizer and professional CV writer.
    Your task is to take the following raw text from a CV, analyze it, and rewrite it to be highly professional, ATS-friendly, and impact-oriented.
    
    CRITICAL INSTRUCTIONS:
    1. Parse the contact information carefully from the provided text.
       - For "location": If the address is long, simplify it to strictly "City, Country" (e.g., "Yangon, Myanmar"). Do not include street numbers or zip codes.
    2. Rewrite the "Summary" to be SHORT and CONCISE - maximum 2-3 sentences. Make it punchy and keyword-rich. Base it ONLY on the information provided.
    3. Extract the TOP 6 MOST RELEVANT skills from the CV. ONLY include skills mentioned in the CV. Maximum 6 skills.
    4. For "Experience":
       - Use strong action verbs to rewrite existing bullet points.
       - Quantify achievements where possible (e.g., "Increased revenue by 20%") BUT ONLY if numbers are already present in the original text.
       - Ensure the format is consistent.
       - DO NOT invent or add any job roles, companies, or responsibilities that are not in the original CV.
    5. For "Projects":
       - ONLY include projects that are explicitly mentioned in the CV.
       - DO NOT create or invent any projects.
       - If no projects are mentioned, return an empty array.
    6. For "Education":
       - Extract exactly what is stated in the CV.
       - DO NOT add degrees or institutions that are not mentioned.
    7. For "Certifications":
       - Extract any certifications, licenses, or professional credentials mentioned in the CV.
       - If no certifications are mentioned, return an empty array.
       - DO NOT invent certificates.
    8. For "Volunteering":
       - Extract any volunteer work, community service, or unpaid roles mentioned in the CV.
       - If no volunteering is mentioned, return an empty array.
       - DO NOT invent volunteering experiences.
    9. DO NOT fabricate, hallucinate, or add any information that is not present in the original CV text.
    10. DATE HANDLING: If a date or duration (for experience, education, certifications) is not found in the text, return an empty string "". DO NOT return "N/A", "Present", or guess the date unless explicitly stated.
    11. Return ONLY a valid JSON object matching the following structure (do not include markdown code blocks like \`\`\`json):
    
    {
      "fullName": "Name",
      "jobTitle": "Target Job Title or Current Role",
      "contactInfo": { "email": "...", "phone": "...", "linkedin": "...", "location": "..." },
      "summary": "Professional summary based on CV content...",
      "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6"],
      "experience": [
        { "role": "Job Title", "company": "Company Name", "duration": "Dates", "description": ["Bullet point 1", "Bullet point 2"] }
      ],
      "education": [
        { "degree": "Degree", "institution": "University", "year": "Year" }
      ],
      "certifications": [
        { "name": "Certificate Name", "issuer": "Issuing Organization", "year": "Year" }
      ],
      "volunteering": [
        { "role": "Volunteer Role", "organization": "Organization Name", "duration": "Dates", "description": "Brief description" }
      ],
      "projects": [
        { "name": "Project Name", "description": "Description", "link": "URL if present" }
      ]
    }

    Here is the raw CV text:
    ${text}
  `;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textOutput = response.text();

      console.log("Gemini Raw Output:", textOutput);

      // Robust JSON extraction
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const cleanedOutput = jsonMatch[0];
      return JSON.parse(cleanedOutput) as CVData;

    } catch (error: any) {
      console.warn(`Model ${modelName} failed:`, error.message);
      lastError = error;
      // Continue to next model
    }
  }

  // If we get here, all models failed
  console.error("All Gemini optimization attempts failed.");
  throw new Error(`AI processing failed after retries: ${lastError?.message || "Unknown error"}`);
}

export async function parsePDFWithGemini(buffer: Buffer): Promise<string> {
  try {
    console.log("Attempting Gemini PDF Parsing fallback...");
    // Using Gemini 2.5 Flash as requested for parsing
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = "Please extract all text content from this PDF document effectively preserving the structure as much as possible.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "application/pdf",
        },
      },
    ]);

    return result.response.text();
  } catch (e: any) {
    console.error("Gemini PDF Parsing failed:", e);
    throw new Error("Failed to parse PDF with Gemini: " + e.message);
  }
}
