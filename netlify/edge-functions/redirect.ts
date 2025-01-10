import { getDeployStore } from "@netlify/blobs"
import type { Context } from "@netlify/edge-functions"
import bf from "bloomfilter"

export default async (req: Request, _context: Context) => {
    const store = getDeployStore({
        name: "redirects",
        region: "us-east-1"
    });

    const data = await store.get("bloomfilter", { type: "json" })
    const bloom = data 
        ? new bf.BloomFilter(new Uint8Array(data))
        : bf.BloomFilter.withTargetError(1_000_000, 1e-6)

    const url = new URL(req.url)
    if (bloom.test(url.pathname)) {
        const redirect = await store.get(url.pathname)
        if (redirect) {
            return Response.redirect(redirect)
        }
    }
};

