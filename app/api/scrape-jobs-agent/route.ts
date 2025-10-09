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

        // Check if page redirected to a job board platform
        const currentUrl = page.url();
        if (currentUrl !== careersUrl) {
          console.log(`  → Redirected to: ${currentUrl}`);
        }

        // Wait for page to fully load
        await page.waitForTimeout(3000);

        // 📸 STEP 2: Extract ALL job-related links from the page
        console.log(`  → Extracting job links...`);
        
        // 🔄 WAIT FOR JAVASCRIPT: Many careers pages load jobs dynamically
        // This means the HTML is empty at first, then JavaScript adds the jobs
        // We need to wait for common job listing selectors to appear
        try {
          await page.waitForSelector('a[href*="job"], a[href*="role"], a[href*="position"], .job, .role, .position', {
            timeout: 5000
          });
          console.log(`  → Jobs loaded via JavaScript`);
        } catch {
          console.log(`  → No dynamic job loading detected (or timed out)`);
        }
        
        // Extra wait for any animations/transitions
        await page.waitForTimeout(2000);
        
        const jobLinks = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          return links
            .map(link => ({
              text: link.innerText?.trim() || '',
              href: link.href,
              title: link.title || '',
              ariaLabel: link.getAttribute('aria-label') || ''
            }))
            .filter(link => {
              const url = link.href.toLowerCase();
              const text = link.text.toLowerCase();
              const combined = `${text} ${url} ${link.title} ${link.ariaLabel}`.toLowerCase();
              
              // ❌ EXCLUDE: Blog posts, social media, general pages
              if (
                url.includes('blog') ||
                url.includes('linkedin.com') ||
                url.includes('facebook.com') ||
                url.includes('twitter.com') ||
                url.includes('instagram.com') ||
                url.includes('/about') ||
                url.includes('/contact') ||
                url.includes('/team') ||
                url.includes('meet-')  // Exclude "meet the team" posts
              ) {
                return false;
              }
              
              // ✅ INCLUDE: URLs that look like job postings
              const hasJobInUrl = (
                url.includes('/job/') ||
                url.includes('/jobs/') ||
                url.includes('/role/') ||
                url.includes('/roles/') ||
                url.includes('/position/') ||
                url.includes('/positions/') ||
                url.includes('/opening/') ||
                url.includes('/openings/') ||
                url.includes('/vacancy/') ||
                url.includes('/vacancies/') ||
                url.includes('/listing/') ||
                url.includes('/listings/')
              );
              
              // ✅ INCLUDE: Text that looks like a job title (broader matching)
              const hasJobInText = (
                text.length > 10 && // Has some text
                text.length < 200 && // Not too long (likely a job title)
                !text.includes('cookie') && // Not cookie notices
                !text.includes('privacy') // Not privacy links
              );
              
              return (hasJobInUrl || hasJobInText) && link.href.startsWith('http');
            });
        });

        console.log(`  → Found ${jobLinks.length} potential job links`);

        if (jobLinks.length === 0) {
          await page.close();
          await context.close();
          results.push({
            company,
            careersUrl,
            status: "no_matches",
            message: `No job listings found on careers page`,
            jobs: []
          });
          continue;
        }

        // 🔍 STEP 3: Visit each job page and extract details
        const matchedJobs: JobListing[] = [];
        
        console.log(`  → Checking up to 30 job links...`);
        for (const link of jobLinks.slice(0, 30)) { // Check first 20 job links
          try {
            const jobPage = await context.newPage();
            await jobPage.goto(link.href, { 
              waitUntil: 'domcontentloaded',
              timeout: 15000 
            });
            await jobPage.waitForTimeout(1000);

            // Extract job details from the page
            const jobDetails = await jobPage.evaluate(() => {
              const bodyText = document.body.innerText;
              const title = document.querySelector('h1')?.innerText || 
                           document.querySelector('title')?.innerText || 
                           'Job Position';
              
              return {
                title: title.trim(),
                bodyText: bodyText.substring(0, 2000)
              };
            });

            await jobPage.close();

            // 🎯 STEP 4: Strict keyword matching
            const bodyLower = jobDetails.bodyText.toLowerCase();
            const titleLower = jobDetails.title.toLowerCase();
            
            // 🤖 AI-POWERED ROLE MATCHING: Use AI to check if job matches criteria
            // This is more flexible than hardcoded keywords
            const matchPrompt = `Does this job match the search criteria?

Job Title: ${jobDetails.title}
Job Description (first 500 chars): ${jobDetails.bodyText.substring(0, 500)}

Search Criteria:
- Looking for: ${criteria.roles.join(" OR ")}
- Seniority: ${criteria.seniority || "Any"}
- Cities: ${criteria.cities.join(", ") || "Any"}

Return ONLY valid JSON:
{"matches": true/false, "reason": "brief explanation"}`;

            let roleMatch = false;
            try {
              const matchCompletion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are a job matching expert. Return only valid JSON." },
                  { role: "user", content: matchPrompt }
                ],
                temperature: 0.3,
                max_tokens: 100,
              });
              const matchResponse = matchCompletion.choices[0]?.message?.content?.trim();
              const matchJson = matchResponse?.match(/\{[\s\S]*\}/);
              if (matchJson) {
                const matchData = JSON.parse(matchJson[0]);
                roleMatch = matchData.matches;
                console.log(`     AI match decision: ${matchData.matches} - ${matchData.reason}`);
              }
            } catch {
              // Fallback to keyword matching if AI fails
              roleMatch = criteria.roles.some(role => {
                const roleLower = role.toLowerCase();
                return titleLower.includes(roleLower) || 
                       (bodyLower.match(new RegExp(roleLower, 'g')) || []).length >= 2;
              });
            }
            
            // ✅ CITY MATCHING: More flexible
            const cityMatch = criteria.cities.length === 0 || criteria.cities.some(city => 
              bodyLower.includes(city.toLowerCase()) || titleLower.includes(city.toLowerCase())
            );
            
            // ✅ SENIORITY MATCHING: Optional but helpful
            const seniorityMatch = !criteria.seniority || 
                                  criteria.seniority === "" ||
                                  titleLower.includes(criteria.seniority.toLowerCase()) ||
                                  bodyLower.includes(criteria.seniority.toLowerCase());

            // ❌ EXCLUDE: Blog posts, team pages, non-job content
            const isNotJob = (
              titleLower.includes('meet') ||
              titleLower.includes('blog') ||
              titleLower.includes('story') ||
              titleLower.includes('interview') ||
              link.href.includes('blog')
            );

            if (roleMatch && cityMatch && seniorityMatch && !isNotJob) {
              // Extract location from body text
              const locationMatch = bodyLower.match(/(london|paris|new york|berlin|amsterdam|dublin|madrid|barcelona|remote)/i);
              const location = locationMatch ? locationMatch[0] : criteria.cities[0] || 'Location not specified';

              matchedJobs.push({
                title: jobDetails.title,
                location: location,
                description: jobDetails.bodyText.substring(0, 200) + '...',
                url: link.href
              });

              console.log(`  ✅ Matched: ${jobDetails.title} (${link.href})`);

              if (matchedJobs.length >= 3) break; // Stop after 3 matches
            } else {
              // Debug: Log why it didn't match
              console.log(`  ⏭️  Skipped: ${jobDetails.title}`);
              console.log(`     Role match: ${roleMatch}, City match: ${cityMatch}, Seniority match: ${seniorityMatch}, Not job: ${isNotJob}`);
            }

          } catch (jobError: any) {
            console.log(`  ⚠️  Skipped job link: ${jobError.message}`);
            continue;
          }
        }

        await page.close();
        await context.close();

        if (matchedJobs.length === 0) {
          results.push({
            company,
            careersUrl,
            status: "no_matches",
            message: `No jobs matching ${criteria.roles.join(", ")} at ${criteria.seniority} level`,
            jobs: []
          });
          continue;
        }

        // 🎨 STEP 5: Customize CV for each matched job using AI
        const customizedJobs = [];
        
        // Read the actual template CV file
        let templateCv = "Professional with experience in software development and analytics.";
        if (body.templateCvPath) {
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            
            // Convert relative path to absolute path
            const absolutePath = path.join(process.cwd(), body.templateCvPath);
            console.log(`  → Reading CV from: ${absolutePath}`);
            
            templateCv = await fs.readFile(absolutePath, 'utf-8');
            console.log(`  ✅ Loaded template CV (${templateCv.length} chars)`);
          } catch (err: any) {
            console.log(`  ⚠️  Could not read template CV: ${err.message}`);
            console.log(`  → Using default CV instead`);
          }
        }
        
        for (const job of matchedJobs) {
          try {
            const cvPrompt = `You are a professional CV writer. Customize this CV for the specific job.

Job Title: ${job.title}
Company: ${company}
Location: ${job.location}
Job Description: ${job.description}

Original CV:
${templateCv.substring(0, 2000)}

Task: Modify the CV to highlight relevant experience for this role. Keep the same structure but adjust:
1. Summary/objective to mention the specific role and company
2. Emphasize relevant skills and experience
3. Adjust language to match job requirements

Return ONLY valid JSON:
{
  "customizedCv": "The full customized CV text (keep original structure, just modify content)",
  "changes": ["List 3-5 specific changes made"]
}`;

            const cvCompletion = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: "You are a professional CV writer. Return only valid JSON with the full customized CV." },
                { role: "user", content: cvPrompt }
              ],
              temperature: 0.7,
              max_tokens: 2000, // Increased to fit full CV
            });

            const cvResponse = cvCompletion.choices[0]?.message?.content?.trim();
            const jsonMatch = cvResponse?.match(/\{[\s\S]*\}/);
            const cvData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
              customizedCv: `Experienced professional seeking ${job.title} role at ${company}`,
              changes: ["Tailored for role", "Highlighted relevant skills", "Emphasized location fit"]
            };

            customizedJobs.push({
              job,
              customizedCv: cvData.customizedCv,
              cvChanges: cvData.changes
            });

          } catch (cvError) {
            // Fallback if CV customization fails
            customizedJobs.push({
              job,
              customizedCv: `Experienced professional seeking ${job.title} role at ${company}`,
              cvChanges: ["Tailored for role", "Highlighted relevant skills", "Emphasized location fit"]
            });
          }
        }

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
