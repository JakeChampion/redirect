import { getDeployStore } from "@netlify/blobs"
import type { Context } from "@netlify/edge-functions"
import bf from "bloomfilter"

export default async (req: Request, _context: Context) => {
    const body = await req.json()
    
    if (!body.source) {
        return new Response('no source')
    }

    if (!body.dest) {
        return new Response('no dest')
    }

    const store = getDeployStore({
        name: "redirects",
        region: "us-east-1"
    });

    const data = await store.get("bloomfilter", { type: "json" })
    const bloom = data 
        ? new bf.BloomFilter(new Uint8Array(data))
        : bf.BloomFilter.withTargetError(1_000_000, 1e-6)

    bloom.add(body.source);

    await store.set(body.source, body.dest)
    const array = [].slice.call(bloom.buckets);
    await store.setJSON("bloomfilter", array)

    return new Response('added')
};
