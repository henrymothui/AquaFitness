import Image from "next/image";
import { imageUrl } from "@/lib/storage";

export function ClassImage({
  path,
  name,
  className = "",
}: {
  path: string | null;
  name: string;
  className?: string;
}) {
  const url = imageUrl(path);
  if (!url) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-lagoon to-pool font-display text-3xl text-white ${className}`}
        aria-hidden
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }
  return (
    <Image src={url} alt="" width={1200} height={800} unoptimized className={`object-cover ${className}`} />
  );
}
