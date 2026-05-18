// 현재 GEMINI_API_KEY로 호출 가능한 모델 목록을 확인하기 위한 유틸리티 스크립트입니다.
// 실행 방법: node --env-file=.env.local scripts/list-models.mjs
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY가 .env.local에 정의되어 있지 않습니다.");
  process.exit(1);
}

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`,
);
if (!res.ok) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}
const data = await res.json();
const models = data.models ?? [];

const imageRelated = models.filter(
  (m) =>
    /image|imagen|nano|banana/i.test(m.name) ||
    /image/i.test(m.description ?? "") ||
    (m.supportedGenerationMethods ?? []).includes("predict"),
);

console.log(`\n=== 전체 모델 ${models.length}개 ===`);
for (const m of models) {
  console.log(
    `  ${m.name.padEnd(50)}  methods=[${(m.supportedGenerationMethods ?? []).join(",")}]`,
  );
}

console.log(`\n=== 이미지 관련 모델 ===`);
for (const m of imageRelated) {
  console.log(
    `  ${m.name.padEnd(50)}  methods=[${(m.supportedGenerationMethods ?? []).join(",")}]`,
  );
}
