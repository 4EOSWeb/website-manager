import { authorize, authzResponse } from "@/lib/authorize";
import { pageForSite, pagesForSite } from "@/lib/pages";

type Params = { params: Promise<{ websiteId: string }> };

export async function GET(request: Request, { params }: Params) {
  const { websiteId } = await params;
  try {
    await authorize(websiteId, "view");
    const id = new URL(request.url).searchParams.get("id");
    if (id) {
      const page = await pageForSite(websiteId, id);
      if (!page) return Response.json({ message: "That page is not available." }, { status: 404 });
      return Response.json(page);
    }
    const pages = await pagesForSite(websiteId);
    return Response.json({ pages });
  } catch (error) {
    return authzResponse(error);
  }
}
