import { NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy initialization - only create client when API is called
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface ExpandCompaniesRequest {
  companies: string[];
  roles: string[];
  seniority: string;
  cities: string[];
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    const openai = getOpenAIClient();

    const body: ExpandCompaniesRequest = await req.json();
    const { companies, roles, seniority, cities } = body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return new NextResponse("Companies array is required", { status: 400 });
    }

    const prompt = `Given these target companies: ${companies.join(", ")}
And these job criteria:
- Roles: ${roles?.join(", ") || "Any"}
- Seniority: ${seniority || "Any"}
- Cities: ${cities?.join(", ") || "Any"}

Generate a list of 15-20 similar companies that would likely have similar roles. Focus on:
1. Companies in the same industry/sector.
2. Similar company size and stage (startup, scale-up, enterprise).
3. Companies known to hire for these roles.
4. Companies with a presence in the target cities.

Return ONLY a JSON array of company names, with no explanations or surrounding text. For example: ["Company1", "Company2", "Company3"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a recruitment expert who knows companies across different industries. You always return valid JSON arrays of company names."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    let suggestedCompanies: string[];
    try {
      suggestedCompanies = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", responseText);
      throw new Error("Invalid JSON response from OpenAI. The AI may have returned text instead of a JSON array.");
    }

    if (!Array.isArray(suggestedCompanies)) {
      throw new Error("OpenAI response was not a valid array.");
    }

    const allCompanies = [...companies, ...suggestedCompanies];
    const uniqueCompanies = Array.from(new Set(
      allCompanies.map(company => company.trim())
    ));

    return NextResponse.json({
      originalCompanies: companies,
      suggestedCompanies,
      allCompanies: uniqueCompanies,
      totalCount: uniqueCompanies.length
    });

  } catch (error: any) {
    console.error("Error expanding companies:", error);
    return new NextResponse(
      error.message || "Failed to expand companies", 
      { status: 500 }
    );
  }
}
