# 다국어 성경 정적 웹앱

서버, 데이터베이스, 빌드 프레임워크 없이 GitHub Pages에서 바로 동작하는 다국어 성경 웹앱입니다. 원본 TSV 텍스트 파일을 Node.js 스크립트로 정적 JSON 파일로 변환하고, `docs/` 아래의 Vanilla HTML/CSS/JavaScript 앱이 이 JSON만 `fetch`해서 화면을 렌더링합니다.

## 폴더 구조

```text
new_bible/
  README.md
  data/
    ko_ot.txt
    ko_nt.txt
    OT_EN_formatted.txt
    OT_GM_formatted.txt
    OT_CH_formatted.txt
    OT_JP_formatted.txt
    NT_EN_formatted.txt
    NT_GM_formatted.txt
    NT_CH_formatted.txt
    NT_JP_formatted.txt
  scripts/
    build-data.js
  docs/
    index.html
    styles.css
    app.js
    data-json/
      books.json
      chapters/
      verses/
```

## 데이터 파일

`data/`의 원본 파일은 탭 구분 TSV입니다. 일반적인 형태는 다음과 같습니다.

```text
Book    Reference    Verse
Genesis 1:1          In the beginning God created the heavens and the earth.
```

한국어 파일은 헤더명이 `Book / Verse / Text` 형태이지만 실제 데이터 컬럼은 동일하게 `책 / 장:절 / 본문`입니다. 빌드 스크립트는 헤더명에 의존하지 않고 `^\d+:\d+$` 형식의 Reference를 기준으로 파싱합니다.

## JSON 빌드 방법

Node.js가 설치된 상태에서 프로젝트 루트에서 실행합니다.

```bash
node scripts/build-data.js
```

실행하면 기존 `docs/data-json/`을 삭제한 뒤 다시 생성합니다. 원본 `data/` 파일은 수정하지 않습니다.

생성되는 주요 파일은 다음과 같습니다.

```text
docs/data-json/books.json
docs/data-json/chapters/{bookId}.json
docs/data-json/verses/{bookId}/{chapter}.json
```

책 ID에 공백이 들어갈 수 있으므로 빌드 스크립트와 프론트엔드는 같은 파일명 안전 처리 함수를 사용합니다.

```js
function toSafeFileName(name) {
  return name.replace(/[\/\\?%*:|"<>]/g, "_");
}
```

## 로컬 테스트 방법

정적 JSON `fetch`는 `file://`로 열면 브라우저 정책에 의해 막힐 수 있습니다. 간단한 정적 서버를 사용하세요.

```bash
python -m http.server 8000 -d docs
```

브라우저에서 접속합니다.

```text
http://localhost:8000
```

## GitHub Pages 배포 방법

1. GitHub 저장소 Settings로 이동합니다.
2. Pages 메뉴를 엽니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch를 `main`으로 선택합니다.
5. Folder를 `/docs`로 선택합니다.
6. 저장 후 배포 URL에서 앱을 확인합니다.

## 데이터 로딩 구조

프론트엔드는 `docs/index.html` 기준 상대 경로만 사용합니다.

```js
fetch("./data-json/books.json")
fetch(`./data-json/chapters/${toSafeFileName(bookId)}.json`)
fetch(`./data-json/verses/${toSafeFileName(bookId)}/${chapter}.json`)
```

서버 API, Node 서버, Express, 데이터베이스는 사용하지 않습니다.

## 주요 기능

- 구약 / 신약 선택
- 구약 / 신약 책 목록 탭
- 책 이름 검색: `id`, `ko`, `en`, `de`, `zh`, `ja`
- 책별 장 목록 표시
- 장별 절 보기
- KO, EN, DE, ZH, JA 언어 토글
- 빈 번역 자동 숨김
- 이전 장 / 다음 장 이동
- 책 경계를 넘어 이전 책 마지막 장 또는 다음 책 1장으로 이동
- 최근 선택 상태와 언어 선택을 `localStorage`에 저장

## 향후 개선 사항

- 번역본 출처와 저작권 정보를 앱 내부에 명확히 표시
- 북마크, 형광펜, 메모 기능 추가
- 본문 글자 크기와 줄 간격 사용자 설정
- 검색 범위를 전체 본문으로 확장
- PWA 오프라인 캐시 적용
- 디자인 시스템 분리 및 테마 교체 구조 강화
