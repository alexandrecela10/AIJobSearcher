import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

export async function GET() {
  try {
    const buf = await readFile(SUBMISSIONS_FILE);
    const submissions = JSON.parse(buf.toString());
    return NextResponse.json(submissions);
  } catch (err) {
    // If file doesn't exist, return empty array
    return NextResponse.json([]);
  }
}
