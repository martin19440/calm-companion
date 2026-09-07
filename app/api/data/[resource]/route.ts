import { NextResponse } from "next/server";
import {
  getSharedItems,
  migrateSharedItems,
  replaceSharedItems,
  type SharedResource,
} from "@/lib/shared-data";

const resources: SharedResource[] = ["family", "memory-book", "medication", "routine"];

function isSharedResource(value: string): value is SharedResource {
  return resources.includes(value as SharedResource);
}

async function getResource(resource: string) {
  if (!isSharedResource(resource)) {
    return null;
  }

  return getSharedItems(resource);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const items = await getResource((await params).resource);

  if (!items) {
    return NextResponse.json({ error: "Unknown data resource." }, { status: 404 });
  }

  return NextResponse.json(items);
}

async function readItems(request: Request) {
  const body: unknown = await request.json();
  return Array.isArray(body) ? body : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const resource = (await params).resource;
  if (!isSharedResource(resource)) {
    return NextResponse.json({ error: "Unknown data resource." }, { status: 404 });
  }

  const items = await readItems(request);
  if (!items) {
    return NextResponse.json({ error: "Data must be an array." }, { status: 400 });
  }

  return NextResponse.json(await migrateSharedItems(resource, items));
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const resource = (await params).resource;
  if (!isSharedResource(resource)) {
    return NextResponse.json({ error: "Unknown data resource." }, { status: 404 });
  }

  const items = await readItems(request);
  if (!items) {
    return NextResponse.json({ error: "Data must be an array." }, { status: 400 });
  }

  return NextResponse.json(await replaceSharedItems(resource, items));
}