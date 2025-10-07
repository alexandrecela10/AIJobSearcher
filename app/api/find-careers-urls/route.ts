import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FindCareersUrlsRequest {
  companies: string[];
}

export async function POST(req: Request) {
  try {
    // 1. Check for OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    // 2. Parse the incoming request
    const body: FindCareersUrlsRequest = await req.json();
    const { companies } = body;

    // 3. Validate companies array
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return new NextResponse("Companies array is required", { status: 400 });
    }

    // 4. Use AI to generate likely careers page URLs for each company
    const careersUrls: Array<{ company: string; careersUrl: string; confidence: string }> = [];

    for (const company of companies) {
      const prompt = `For the company "${company}", what is the most likely URL for their careers/jobs page?

Return ONLY a JSON object in this exact format, with no additional text:
{
  "careersUrl": "https://example.com/careers",
  "confidence": "high|medium|low"
}

Common patterns:
- https://company.com/careers
- https://company.com/jobs
- https://careers.company.com
- https://jobs.company.com
- https://company.com/about/careers

If you're not sure of the exact URL, provide your best guess based on common patterns.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at finding company careers pages. You always return valid JSON objects with careersUrl and confidence fields."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3, // Lower temperature for more consistent outputs
          max_tokens: 150,
        });

        const responseText = completion.choices[0]?.message?.content?.trim();
        if (!responseText) {
          throw new Error("No response from OpenAI");
        }

        // Parse the AI response
        const parsed = JSON.parse(responseText);
        
        careersUrls.push({
          company,
          careersUrl: parsed.careersUrl,
          confidence: parsed.confidence
        });

      } catch (error: any) {
        console.error(`Error finding careers URL for ${company}:`, error);
        // Add a fallback URL if AI fails
        careersUrls.push({
          company,
          careersUrl: `https://${company.toLowerCase().replace(/\s+/g, '')}.com/careers`,
          confidence: "low"
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 5. Return the results
    return NextResponse.json({
      careersUrls,
      totalCompanies: companies.length,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error finding careers URLs:", error);
    return new NextResponse(
      error.message || "Failed to find careers URLs", 
      { status: 500 }
    );
  }
}
