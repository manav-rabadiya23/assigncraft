const ALLOWED_CONVERSIONS = new Set(["docx:pdf", "pdf:docx"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed." });
  }

  const apiKey = process.env.CLOUDCONVERT_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      message: "Converter is not configured. CLOUDCONVERT_API_KEY is missing.",
    });
  }

  const inputFormat = String(req.body?.inputFormat || "").toLowerCase();
  const outputFormat = String(req.body?.outputFormat || "").toLowerCase();

  if (!ALLOWED_CONVERSIONS.has(`${inputFormat}:${outputFormat}`)) {
    return res.status(400).json({ message: "Unsupported conversion." });
  }

  try {
    const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "upload-file": {
            operation: "import/upload",
          },
          "convert-file": {
            operation: "convert",
            input: "upload-file",
            input_format: inputFormat,
            output_format: outputFormat,
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        message: payload?.message || "Unable to create conversion job.",
      });
    }

    const job = payload.data;
    const uploadTask = job.tasks?.find(
      (task) => task.name === "upload-file" || task.operation === "import/upload",
    );
    const uploadForm = uploadTask?.result?.form;

    if (!uploadForm?.url || !uploadForm?.parameters) {
      return res.status(500).json({ message: "Upload form was not created." });
    }

    return res.status(200).json({
      jobId: job.id,
      uploadForm,
    });
  } catch (error) {
    console.error("CloudConvert create-job error:", error);
    return res.status(500).json({ message: "Unable to start conversion." });
  }
}
