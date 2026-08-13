const IGNORED_EXACT_HEADINGS = [
  "Practical Assignment-1",
  "Practical Assignment 1",
  "Data Types, Variables, and Literals",
  "Identifiers and Naming Rules",
  "Operators",
  "Decision Making & Control Flow Statements",
];

export function normalizeLine(line = "") {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

function romanToNumber(value) {
  const roman = value.toUpperCase();
  const map = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  let previous = 0;

  for (let index = roman.length - 1; index >= 0; index -= 1) {
    const current = map[roman[index]] || 0;
    total += current < previous ? -current : current;
    previous = Math.max(previous, current);
  }

  return total || null;
}

export function shouldIgnoreLine(line) {
  const cleanLine = normalizeLine(line);
  const lowerLine = cleanLine.toLowerCase();

  if (!cleanLine || cleanLine === "---PAGE_BREAK---") {
    return true;
  }

  if (
    IGNORED_EXACT_HEADINGS.some(
      (heading) => heading.toLowerCase() === lowerLine,
    )
  ) {
    return true;
  }

  const ignoredPatterns = [
    /^subject\s*:/i,
    /^subject\s+code\s*:/i,
    /^course(?:\s+name|\s+code)?\s*:/i,
    /^student(?:\s+name|\s+id)?\s*:/i,
    /^enrol(?:l)?ment(?:\s+no\.?|\s+number|\s+id)?\s*:/i,
    /^name\s*:/i,
    /^division\s*:/i,
    /^class\s*:/i,
    /^programme?\s*:/i,
    /^department\s*:/i,
    /^faculty\s*:/i,
    /^college\s*:/i,
    /^university\s*:/i,
    /^academic\s+year\s*:/i,

    /^lab\s+assignment\b/i,
    /^practical\s+assignment\b/i,
    /^assignment\s*(?:no\.?|number)?\s*[-:]?\s*\d*\s*$/i,

    /^part\s+[ivxlcdm\d]+\b/i,
    /^unit\s+[ivxlcdm\d]+\b/i,
    /^module\s+[ivxlcdm\d]+\b/i,
    /^section\s+[a-zivxlcdm\d]+\b/i,
    /^chapter\s+[ivxlcdm\d]+\b/i,

    /^(?:bca|mca|b\.?ca|m\.?ca|bsc|msc|btech|mtech)\b.*\bsemester\b/i,
    /^semester\s+[ivxlcdm\d]+\s*$/i,

    /^instructions?\s*:?.*$/i,
    /^general\s+instructions?\s*:?.*$/i,
    /^note\s*:?.*$/i,

    /^page\s+\d+(?:\s+of\s+\d+)?\s*$/i,
    /^\d+\s*\/\s*\d+\s*$/,
  ];

  return ignoredPatterns.some((pattern) => pattern.test(cleanLine));
}

function parseExplicitMarker(line) {
  const cleanLine = normalizeLine(line);

  const activityMatch = cleanLine.match(
    /^(exercise|experiment|practical)\s*(?:no\.?\s*)?(\d+)\s*[.)\-:]?\s*(.*)$/i,
  );

  if (activityMatch) {
    const rawLabel = activityMatch[1].toLowerCase();
    const label =
      rawLabel === "exercise"
        ? "Exercise"
        : rawLabel === "experiment"
          ? "Experiment"
          : "Practical";
    const number = Number(activityMatch[2]);
    const title = activityMatch[3]?.trim() || "";

    return {
      type: rawLabel,
      number,
      content: title ? `${label} ${number}: ${title}` : `${label} ${number}`,
    };
  }

  const questionMatch = cleanLine.match(
    /^(?:q(?:uestion)?|que)\s*(?:no\.?\s*)?[-.:]?\s*(\d+)\s*[.)\-:]?\s*(.*)$/i,
  );

  if (questionMatch) {
    return {
      type: "question",
      number: Number(questionMatch[1]),
      content: questionMatch[2]?.trim() || "",
    };
  }

  return null;
}

function parseNumberedMarker(line) {
  const cleanLine = normalizeLine(line);
  const match = cleanLine.match(/^(\d{1,3})\s*(?:[)\-:]\s*|\.(?!\d)\s*)(.+)$/);

  if (!match) {
    return null;
  }

  return {
    type: "numbered",
    number: Number(match[1]),
    content: match[2].trim(),
  };
}

function parseRomanMarker(line) {
  const cleanLine = normalizeLine(line);
  const match = cleanLine.match(/^([IVXLCDM]{1,7})\s*[.)\-:]\s+(.+)$/i);

  if (!match) {
    return null;
  }

  return {
    type: "roman",
    number: romanToNumber(match[1]),
    content: match[2].trim(),
  };
}

function isLikelyBulletQuestion(line) {
  const cleanLine = normalizeLine(line);
  return /^[•●▪◦*-]\s+/.test(cleanLine);
}

function stripBullet(line) {
  return normalizeLine(line)
    .replace(/^[•●▪◦*-]\s+/, "")
    .trim();
}

function questionVerbStart(line) {
  return /^(?:write|create|develop|demonstrate|explain|define|describe|calculate|accept|initialize|design|implement|find|display|show|access|compare|differentiate|derive|convert|check|print|read|enter|what|why|how|which|when|where|who|state|list|give|draw|discuss|prepare|illustrate|solve|prove|identify|mention|classify|construct|perform|use)\b/i.test(
    normalizeLine(line),
  );
}

function cleanDetectedQuestions(questions) {
  const seen = new Set();

  return questions
    .map((question) =>
      normalizeLine(question)
        .replace(/\s+([,.;:?!])/g, "$1")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((question) => {
      if (!question || question.length < 3) {
        return false;
      }

      const key = question.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function calculateConfidence({
  markerCount,
  questionCount,
  usedFallback,
  format,
}) {
  if (!questionCount) return 0;

  if (!usedFallback && markerCount === questionCount) {
    if (["exercise", "experiment", "practical", "question"].includes(format)) {
      return 98;
    }
    if (format === "numbered" || format === "roman") return 92;
  }

  if (usedFallback && format === "bullet") return 78;
  if (usedFallback) return 65;
  return 85;
}

export function detectQuestions(text) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  const explicitMarkers = lines.map(parseExplicitMarker).filter(Boolean);
  const numberedMarkers = explicitMarkers.length
    ? []
    : lines.map(parseNumberedMarker).filter(Boolean);
  const romanMarkers =
    explicitMarkers.length || numberedMarkers.length
      ? []
      : lines.map(parseRomanMarker).filter(Boolean);

  let parser = null;
  let markers = [];
  let format = "unknown";

  if (explicitMarkers.length) {
    parser = parseExplicitMarker;
    markers = explicitMarkers;
    format = explicitMarkers[0].type;
  } else if (numberedMarkers.length) {
    parser = parseNumberedMarker;
    markers = numberedMarkers;
    format = "numbered";
  } else if (romanMarkers.length) {
    parser = parseRomanMarker;
    markers = romanMarkers;
    format = "roman";
  }

  if (parser) {
    const detectedQuestions = [];
    let currentQuestion = "";
    let questionStarted = false;

    for (const line of lines) {
      const marker = parser(line);

      if (marker) {
        if (currentQuestion.trim()) {
          detectedQuestions.push(currentQuestion.trim());
        }

        currentQuestion = marker.content;
        questionStarted = true;
        continue;
      }

      if (!questionStarted) continue;
      if (shouldIgnoreLine(line)) continue;

      currentQuestion = currentQuestion ? `${currentQuestion} ${line}` : line;
    }

    if (currentQuestion.trim()) {
      detectedQuestions.push(currentQuestion.trim());
    }

    const questions = cleanDetectedQuestions(detectedQuestions);

    return {
      questions,
      usedFallback: false,
      format,
      confidence: calculateConfidence({
        markerCount: markers.length,
        questionCount: questions.length,
        usedFallback: false,
        format,
      }),
    };
  }

  const bulletLines = lines.filter(
    (line) => isLikelyBulletQuestion(line) && stripBullet(line).length >= 8,
  );

  if (bulletLines.length >= 2) {
    const questions = cleanDetectedQuestions(bulletLines.map(stripBullet));

    return {
      questions,
      usedFallback: true,
      format: "bullet",
      confidence: calculateConfidence({
        markerCount: bulletLines.length,
        questionCount: questions.length,
        usedFallback: true,
        format: "bullet",
      }),
    };
  }

  const fallbackQuestions = [];
  let currentQuestion = "";

  for (const line of lines) {
    if (shouldIgnoreLine(line)) continue;

    const looksLikeQuestion = questionVerbStart(line) || /\?\s*$/.test(line);

    if (looksLikeQuestion) {
      if (currentQuestion.trim()) {
        fallbackQuestions.push(currentQuestion.trim());
      }
      currentQuestion = line;
    } else if (currentQuestion) {
      currentQuestion = `${currentQuestion} ${line}`.trim();
    }
  }

  if (currentQuestion.trim()) {
    fallbackQuestions.push(currentQuestion.trim());
  }

  const questions = cleanDetectedQuestions(fallbackQuestions);

  return {
    questions,
    usedFallback: true,
    format: "smart fallback",
    confidence: calculateConfidence({
      markerCount: 0,
      questionCount: questions.length,
      usedFallback: true,
      format: "fallback",
    }),
  };
}
