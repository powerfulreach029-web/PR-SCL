import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

export const sendMessageToGemini = async (
  message: string,
  context: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  if (!apiKey) {
    return "Erreur : Clé API manquante. Veuillez configurer l'environnement.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We create a new chat session for simplicity in this context, 
    // or we could maintain one. Here we pass simple history.
    // For the specific prompt "gemini-3-pro-preview"
    const model = "gemini-3-pro-preview"; 

    const chat = ai.chats.create({
      model: model,
      history: history,
      config: {
        systemInstruction: `Tu es un assistant intelligent pour l'application PR-SCL (Système de Gestion Scolaire). 
        
        RÈGLES IMPORTANTES :
        1. Tes réponses doivent être COURTES et PRÉCISES. Évite les longs paragraphes.
        2. Utilise le formatage Markdown pour rendre le texte lisible :
           - Utilise le **gras** pour les éléments importants.
           - Utilise des listes à puces pour énumérer des éléments.
        3. Ton rôle est d'aider à la gestion de l'école (élèves, notes, cycles).
        4. Si on te demande de modifier des données, explique la procédure dans l'interface (tu ne peux pas agir directement sur la BDD).
        
        Voici le contexte actuel de l'école :
        ${context}`,
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur s'est produite lors de la communication avec l'IA.";
  }
};