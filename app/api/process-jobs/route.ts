import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max execution time

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

/**
 * This API combines Steps 2, 3, and 4 into one automated background process
 * Flow: Expand Companies → Find Careers URLs → Scrape Jobs → Email Results
 */
export async function POST(req: Request) {
  let browser = null;
  
  try {
    const { submissionId } = await req.json();

    if (!submissionId) {
      return new NextResponse("Missing submissionId", { status: 400 });
    }

    console.log(`\n🚀 Starting automated job processing for submission: ${submissionId}`);

    // Load submission data
    const submissionsData = await readFile(SUBMISSIONS_FILE, "utf-8");
    const submissions = JSON.parse(submissionsData);
    const submission = submissions.find((s: any) => s.id === submissionId);

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    console.log(`📋 Loaded submission for ${submission.email}`);

    // STEP 2: Expand Companies with AI
    console.log(`\n🤖 STEP 2: Expanding companies...`);
    const expandedCompanies = await expandCompanies(submission.companies, submission.roles);
    console.log(`✅ Expanded to ${expandedCompanies.length} companies`);

    // STEP 3: Find Careers URLs
    console.log(`\n🔍 STEP 3: Finding careers URLs...`);
    const careersUrls = await findCareersUrls(expandedCompanies);
    console.log(`✅ Found ${careersUrls.length} careers URLs`);
    
    // Log all identified careers URLs
    console.log(`\n📋 Identified Careers Websites:`);
    careersUrls.forEach(({ company, careersUrl, confidence }) => {
      console.log(`  • ${company}: ${careersUrl} (${confidence} confidence)`);
    });

    // STEP 4: Scrape Jobs and Customize CVs
    console.log(`\n🕷️  STEP 4: Scraping jobs and customizing CVs...`);
    browser = await chromium.launch({ headless: true });
    const jobResults = await scrapeJobsAndCustomizeCVs(
      browser,
      careersUrls,
      {
        roles: submission.roles,
        seniority: submission.seniority,
        cities: submission.cities,
        visa: submission.visa
      },
      submission.templatePath
    );
    await browser.close();
    console.log(`✅ Found ${jobResults.filter((r: any) => r.status === "success").length} companies with matches`);

    // STEP 5: Send Email
    console.log(`\n📧 STEP 5: Sending email to ${submission.email}...`);
    await sendEmail(submission.email, submission, jobResults);
    console.log(`✅ Email sent successfully!`);

    console.log(`\n🎉 Automated processing complete for ${submission.email}`);

    return NextResponse.json({
      success: true,
      message: "Jobs processed and email sent",
      stats: {
        companiesProcessed: careersUrls.length,
        jobsFound: jobResults.reduce((sum: number, r: any) => 
          sum + (r.status === "success" ? r.jobs.length : 0), 0
        )
      }
    });

  } catch (err: any) {
    console.error("❌ Automated processing error:", err);
    if (browser) await browser.close();
    return new NextResponse(err.message || "Processing failed", { status: 500 });
  }
}

// STEP 2: Expand Companies
async function expandCompanies(companies: string[], roles: string[]): Promise<string[]> {
  try {
    const prompt = `Given these companies: ${companies.join(", ")}
And these target roles: ${roles.join(", ")}

Suggest similar companies that hire for these roles. Return enough to make a total of 10 companies including the original ones.

Return ONLY valid JSON:
{"companies": ["Company 1", "Company 2", ...]}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a job search expert. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const response = completion.choices[0]?.message?.content?.trim();
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return [...companies, ...data.companies].slice(0, 10); // Original + expanded, max 10
    }
  } catch (err) {
    console.log("⚠️  Company expansion failed, using original list");
  }
  
  return companies;
}

// STEP 3: Find Careers URLs
async function findCareersUrls(companies: string[]): Promise<Array<{company: string, careersUrl: string, confidence: string}>> {
  const results = [];

  for (const company of companies) {
    try {
      const prompt = `What is the careers/jobs page URL for ${company}?

Return ONLY valid JSON:
{"url": "https://...", "confidence": "high/medium/low"}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      const jsonMatch = response?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        results.push({
          company,
          careersUrl: data.url,
          confidence: data.confidence
        });
      }
    } catch (err) {
      console.log(`⚠️  Failed to find URL for ${company}`);
    }
  }

  return results;
}

// STEP 4: Scrape Jobs and Customize CVs (simplified version of scrape-jobs-agent)
async function scrapeJobsAndCustomizeCVs(
  browser: any,
  careersUrls: any[],
  criteria: any,
  templateCvPath: string
): Promise<any[]> {
  const results = [];

  // Generate expanded roles once
  console.log(`\n🤖 Generating similar role keywords for: ${criteria.roles.join(", ")}`);
  let expandedRoles = [...criteria.roles];
  try {
    const roleExpansionPrompt = `Generate 3 similar role titles for: ${criteria.roles.join(", ")}
Return ONLY valid JSON: {"expandedRoles": ["role1", "role2", ...]}`;

    const expansionCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: roleExpansionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const expansionResponse = expansionCompletion.choices[0]?.message?.content?.trim();
    const expansionJson = expansionResponse?.match(/\{[\s\S]*\}/);
    if (expansionJson) {
      const expansionData = JSON.parse(expansionJson[0]);
      // Add AI-generated roles to original roles (don't replace!)
      const aiRoles = expansionData.expandedRoles || [];
      expandedRoles = [...criteria.roles, ...aiRoles];
      console.log(`✅ Original roles: ${criteria.roles.join(", ")}`);
      console.log(`✅ AI-generated similar roles: ${aiRoles.join(", ")}`);
      console.log(`✅ All keywords to search: ${expandedRoles.join(", ")}`);
    }
  } catch (err) {
    console.log("⚠️  Role expansion failed, using original roles");
  }

  // Load template CV
  let templateCv = "Professional with experience in software development and analytics.";
  try {
    const fs = await import('fs/promises');
    const absolutePath = path.join(process.cwd(), templateCvPath);
    templateCv = await fs.readFile(absolutePath, 'utf-8');
  } catch (err) {
    console.log("⚠️  Could not read template CV");
  }

  // Process each company (limit to first 10 for automated mode)
  for (const { company, careersUrl } of careersUrls.slice(0, 10)) {
    try {
      console.log(`  Processing ${company}...`);
      console.log(`    🌐 Visiting: ${careersUrl}`);
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      const page = await context.newPage();

      await page.goto(careersUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(2000);

      // 🤖 SIMULATE HUMAN: Try to find and use the search box
      console.log(`    🔍 Looking for search box...`);
      let jobLinks = [];
      
      try {
        // Try to find search input (common selectors)
        const searchInput = await page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="job" i], input[name*="search" i], input[id*="search" i]').first();
        
        if (await searchInput.count() > 0) {
          console.log(`    ✅ Found search box, searching for: ${criteria.roles[0]}`);
          
          // Type the first role into search
          await searchInput.fill(criteria.roles[0]);
          await page.waitForTimeout(1000);
          
          // Try to submit (press Enter or find search button)
          await searchInput.press('Enter');
          await page.waitForTimeout(3000);
          
          console.log(`    ✅ Search submitted, extracting results...`);
        } else {
          console.log(`    ⚠️  No search box found, extracting job links from page...`);
        }
      } catch (err) {
        console.log(`    ⚠️  Search failed, extracting job links from page...`);
      }

      // Extract job links from current page (either search results or main page)
      jobLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links
          .filter(link => {
            const url = link.href.toLowerCase();
            const text = link.innerText.toLowerCase();
            
            // ❌ EXCLUDE: Navigation, blogs, news, non-job pages
            if (url.includes('/blog') || 
                url.includes('/news') || 
                url.includes('/stories') ||
                url.includes('/about') ||
                url.includes('/company') ||
                url.includes('/contact') ||
                url.includes('/#') ||
                url.includes('/apply') ||
                url.includes('/riders') ||
                url.includes('/restaurant') ||
                url.includes('/business') ||
                url.includes('/deliver') ||
                url.includes('/gift') ||
                url.includes('/investors') ||
                url.includes('/press') ||
                text.includes('skip to') ||
                text.includes('place order') ||
                text.includes('sign up') ||
                text.includes('log in') ||
                text.includes('rider') ||
                text.includes('restaurant') ||
                text.includes('blog')) {
              return false;
            }
            
            // ✅ ONLY INCLUDE: URLs that clearly indicate job listings
            const hasJobInUrl = url.includes('/job/') || 
                               url.includes('/jobs/') ||
                               url.includes('/role/') || 
                               url.includes('/roles/') ||
                               url.includes('/position/') ||
                               url.includes('/positions/') ||
                               url.includes('/career/') ||
                               url.includes('/careers/') ||
                               url.includes('/opening/') ||
                               url.includes('/openings/') ||
                               url.includes('/vacancy') ||
                               url.includes('/vacancies');
            
            return hasJobInUrl && link.href.startsWith('http');
          })
          .slice(0, 20)
          .map(link => ({ href: link.href, text: link.innerText.trim() }));
      });

      await context.close();

      console.log(`    Found ${jobLinks.length} potential job links`);
      
      // Check each job link
      const matchedJobs = [];
      for (const link of jobLinks.slice(0, 5)) {
        try {
          console.log(`    → Checking: ${link.text.substring(0, 50)}...`);
          console.log(`      🌐 Visiting job page: ${link.href}`);
          
          const jobContext = await browser.newContext();
          const jobPage = await jobContext.newPage();
          await jobPage.goto(link.href, { waitUntil: "domcontentloaded", timeout: 10000 });
          await jobPage.waitForTimeout(1000);

          const jobDetails = await jobPage.evaluate(() => {
            const h1 = document.querySelector('h1') as HTMLElement | null;
            const titleEl = document.querySelector('[class*="title"]') as HTMLElement | null;
            const title = h1?.innerText || titleEl?.innerText || 'Job Position';
            const bodyText = document.body.innerText;
            return { title: title.trim(), bodyText: bodyText.substring(0, 2000) };
          });

          await jobContext.close();

          // Check if job matches
          const titleLower = jobDetails.title.toLowerCase();
          const bodyLower = jobDetails.bodyText.toLowerCase();
          
          console.log(`      Title: "${jobDetails.title}"`);
          console.log(`      Looking for: ${expandedRoles.join(", ")}`);
          
          const roleMatch = expandedRoles.some(role => {
            const roleLower = role.toLowerCase();
            const inTitle = titleLower.includes(roleLower);
            const bodyCount = (bodyLower.match(new RegExp(roleLower, 'g')) || []).length;
            
            if (inTitle) {
              console.log(`      ✅ "${role}" found in title`);
            } else if (bodyCount >= 2) {
              console.log(`      ✅ "${role}" appears ${bodyCount} times in body`);
            }
            
            return inTitle || bodyCount >= 2;
          });

          const isNotJob = titleLower.includes('blog') || titleLower.includes('story') || 
                          titleLower.includes('meet') || link.href.includes('/blog');

          if (!roleMatch) {
            console.log(`      ❌ No role match`);
          }
          if (isNotJob) {
            console.log(`      ❌ Excluded: blog/story`);
          }

          if (roleMatch && !isNotJob) {
            console.log(`      ✅ MATCHED!`);
            
            // Customize CV for this job
            const customizedCv = await customizeCv(jobDetails, company, templateCv);
            
            matchedJobs.push({
              job: {
                title: jobDetails.title,
                location: criteria.cities[0] || "Location not specified",
                description: jobDetails.bodyText.substring(0, 200) + '...',
                url: link.href
              },
              customizedCv: customizedCv.cv,
              cvChanges: customizedCv.changes
            });

            if (matchedJobs.length >= 2) break; // Max 2 jobs per company
          }
        } catch (err) {
          // Skip this job
        }
      }

      if (matchedJobs.length > 0) {
        results.push({
          company,
          careersUrl,
          status: "success",
          jobs: matchedJobs
        });
      }

    } catch (err) {
      console.log(`  ⚠️  Failed to process ${company}`);
    }
  }

  return results;
}

// Customize CV for a specific job
async function customizeCv(jobDetails: any, company: string, templateCv: string): Promise<{cv: string, changes: string[]}> {
  try {
    const cvPrompt = `Customize this CV for the job.

Job: ${jobDetails.title} at ${company}
Description: ${jobDetails.bodyText.substring(0, 500)}

Original CV:
${templateCv.substring(0, 1500)}

Return ONLY valid JSON:
{
  "customizedCv": "Full customized CV text",
  "changes": ["change 1", "change 2", "change 3"]
}`;

    const cvCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a CV writer. Return only valid JSON." },
        { role: "user", content: cvPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const cvResponse = cvCompletion.choices[0]?.message?.content?.trim();
    const jsonMatch = cvResponse?.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const cvData = JSON.parse(jsonMatch[0]);
      return {
        cv: cvData.customizedCv,
        changes: cvData.changes
      };
    }
  } catch (err) {
    console.log("⚠️  CV customization failed");
  }

  return {
    cv: `Experienced professional seeking ${jobDetails.title} role at ${company}`,
    changes: ["Tailored for role", "Highlighted relevant skills"]
  };
}

// Send email with results
async function sendEmail(email: string, submission: any, results: any[]): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        criteria: {
          roles: submission.roles,
          seniority: submission.seniority,
          cities: submission.cities,
          visa: submission.visa
        },
        results
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
  }
}
