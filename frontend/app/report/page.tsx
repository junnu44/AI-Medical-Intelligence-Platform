"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ReportIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      router.replace(`/report/${id}`);
    } else {
      router.replace("/history");
    }
  }, [router, searchParams]);

  return null;
}
