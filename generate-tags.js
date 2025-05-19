const fs = require("fs");
const path = require("path");

// 현재 날짜를 기반으로 디렉토리 경로 생성
const now = new Date();
const ROOT_DIR = `./${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
  2,
  "0"
)}`;
const README_PATH = "./README.md";
const TAGS_SECTION_START = "<!-- TAGS_START -->";
const TAGS_SECTION_END = "<!-- TAGS_END -->";

// 디렉토리가 없으면 생성
if (!fs.existsSync(ROOT_DIR)) {
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  console.log(`📁 ${ROOT_DIR} 디렉토리가 생성되었습니다.`);
}

function extractTagsFromContent(content) {
  const match = content.match(/\*\*Tags:\*\*(.*)/);
  if (!match) {
    console.log("❌ 태그를 찾을 수 없습니다.");
    return [];
  }
  const tags = match[1]
    .split("#")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
  console.log("✅ 추출된 태그:", tags);
  return tags;
}

function extractTitle(content) {
  const lines = content.split("\n");
  return lines.find((line) => line.startsWith("#"))?.replace(/^#\s*/, "") ?? "";
}

function getAllMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(filePath));
    } else if (file.endsWith(".md")) {
      results.push(filePath);
    }
  }
  return results;
}

function scanFilesAndCollectTags() {
  const tagMap = {};
  console.log("\n🔍 마크다운 파일 검색 시작...");

  const files = getAllMarkdownFiles(ROOT_DIR);
  console.log(`📁 발견된 마크다운 파일 수: ${files.length}`);
  console.log("📄 파일 목록:", files);

  for (const fullPath of files) {
    console.log(`\n📖 파일 처리 중: ${fullPath}`);
    const content = fs.readFileSync(fullPath, "utf-8");
    const tags = extractTagsFromContent(content);
    const title = extractTitle(content);
    const relativePath = fullPath.replace(/^\.\//, "");
    console.log(`📝 제목: ${title}`);

    for (const tag of tags) {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push({ path: relativePath, title });
    }
  }

  console.log("\n📊 태그 통계:");
  Object.entries(tagMap).forEach(([tag, entries]) => {
    console.log(`- #${tag}: ${entries.length}개 파일`);
  });

  return tagMap;
}

function generateTagSection(tagMap) {
  console.log("\n📋 태그 섹션 생성 중...");
  const lines = ["### 📌 Tags\n"];

  for (const tag of Object.keys(tagMap).sort()) {
    lines.push(`<details>`);
    lines.push(`<summary>**#${tag}** (${tagMap[tag].length}개)</summary>`);
    lines.push(``);
    for (const entry of tagMap[tag]) {
      lines.push(
        `- [${path.basename(entry.path, ".md")}](${entry.path}) ${entry.title}`
      );
    }
    lines.push(`</details>`);
    lines.push(``);
  }

  const tagSection = lines.join("\n");
  console.log("✅ 태그 섹션 생성 완료");
  return tagSection;
}

function updateReadmeWithTags(tagSection) {
  console.log("\n📝 README.md 업데이트 중...");
  let original = "";
  try {
    original = fs.readFileSync(README_PATH, "utf-8");
    console.log("✅ README.md 파일 읽기 성공");
  } catch (error) {
    console.log("⚠️ README.md 파일이 없어 새로 생성합니다.");
    original = `# study-log\n공부 기록 남기기\n\n${TAGS_SECTION_START}\n\n### 📌 Tags\n\n${TAGS_SECTION_END}`;
  }

  const tagRegex = new RegExp(
    `${TAGS_SECTION_START}[\\s\\S]*?${TAGS_SECTION_END}`
  );

  if (tagRegex.test(original)) {
    console.log("✅ 기존 태그 섹션을 찾았습니다. 교체를 시작합니다.");
    const newReadme = original.replace(
      tagRegex,
      `${TAGS_SECTION_START}\n\n${tagSection}\n\n${TAGS_SECTION_END}`
    );
    fs.writeFileSync(README_PATH, newReadme, "utf-8");
  } else {
    console.log("⚠️ 태그 섹션을 찾을 수 없어 파일 끝에 추가합니다.");
    const newReadme = `${original}\n\n${TAGS_SECTION_START}\n\n${tagSection}\n\n${TAGS_SECTION_END}`;
    fs.writeFileSync(README_PATH, newReadme, "utf-8");
  }
  console.log("✅ README.md 업데이트 완료");
}

const tagMap = scanFilesAndCollectTags();
const tagSection = generateTagSection(tagMap);
updateReadmeWithTags(tagSection);

console.log("✅ README.md 태그 목록 업데이트 완료!");
