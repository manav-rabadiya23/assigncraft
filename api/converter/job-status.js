export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method not allowed." });
  }

  const apiKey = process.env.CLOUDCONVERT_API_KEY;
  const jobId = String(req.query?.jobId || "").trim();

  if (!apiKey) {
    return res.status(500).json({
      message: "Converter is not configured. CLOUDCONVERT_API_KEY is missing.",
    });
  }

  if (!jobId || !/^[a-zA-Z0-9-]+$/.test(jobId)) {
    return res.status(400).json({ message: "Invalid job ID." });
  }

  try {
    const response = await fetch(
      `https://api.cloudconvert.com/v2/jobs/${encodeURIComponent(jobId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: payload?.message || "Unable to check conversion status.",
      });
    }

    const job = payload.data;
    const failedTask = job.tasks?.find((task) => task.status === "error");

    if (job.status === "error" || failedTask) {
      return res.status(200).json({
        status: "error",
        message: failedTask?.message || "Conversion failed.",
      });
    }

    if (job.status !== "finished") {
      return res.status(200).json({ status: job.status || "processing" });
    }

    const exportTask = job.tasks?.find(
      (task) => task.name === "export-file" || task.operation === "export/url",
    );
    const outputFile = exportTask?.result?.files?.[0];

    if (!outputFile?.url) {
      return res.status(500).json({ message: "Converted file URL was not found." });
    }

    return res.status(200).json({
      status: "finished",
      file: {
        name: outputFile.filename,
        url: outputFile.url,
      },
    });
  } catch (error) {
    console.error("CloudConvert job-status error:", error);
    return res.status(500).json({ message: "Unable to check conversion status." });
  }
}
