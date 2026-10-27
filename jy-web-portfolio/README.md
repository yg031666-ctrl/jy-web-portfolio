# JY Studio

기업 홈페이지·쇼핑몰·브랜드 웹사이트 제작을 소개하는 서지영의 1인 웹디자인·개발 스튜디오 사이트입니다. HTML, CSS, JavaScript만 사용하며 별도 패키지 설치나 빌드 단계는 없습니다.

## 로컬 실행

이 README가 있는 폴더에서 실행합니다.

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

기존 정적 사이트 배포 구조와 문서 루트는 그대로 유지합니다. `index.html`, `style.css`, `script.js`, `assets`를 함께 배포하세요.

## 콘텐츠 관리

- 화면 순서: 메인 → 서비스 → 스튜디오 소개 → 프로젝트 → 제작 과정 → 문의
- 태경물산 카페24·웹 버전은 실제 고객 프로젝트입니다. UNFORM은 개인 콘셉트 프로젝트입니다. NOVERA와 NEXCORE는 고객 실적으로 단정하지 않는 포트폴리오 작업입니다.
- 기존 프로젝트 5개와 외부 사이트 링크를 유지합니다. 프로젝트의 목적·담당 작업·기술·구현 내용을 함께 안내합니다.
- 이메일은 `yg03166@naver.com`을 사용합니다. PC의 카카오톡 버튼은 채널 홈 `https://pf.kakao.com/_dqbWX`으로 연결하고, 터치 중심 모바일 환경에서는 사용자가 제공한 채팅 바로가기 `https://pf.kakao.com/_dqbWX/chat`으로 연결합니다. PC에서 채팅을 이용하기 어려울 때는 이메일로 문의하도록 안내합니다.
- 실제 구현 범위가 확인되지 않은 결제·회원·관리 기능, 고객 후기, 경력, 성과 수치는 기재하지 않습니다.

## 이미지

화면에는 최장변 1,600px 이하의 WebP 파일을 사용합니다. 기존 JPG·PNG 원본은 보존했습니다.

- 큰 프로필: `assets/images/s1.webp`
- 작은 프로필: `assets/images/s2.webp`
- 프로젝트: `unform.webp`, `novera.webp`, `TK2.webp`, `TK1.webp`, `NEXCORE.webp`

사진을 교체할 때는 실제로 참조하는 WebP도 함께 갱신하고 `index.html`의 이미지 설명과 원본 가로·세로 치수를 확인하세요. 화면 크롭은 CSS에서 제어합니다.

## 검증

```sh
node --check script.js
git diff --check
```

브라우저에서는 PC·태블릿·모바일의 가로 넘침, 이미지 로딩, 모바일 메뉴의 열기·닫기·Escape·키보드 탐색, 내부 링크, 모션 감소 설정을 확인합니다. JavaScript를 끄더라도 본문과 기본 문의 링크는 표시됩니다. IntersectionObserver 애니메이션은 모션 감소 설정에서 비활성화됩니다.
