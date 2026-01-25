
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Project, Invoice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  /**
   * Generates a project-specific financial health analysis
   */
  async analyzeProject(project: Project, invoices: Invoice[]): Promise<string> {
    const prompt = `
      Jsi seniorní finanční auditor stavební firmy JK Stavby. 
      Analyzuj projekt: ${project.name} (Kód: ${project.code}).
      Aktuální data:
      - Plánovaný rozpočet: ${project.planned_budget} Kč
      - Skutečné náklady: ${project.total_costs} Kč
      - Procentuální čerpání: ${project.budget_usage_percent}%
      - Počet faktur: ${project.invoice_count}
      - Stav: ${project.status}

      Poslední faktury:
      ${invoices.slice(0, 5).map(i => `- ${i.supplier_name}: ${i.total_amount} Kč (${i.payment_status})`).join('\n')}

      Úkol: 
      1. Vyhodnoť finanční zdraví (riziko přečerpání).
      2. Navrhni 3 konkrétní kroky pro optimalizaci nebo kontrolu.
      3. Odhadni vývoj, pokud bude čerpání pokračovat stejným tempem.
      Odpovídej profesionálně, stručně a v češtině. Používej Markdown.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.7,
          topP: 0.95,
        }
      });
      return response.text || "Nepodařilo se vygenerovat analýzu.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw new Error("AI analýza momentálně není dostupná.");
    }
  },

  /**
   * General chat assistant for portfolio-wide queries
   */
  async chatWithAssistant(message: string, allProjects: Project[]): Promise<string> {
    const context = allProjects.map(p => `- ${p.name}: ${p.budget_usage_percent}% čerpání, rozpočet ${p.planned_budget} Kč`).join('\n');
    
    const prompt = `
      Jsi JK AI - inteligentní asistent firmy JK Stavby. 
      Máš přístup k tomuto přehledu projektů:
      ${context}

      Uživatel se ptá: "${message}"
      
      Odpovídej jako expert na stavební management. Buď věcný, přátelský a profesionální. 
      Pokud se uživatel ptá na věci mimo stavebnictví nebo JK Stavby, zdvořile ho vrať k tématu projektů.
      Odpovídej v češtině.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text || "Omlouvám se, ale nerozumím dotazu.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Omlouvám se, spojení s AI asistentem bylo přerušeno.";
    }
  }
};
