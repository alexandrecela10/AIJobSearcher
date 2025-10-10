import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

interface JobResult {
  company: string;
  careersUrl: string;
  status: "success" | "no_matches" | "error";
  message?: string;
  jobs: Array<{
    job: {
      title: string;
      location: string;
      description: string;
      url: string;
    };
    customizedCv: string;
    cvChanges: string[];
  }>;
}

interface EmailRequest {
  email: string;
  criteria: {
    roles: string[];
    seniority: string;
    cities: string[];
    visa: boolean;
  };
  results: JobResult[];
}

export async function POST(req: Request) {
  try {
    const body: EmailRequest = await req.json();
    const { email, criteria, results } = body;

    if (!email || !criteria || !results) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Filter successful matches
    const successfulMatches = results.filter(r => r.status === "success");
    const totalJobs = successfulMatches.reduce((sum, r) => sum + r.jobs.length, 0);

    // Create email HTML
    const emailHtml = generateEmailHtml(email, criteria, successfulMatches, totalJobs);
    const emailText = generateEmailText(email, criteria, successfulMatches, totalJobs);

    // Configure email transporter
    // For development, we'll use a test account or console log
    // In production, you'd use a real SMTP service like SendGrid, AWS SES, etc.
    
    const isDevelopment = process.env.NODE_ENV !== "production";
    
    if (isDevelopment) {
      // Development: Just log the email
      console.log("\n📧 ===== EMAIL PREVIEW =====");
      console.log("To:", email);
      console.log("Subject: Your Job Search Results - " + totalJobs + " Matches Found");
      console.log("\n--- EMAIL CONTENT ---");
      console.log(emailText);
      console.log("\n===== END EMAIL =====\n");
      
      return NextResponse.json({ 
        success: true, 
        message: "Email logged to console (development mode)",
        preview: emailText
      });
    }

    // Production: Send real email
    // You'll need to set these environment variables:
    // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER || "noreply@jobsearcher.com",
      to: email,
      subject: `Your Job Search Results - ${totalJobs} Matches Found`,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: "Email sent successfully" });

  } catch (err: any) {
    console.error("/api/send-email error", err);
    return new NextResponse(err.message || "Failed to send email", { status: 500 });
  }
}

function generateEmailHtml(
  email: string,
  criteria: any,
  results: JobResult[],
  totalJobs: number
): string {
  const jobsHtml = results.map(result => `
    <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #6366f1;">
      <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">${result.company}</h3>
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
        ✅ <strong>Verified:</strong> We visited their careers page and found ${result.jobs.length} matching job${result.jobs.length > 1 ? 's' : ''}
      </p>
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
        <a href="${result.careersUrl}" style="color: #6366f1; text-decoration: none;">🔗 View Careers Page →</a>
      </p>
      
      ${result.jobs.map(jobData => `
        <div style="margin: 15px 0; padding: 15px; background-color: white; border-radius: 6px; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 16px;">
            <a href="${jobData.job.url}" style="color: #334155; text-decoration: none;">${jobData.job.title}</a>
          </h4>
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 14px;">
            📍 ${jobData.job.location}
          </p>
          <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px;">
            ${jobData.job.description}
          </p>
          <a href="${jobData.job.url}" 
             style="display: inline-block; padding: 8px 16px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-size: 14px;">
            View Job →
          </a>
          
          <div style="margin-top: 15px; padding: 15px; background-color: #f1f5f9; border-radius: 6px;">
            <h5 style="margin: 0 0 10px 0; color: #334155; font-size: 14px; font-weight: 600;">
              ✨ Customized CV for this role:
            </h5>
            <div style="margin: 0 0 10px 0; color: #475569; font-size: 13px; white-space: pre-wrap; font-family: 'Courier New', monospace; background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
${jobData.customizedCv}
            </div>
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: 600;">Key Changes:</p>
            <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #64748b; font-size: 12px;">
              ${jobData.cvChanges.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Job Search Results</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0 0 10px 0; color: #1e293b; font-size: 32px;">🎯 Your Job Search Results</h1>
          <p style="margin: 0; color: #64748b; font-size: 16px;">We found ${totalJobs} matching jobs for you!</p>
        </div>

        <!-- Search Criteria Summary -->
        <div style="margin-bottom: 30px; padding: 20px; background-color: white; border-radius: 8px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px;">📋 Your Search Criteria</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 30%;">Target Roles:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 14px; font-weight: 500;">${criteria.roles.join(", ")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Seniority Level:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 14px; font-weight: 500;">${criteria.seniority}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Target Cities:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 14px; font-weight: 500;">${criteria.cities.join(", ")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Visa Sponsorship:</td>
              <td style="padding: 8px 0; color: #334155; font-size: 14px; font-weight: 500;">${criteria.visa ? "Required" : "Not required"}</td>
            </tr>
          </table>
        </div>

        <!-- Job Matches -->
        <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 24px;">💼 Your Job Matches</h2>
        ${jobsHtml}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">This email was sent to ${email}</p>
          <p style="margin: 5px 0 0 0;">Generated by Job Searcher</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function generateEmailText(
  email: string,
  criteria: any,
  results: JobResult[],
  totalJobs: number
): string {
  let text = `
🎯 YOUR JOB SEARCH RESULTS
=========================

We found ${totalJobs} matching jobs for you!

📋 YOUR SEARCH CRITERIA
-----------------------
Target Roles: ${criteria.roles.join(", ")}
Seniority Level: ${criteria.seniority}
Target Cities: ${criteria.cities.join(", ")}
Visa Sponsorship: ${criteria.visa ? "Required" : "Not required"}

💼 YOUR JOB MATCHES
-------------------

`;

  results.forEach(result => {
    text += `\n${result.company}\n`;
    text += `${"=".repeat(result.company.length)}\n`;
    text += `✅ Verified: We visited their careers page and found ${result.jobs.length} matching job${result.jobs.length > 1 ? 's' : ''}\n`;
    text += `Careers Page: ${result.careersUrl}\n\n`;

    result.jobs.forEach(jobData => {
      text += `  📌 ${jobData.job.title}\n`;
      text += `  📍 ${jobData.job.location}\n`;
      text += `  🔗 ${jobData.job.url}\n\n`;
      text += `  ${jobData.job.description}\n\n`;
      text += `  ✨ CUSTOMIZED CV FOR THIS ROLE:\n`;
      text += `  ${"-".repeat(40)}\n`;
      text += `  ${jobData.customizedCv}\n\n`;
      text += `  Key Changes:\n`;
      jobData.cvChanges.forEach(change => {
        text += `    • ${change}\n`;
      });
      text += `\n`;
    });
  });

  text += `\n---\nThis email was sent to ${email}\nGenerated by Job Searcher\n`;

  return text;
}
