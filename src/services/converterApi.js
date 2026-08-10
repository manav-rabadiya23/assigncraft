const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readJson(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong during conversion.");
  }

  return data;
}

export async function createConversionJob(inputFormat, outputFormat) {
  const response = await fetch("/api/converter/create-job", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputFormat, outputFormat }),
  });

  return readJson(response);
}

export async function uploadToCloudConvert(uploadForm, file) {
  const formData = new FormData();

  Object.entries(uploadForm.parameters || {}).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  // CloudConvert requires the file field to be the final form field.
  formData.append("file", file, file.name);

  const response = await fetch(uploadForm.url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("File upload failed. Please try again.");
  }
}

export async function waitForConversion(jobId, onProgress) {
  const maxChecks = 180;

  for (let check = 0; check < maxChecks; check += 1) {
    const response = await fetch(
      `/api/converter/job-status?jobId=${encodeURIComponent(jobId)}`,
      { cache: "no-store" },
    );
    const data = await readJson(response);

    onProgress?.(data.status);

    if (data.status === "finished") {
      return data;
    }

    if (data.status === "error") {
      throw new Error(data.message || "Conversion failed.");
    }

    await sleep(1500);
  }

  throw new Error("Conversion is taking too long. Please try again.");
}

export async function convertDocument(file, inputFormat, outputFormat, onProgress) {
  onProgress?.("creating");
  const job = await createConversionJob(inputFormat, outputFormat);

  onProgress?.("uploading");
  await uploadToCloudConvert(job.uploadForm, file);

  onProgress?.("processing");
  const result = await waitForConversion(job.jobId, onProgress);

  return result;
}
