# Gitlog Architecture

이 문서는 현재 구현과 코드의 위치·역할·상태 흐름을 정한다.

## Current Implementation

- Vite + React + TypeScript + Tailwind CSS 기반 SPA다. `src/main.tsx`에서 `QueryProvider`로 앱을 감싸고 `src/app/App.tsx`의 React Router 7 `BrowserRouter`가 라우트를 구성한다. 라우트 컴포넌트는 lazy import와 Suspense로 로드한다.
- `@tanstack/react-query`와 `axios`가 설치되어 있다. `app/providers/QueryProvider.tsx`의 QueryClient와 `shared/apis/client.ts`의 `api`를 재사용한다.
- 공통 클라이언트는 `VITE_API_BASE_URL`을 사용하고 네트워크 실패를 처리한다. `auth/api/authSession.ts`가 보호된 백엔드 요청의 인증 헤더와 토큰 재발급을 연결한다. access token은 메모리, refresh token과 인증 방식은 `shared/apis/tokenSession.ts`를 통해 sessionStorage에 보관한다.
- 이메일 가입·로그인은 `auth/api/`의 Mutation 훅, 내 정보는 `profile/api/`의 Query 훅으로 연결되어 있다. 이메일 로그인은 토큰과 내 정보 조회가 완료된 뒤 성공 처리한다. `useLayoutAuth`는 로그인 창·로그인 후 이동을 조합한다. 카카오는 인증 화면 이동과 콜백의 인가 코드 교환·결과 표시까지 연결되며, 서비스 로그인·추가 가입은 계약 확인이 필요하다.
- 프로필 화면은 내 정보 Query와 USER 수정 Mutation을 사용한다. 기본 정보·닉네임·사진·비밀번호 변경은 서버 응답 이후 처리하며, 저장 후 내 정보와 게시물 캐시를 갱신한다. 컴포넌트 갤러리의 로그인 미리보기는 해당 화면에만 적용한다.
- 게시물 목록은 기능별 Query로 조회하고 URL의 `page`와 `view=mine`이 탐색 상태를 표현한다. 내 글 전용 API가 없어 나의 깃로그는 전체 목록과 인증 상세의 `isOwner`를 확인한 결과를 캐시하고, 본인 글을 페이지당 10개씩 표시한다. 상세 요청은 최대 4개씩 보내며 게시글이 많으면 조회 비용이 증가한다. 전용 API가 생기면 이 대체 조회를 교체한다.
- 게시글·프로필 사진은 각 기능의 Mutation 훅에서 `shared/apis/uploadImage.ts`를 재사용한다. 서명 URL 발급 후 저장소에 파일을 PUT하고 공개 S3 객체 URL을 사용한다. 외부 저장소에는 백엔드 토큰을 보내지 않는다. 프로필은 업로드 완료 URL만 사진 수정 요청에 포함하고, 파일 재선택·화면 종료 시 이전 업로드를 중단한다. Zustand와 React Compiler는 도입되어 있지 않다.

## Folder Structure

아래는 목표 구조다. 실제 파일이 아직 없는 폴더는 해당 기능을 구현할 때 만든다.

```text
src/
  main.tsx                 # Vite 진입점
  app/
    App.tsx                # BrowserRouter와 라우트 조립
    routes/                # URL에 연결되는 페이지
    layouts/               # 여러 페이지가 공유하는 레이아웃
      AppLayout.tsx        # 상태 훅 호출과 화면 조립
      header/              # 공통 헤더와 페이지별 버튼
      hooks/               # 레이아웃 로그인 흐름·스크롤
    providers/
      QueryProvider.tsx    # TanStack Query 전역 provider
    styles/global.css      # Tailwind, shadcn 테마, 디자인 토큰
  features/
    auth/
      ui/                  # 회원가입·로그인 UI
      api/                 # 이메일·카카오 인증 API·Mutation 훅·세션 연결
      model/               # 인증 전용 타입·상태
      lib/                 # 인증 전용 순수 함수
    posts/
      ui/                  # 게시물 목록·상세·작성 UI
      api/                 # 게시물 API·Query 훅·Query Key, 연결 시 추가
      model/               # 게시물 전용 타입·상태
      lib/                 # 게시물 전용 순수 함수
    comments/
      ui/                  # 댓글 UI
      api/                 # 댓글 API·Query 훅·Query Key, 연결 시 추가
      model/               # 댓글 전용 타입·상태
      lib/                 # 댓글 전용 순수 함수
    profile/
      ui/                  # 내 정보·프로필 변경 UI
      api/                 # 내 정보 조회 API·Query 훅·Query Key
      model/               # 프로필 전용 타입·상태
      lib/                 # 프로필 전용 순수 함수
  shared/
    apis/
      client.ts            # Axios 인스턴스와 공통 interceptor
    assets/icons/          # 공통 이미지·아이콘
    constants/             # 공통 상수
    hooks/                 # 공통 훅
    mocks/                 # 공통 개발·테스트 데이터
    stores/                # 필요할 때 전역 클라이언트 상태
    types/                 # 공통 타입
    ui/
      primitives/          # shadcn/ui CLI가 생성한 기본 컴포넌트
    utils/
      cn.ts                # 공통 클래스 병합 유틸리티
```

## Core Rules

### Layer Responsibilities

- `app/`은 앱 시작, URL 연결, 전역 provider·레이아웃·스타일을 담당한다.
- `features/`는 게시물·댓글·인증처럼 한 기능에 속한 UI, API 함수, 타입, 상태, 순수 로직을 둔다.
- `shared/`는 여러 기능에서 쓰는 코드와 공통 UI 기본 요소를 둔다.
- 의존 방향은 `app → features → shared`다. `shared`에서 `features`나 `app`을 가져오지 않는다.

### Component Placement

- 게시물에만 쓰는 컴포넌트 → `features/posts/ui/`
- 여러 기능에서 쓰는 Gitlog UI → `shared/ui/`
- shadcn/ui CLI가 생성한 기본 요소 → `shared/ui/primitives/`
- URL에 연결되는 페이지 → `app/routes/`
- 여러 페이지의 외곽 레이아웃 → `app/layouts/`

### Layout Composition

- `app/layouts/AppLayout.tsx`는 훅을 호출하고 `AppHeader`, `Outlet`, `Toaster`를 조립한다.
- `app/layouts/header/`의 `AppHeader`는 공통 메뉴와 로그인 창을 조립하고, 페이지별 버튼은 `HomeHeaderActions`, `WriteHeaderActions`, `PostHeaderActions`, `ProfileHeaderActions`로 나눈다. 버튼 동작은 콜백으로 전달한다.
- `app/layouts/hooks/`에는 로그인 후 글쓰기 이동을 관리하는 `useLayoutAuth`와 페이지 이동 시 스크롤을 처리하는 `useRouteScroll`을 둔다.
- 인증된 사용자 정보는 내 정보 Query 캐시에서 가져온다. 게시글·댓글 미리보기 상태는 각 기능의 `model/`에 있는 `usePreviewPosts`, `usePreviewComments`가 관리하고, 게시글 이미지 URL은 `posts/model/usePostImageUrls`가 관리한다.
- 현재 미리보기 상태 훅은 `AppLayout`에서 한 번씩 호출하고 결과를 `Outlet context`로 전달한다. API 연결 시 서버 데이터는 기능별 Query 훅과 Query 캐시가 관리한다. Outlet에는 화면 조립에 필요한 콜백·상태를 전달하고 서버 데이터를 별도의 가변 상태로 복제하지 않는다.

### Feature Folder Convention

`features/{feature}/`는 필요한 폴더부터 만든다. 게시물 목록과 상세의 코드는 `features/posts/`에 모은다.

- `ui/` — 해당 기능의 컴포넌트. 상세 HTTP 요청 구현은 여기에 넣지 않는다.
- `api/` — 해당 기능의 엔드포인트 함수, TanStack Query 훅, Query Key. 인증 API는 여러 화면에서 사용해도 `features/auth/api/`에 둔다.
- `model/` — 해당 기능에서만 쓰는 타입과 상태. 여러 기능의 타입은 `shared/types/`.
- `lib/` — 검증·변환·포맷 등 순수 함수. HTTP 호출을 넣지 않고 가능하면 React에 의존하지 않게 작성한다.

이미지 업로드는 별도 `uploads` 기능으로 나누지 않는다. 게시물 이미지는 `posts`, 프로필 사진은 `profile`에 둔다. 동일한 전송 절차가 두 곳에서 반복되면 공통 부분만 `shared/apis/`로 옮긴다.

### Shared Folder Convention

- `shared/apis/` — Axios 인스턴스, 공통 인터셉터, 재사용하는 HTTP 도우미
- `shared/assets/` — 공통 이미지, SVG, 아이콘
- `shared/constants/` — 공통 상수
- `shared/hooks/` — 여러 기능에서 재사용하는 훅
- `shared/mocks/` — 개발·테스트용 공통 목 데이터
- `shared/stores/` — 여러 기능이 공유하는 클라이언트 상태가 필요할 때 추가; 서버 캐시를 중복 보관하지 않는다
- `shared/types/` — 여러 기능에서 공유하는 타입
- `shared/ui/` — Gitlog 공통 컴포넌트와 shadcn 기본 요소
- `shared/utils/` — 공통 순수 함수

### Design Tokens

- 전역 디자인 토큰은 `src/app/styles/global.css`에서 관리한다.
- 색상, 타이포그래피, 간격, 그라데이션 등 반복되는 디자인 값은 Figma의 정의와 기존 토큰을 확인하고 의미가 드러나는 토큰 클래스를 우선 사용한다.
- 필요한 값에 대응하는 토큰이 없어서 새 전역 토큰이나 하드코딩이 필요해 보이면, 먼저 사용자에게 디자인 의도를 확인한다.

### Routing

- 현재 라우팅은 `app/App.tsx`의 BrowserRouter·Routes·Route와 공통 `AppLayout`으로 구성한다. `app/routes/`의 페이지는 기능 UI와 Query 훅을 조합한다.
- 로그인은 별도 로그인 페이지 대신 공통 헤더의 `LoginDialog`로 제공한다. `/oauth/kakao/success`의 `KakaoCallbackPage`는 기존 세션 복원에 막히지 않도록 `AppLayout` 밖에서 인가 코드를 한 번 교환한다. 코드는 URL에서 제거하고 자동 재시도하지 않으며, 명세에 없는 로그인 정보는 만들지 않는다.
- 로컬 개발 서버는 현재 카카오 콜백에 맞춰 `localhost:3000`에서 실행한다. 포트가 사용 중이면 다른 포트로 옮기지 않고 종료한다. 배포 시 프론트 주소·백엔드 콜백 설정·카카오 등록 주소를 함께 맞춘다.
- `app/ComponentGallery.tsx`는 `/components`에서 여는 컴포넌트 미리보기다.
- 라우팅 변경은 이 SPA 구성을 따른다. Framework mode용 `root.tsx`, `routes.ts`, 별도 라우터 설정은 모드 변경을 선택할 때만 도입한다.

| URL                                            | 페이지                                     |
| ---------------------------------------------- | ------------------------------------------ |
| `/`                                            | HomePage; `page`, `view=mine` query로 탐색 |
| `/posts/new`, `/posts/:postId/edit`            | PostWritePage                              |
| `/posts/:postId`                               | PostDetailsPage                            |
| `/mypage/signup`                               | SignupPage                                 |
| `/mypage/signup/email`, `/mypage/signup/kakao` | SignupDetailsPage                          |
| `/mypage/settings`, `/mypage/settings/edit`    | ProfileSettingsPage                        |
| `/components`                                  | ComponentGallery                           |
| `/oauth/kakao/success`                         | KakaoCallbackPage                          |

### Re-export

- 공유 UI import가 많아지면 `shared/ui/index.ts`를 추가한다. 처음부터 모든 폴더에 `index.ts`를 만들지 않는다.
- Figma에서 추출한 SVG 아이콘은 `shared/assets/icons/`에 두고 `index.ts`에서 React 컴포넌트로 재수출한다. 애플리케이션 코드는 barrel에서 가져온다.
- 단색 아이콘은 실제 SVG 코드를 넣을 때 색상 속성에 `currentColor`를 사용할 수 있다. 여러 색을 쓰는 로고는 원래 색을 유지한다.
- 라우트 파일은 일괄 재수출하지 않는다.

```ts
// Good
import { CreateIcon } from '@/shared/assets/icons';

// Avoid
import CreateIcon from '@/shared/assets/icons/create.svg?react';
```

### Data Flow

- 서버 데이터 조회·변경 → `features/{feature}/api/`의 함수·Query 훅 → `shared/apis/client.ts`
- 단일 컴포넌트 상태 → 지역 `useState`
- 한 기능 안에서 공유하는 클라이언트 상태·타입 → `features/{feature}/model/`
- 여러 기능에서 공유해야 하는 클라이언트 상태 → 필요할 때 `shared/stores/`
- 순수 계산·검증·포맷 → 기능 전용이면 `features/{feature}/lib/`, 공통이면 `shared/utils/`

페이지와 UI는 기능별 Query 훅을 사용하며 HTTP 요청을 직접 구현하지 않는다. API 함수는 요청·응답 처리를, Query 훅은 서버 상태·캐시 관리를, UI는 입력·화면 표시를 담당한다. 백엔드 요청은 공통 axios 클라이언트를 사용하고, 외부 저장소 업로드는 백엔드용 baseURL·인증 인터셉터와 분리한다.

API 연결은 대상 기능부터 미리보기 데이터의 소유권을 Query 캐시로 옮긴다. 폼·다이얼로그·페이지 조건·로컬 이미지 미리보기 같은 클라이언트 상태는 유지하고, 서버 사용자·게시물·댓글 데이터는 미리보기 상태와 동시에 갱신하지 않는다.
