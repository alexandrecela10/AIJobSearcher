import { NextResponse } from "next/server";
import { chromium } from "playwright";
import OpenAI from "openai";

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
  let browser;
  
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new NextResponse("OpenAI API key not configured", { status: 500 });
    }

    const body: ScrapeJobsRequest = await req.json();
    const { careersUrls, criteria } = body;

    if (!careersUrls || !Array.isArray(careersUrls) || careersUrls.length === 0) {
      return new NextResponse("Careers URLs array is required", { status: 400 });
    }

    // 🤖 AGENTIC WORKFLOW: Launch a real browser
    console.log("🚀 Launching headless browser...");
    browser = await chromium.launch({
      headless: true, // Run without UI
    });

    const results: CompanyJobResult[] = [];

    // Process each company with the agent
    for (const { company, careersUrl } of careersUrls) {
      console.log(`\n🔍 Processing ${company} at ${careersUrl}`);
      
      try {
        // Create a new browser page (tab) with realistic user agent
        const context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });
        const page = await context.newPage();
        
        // 🌐 STEP 1: Navigate to the careers page
        console.log(`  → Navigating to ${careersUrl}`);
        await page.goto(careersUrl, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Wait a bit for dynamic content to load
        await page.waitForTimeout(2000);

        // 📸 STEP 2: Extract the page content
        const pageContent = await page.content();
        const pageText = await page.evaluate(() => document.body.innerText);

        // 🧠 STEP 3: Use AI to understand the page and find jobs
        const analysisPrompt = `You are a web scraping agent analyzing a careers page.

Page URL: ${careersUrl}
Company: ${company}

Search Criteria:
- Roles: ${criteria.roles.join(", ")}
- Seniority: ${criteria.seniority}
- Cities: ${criteria.cities.join(", ")}

Page content (first 3000 chars):
${pageText.substring(0, 3000)}

Task: Extract up to 3 real job listings that match the criteria.

For each job, provide:
1. Exact job title (as shown on the page)
2. Location (as shown on the page)
3. Brief description (2-3 sentences)
4. The actual URL to the job posting (must be a real link from the page)

Return ONLY valid JSON in this format:
{
  "hasMatches": true/false,
  "jobs": [
    {
      "title": "Exact job title",
      "location": "City, Country",
      "description": "Brief description",
      "url": "https://full-url-to-job"
    }
  ]
}

IMPORTANT: 
- Only include jobs that actually exist on this page
- URLs must be complete and clickable
- If no matching jobs, return {"hasMatches": false, "jobs": []}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a precise web scraping agent. You extract real job data from careers pages and return valid JSON."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.3, // Low temperature for accuracy
          max_tokens: 1000,
        });

        const response = completion.choices[0]?.message?.content?.trim();
        if (!response) {
          throw new Error("No response from AI");
        }

        // Parse the AI response
        let jobsData;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jobsData = JSON.parse(jsonMatch[0]);
          } else {
            jobsData = JSON.parse(response);
          }
        } catch (parseError: any) {
          console.error("Failed to parse AI response:", response);
          throw new Error(`Invalid JSON: ${parseError.message}`);
        }

        // Close the page
        await page.close();

        // Check if jobs were found
        if (!jobsData.hasMatches || jobsData.jobs.length === 0) {
          results.push({
            company,
            careersUrl,
            status: "no_matches",
            message: `No matching jobs found for ${criteria.roles.join(", ")} at ${criteria.seniority} level`,
            jobs: []
          });
          continue;
        }

        // 🎨 STEP 4: Customize CV for each job (simplified for now)
        const customizedJobs = jobsData.jobs.slice(0, 3).map((job: JobListing) => ({
          job,
          customizedCv: `Customized CV for ${job.title} at ${company}`,
          cvChanges: [
            `Tailored summary for ${job.title} role`,
            `Highlighted relevant skills for ${job.location}`,
            `Emphasized experience matching job requirements`
          ]
        }));

        results.push({
          company,
          careersUrl,
          status: "success",
          jobs: customizedJobs
        });

        console.log(`  ✅ Found ${customizedJobs.length} matching jobs`);

      } catch (error: any) {
        console.error(`  ❌ Error processing ${company}:`, error.message);
        results.push({
          company,
          careersUrl,
          status: "error",
          message: `Failed to scrape: ${error.message}`,
          jobs: []
        });
      }

      // Delay between companies to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Close the browser
    if (browser) {
      await browser.close();
    }

    return NextResponse.json({
      results,
      totalCompanies: careersUrls.length,
      successfulMatches: results.filter(r => r.status === "success").length,
      noMatches: results.filter(r => r.status === "no_matches").length,
      errors: results.filter(r => r.status === "error").length,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error in agentic scraper:", error);
    
    // Make sure to close browser on error
    if (browser) {
      await browser.close();
    }
    
    return new NextResponse(
      error.message || "Failed to scrape jobs", 
      { status: 500 }
    );
  }
}
