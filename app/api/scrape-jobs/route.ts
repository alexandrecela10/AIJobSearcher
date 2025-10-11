import { NextResponse } from "next/server";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ScrapeJobsRequest {
  careersUrls: Array<{
    company: string;
    careersUrl: string;
    confidence: string;
  }>;
  criteria: {
    roles: string[];
    seniority: string;
    cities: string[];
    visa: boolean;
  };
  templateCvPath: string;
}

interface JobListing {
  title: string;
  location: string;
  description: string;
  url: string;
}

interface CompanyJobResult {
  company: string;
  careersUrl: string;
  status: "success" | "no_matches" | "error";
  message?: string;
  jobs: Array<{
    job: JobListing;
    customizedCv: string;
    cvChanges: string[];
  }>;
}

export async function POST(req: Request) {
  try {
    // 1. Check for OpenAI API Key
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    // 2. Parse the incoming request
    const body: ScrapeJobsRequest = await req.json();
    const { careersUrls, criteria, templateCvPath } = body;

    // 3. Validate input
    if (!careersUrls || !Array.isArray(careersUrls) || careersUrls.length === 0) {
      return new NextResponse("Careers URLs array is required", { status: 400 });
    }

    // 4. Read the template CV
    let templateCvContent = "";
    try {
      const cvPath = path.join(process.cwd(), templateCvPath);
      const cvBuffer = await readFile(cvPath);
      templateCvContent = cvBuffer.toString();
    } catch (error) {
      console.error("Error reading CV:", error);
      templateCvContent = "Sample CV content - skills, experience, education";
    }

    // 5. Process each company
    const results: CompanyJobResult[] = [];

    for (const { company, careersUrl, confidence } of careersUrls) {
      try {
        // Use AI to simulate job discovery and matching
        // In a real implementation, you would use a web scraping library here
        const jobsPrompt = `You are a job scraper. For the company "${company}" with careers page at ${careersUrl}, 
find the top 3 job listings that match these criteria:
- Roles: ${criteria.roles.join(", ")}
- Seniority: ${criteria.seniority}
- Cities: ${criteria.cities.join(", ")}
- Visa sponsorship: ${criteria.visa ? "Required" : "Not required"}

Return ONLY a JSON object in this format:
{
  "hasMatches": true/false,
  "jobs": [
    {
      "title": "Job Title",
      "location": "City, Country",
      "description": "Brief job description (2-3 sentences)",
      "url": "https://company.com/job/123"
    }
  ]
}

If no matching jobs are found, return {"hasMatches": false, "jobs": []}`;

        const jobsCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a job scraping expert. You always return valid JSON with job listings."
            },
            {
              role: "user",
              content: jobsPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        });

        const jobsResponse = jobsCompletion.choices[0]?.message?.content?.trim();
        if (!jobsResponse) {
          throw new Error("No response from AI");
        }

        let jobsData;
        try {
          // Try to find JSON in the response by looking for { and }
          const jsonMatch = jobsResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jobsData = JSON.parse(jsonMatch[0]);
          } else {
            // If no JSON found, try parsing the whole response
            jobsData = JSON.parse(jobsResponse);
          }
        } catch (parseError: any) {
          console.error("Failed to parse jobs response:", jobsResponse);
          console.error("Parse error:", parseError.message);
          throw new Error(`Invalid JSON from AI: ${parseError.message}`);
        }

        // Check if there are matching jobs
        if (!jobsData.hasMatches || jobsData.jobs.length === 0) {
          results.push({
            company,
            careersUrl,
            status: "no_matches",
            message: `No matching jobs found for ${criteria.roles.join(", ")} roles at ${criteria.seniority} level`,
            jobs: []
          });
          continue;
        }

        // 6. For each job, customize the CV
        const customizedJobs = [];
        
        for (const job of jobsData.jobs.slice(0, 3)) {
          const cvPrompt = `You are a CV customization expert. Given this job:
Title: ${job.title}
Location: ${job.location}
Description: ${job.description}

And this template CV:
${templateCvContent.substring(0, 1000)}

Customize the CV to appeal to this specific role. Return a JSON object with:
{
  "customizedCv": "The full customized CV text",
  "changes": ["Change 1", "Change 2", "Change 3"]
}

Focus on:
1. Highlighting relevant skills and experience
2. Tailoring the summary/objective to the role
3. Emphasizing achievements that match the job requirements`;

          const cvCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a professional CV writer. You always return valid JSON with customized CVs."
              },
              {
                role: "user",
                content: cvPrompt
              }
            ],
            temperature: 0.6,
            max_tokens: 1500,
          });

          const cvResponse = cvCompletion.choices[0]?.message?.content?.trim();
          if (!cvResponse) {
            throw new Error("No CV customization response");
          }

          // 🔧 FIX: Extract JSON from CV response
          let cvData;
          try {
            const jsonMatch = cvResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              cvData = JSON.parse(jsonMatch[0]);
            } else {
              cvData = JSON.parse(cvResponse);
            }
          } catch (parseError: any) {
            console.error("Failed to parse CV response:", cvResponse);
            console.error("Parse error:", parseError.message);
            throw new Error(`Invalid CV JSON from AI: ${parseError.message}`);
          }

          customizedJobs.push({
            job,
            customizedCv: cvData.customizedCv,
            cvChanges: cvData.changes
          });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        results.push({
          company,
          careersUrl,
          status: "success",
          jobs: customizedJobs
        });

      } catch (error: any) {
        console.error(`Error processing ${company}:`, error);
        results.push({
          company,
          careersUrl,
          status: "error",
          message: `Failed to process: ${error.message}`,
          jobs: []
        });
      }

      // Delay between companies to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 7. Return all results
    return NextResponse.json({
      results,
      totalCompanies: careersUrls.length,
      successfulMatches: results.filter(r => r.status === "success").length,
      noMatches: results.filter(r => r.status === "no_matches").length,
      errors: results.filter(r => r.status === "error").length,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error scraping jobs:", error);
    return new NextResponse(
      error.message || "Failed to scrape jobs", 
      { status: 500 }
    );
  }
}
