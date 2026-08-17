import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/firestore/posts";
import { toIsoString } from "@/lib/utils/dates";

export const runtime = "nodejs";

function serializePost(
  post: Awaited<ReturnType<typeof getPublishedPosts>>["items"][number],
) {
  return {
    ...post,
    publishedAt: toIsoString(post.publishedAt),
    createdAt: toIsoString(post.createdAt),
    updatedAt: toIsoString(post.updatedAt),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 12;
  const cursor = searchParams.get("cursor");
  const search = searchParams.get("search") || searchParams.get("q");
  const categoryId = searchParams.get("categoryId");
  const categoryIdsParam = searchParams.get("categoryIds");
  const categoryIds = categoryIdsParam
    ? categoryIdsParam.split(",").map((id) => id.trim()).filter(Boolean)
    : undefined;

  try {
    const result = await getPublishedPosts({
      limit,
      cursor,
      search,
      categoryId,
      categoryIds,
    });

    return NextResponse.json({
      items: result.items.map(serializePost),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("[api/posts]", error);
    return NextResponse.json(
      {
        items: [],
        nextCursor: null,
        hasMore: false,
        error: "Unable to load posts",
      },
      { status: 503 },
    );
  }
}
