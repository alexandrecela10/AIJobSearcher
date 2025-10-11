import { NextResponse } from "next/server";
import { mkdir, writeFile, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

async function ensureDirs() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(UPLOAD_DIR, { recursive: true });
}

function parseCommaList(value: string): string[] {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 200);
}

export async function POST(req: Request) {
  try {
    await ensureDirs();
    const form = await req.formData();

    const companies = String(form.get("companies") || "");
    const roles = String(form.get("roles") || "");
    const seniority = String(form.get("seniority") || "");
    const cities = String(form.get("cities") || "");
    const email = String(form.get("email") || "");
    const frequency = String(form.get("frequency") || "once");
    const visa = String(form.get("visa") || "");
    const file = form.get("template");

    if (!companies || !roles || !email || !frequency || !visa || !file) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if file is a Blob (File extends Blob)
    if (!file || typeof file === 'string' || !('arrayBuffer' in file)) {
      return new NextResponse("Invalid file", { status: 400 });
    }

    // Basic document validation
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return new NextResponse("File too large (max 2MB)", { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const allowedExtensions = [".doc", ".docx", ".pdf", ".txt"];
    const hasValidExtension = allowedExtensions.some(ext => filename.endsWith(ext));
    
    if (!hasValidExtension) {
      return new NextResponse("Only DOC, DOCX, PDF, or TXT files are allowed", { status: 400 });
    }

    const id = randomUUID();
    const fileExtension = allowedExtensions.find(ext => filename.endsWith(ext)) || ".txt";
    const uploadPath = path.join(UPLOAD_DIR, `${id}${fileExtension}`);
    const arrayBuffer = await file.arrayBuffer();

    await writeFile(uploadPath, Buffer.from(arrayBuffer));

    const submission = {
      id,
      createdAt: new Date().toISOString(),
      companies: parseCommaList(companies),
      roles: parseCommaList(roles),
      seniority,
      cities: parseCommaList(cities),
      email,
      frequency,
      visa: visa === "yes",
      templatePath: `uploads/${id}${fileExtension}`,
    } as const;

    // Persist
    let existing: any[] = [];
    try {
      const buf = await readFile(SUBMISSIONS_FILE);
      existing = JSON.parse(buf.toString());
      if (!Array.isArray(existing)) existing = [];
    } catch {}

    existing.push(submission);
    await writeFile(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2));

    return NextResponse.json({ id });
  } catch (err: any) {
    console.error("/api/submit error", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
