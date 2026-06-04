---
trigger: always_on
---

# React Native Base Coding Standards
**Antigravity Agent Skill — Place at:** `~/.gemini/antigravity/skills/your-org/react-native-base/SKILL.md`

---

## Purpose

This skill enforces standard best practices for all React Native code in this project. Apply it whenever the agent writes, reviews, or refactors any component, hook, screen, or service file.

---

## 1. File Size Limit

- **Hard limit: 500 lines per file.** If a file approaches this, it must be split before adding more code.
- If a component's JSX alone exceeds ~150 lines, it is doing too much — break it into smaller components.
- If a file's `StyleSheet` block exceeds ~100 lines, extract styles into a sibling `ComponentName.styles.ts` file.
- Hooks that exceed ~80 lines should be split into smaller focused hooks.

**When to split a component:**
- It has more than one distinct visual section → extract each section into its own component.
- It has conditional rendering across multiple states (loading / error / empty / data) → extract a sub-component per state.
- The same JSX block appears more than once → extract it into a reusable component.

---

## 2. Modular Component Architecture

Every piece of UI is either a **screen** or a **component**. Never blur this line.

```
src/
  components/         # Reusable, shared UI — knows nothing about routes or business logic
    ui/               # Primitives: Button, Text, Avatar, Card, Input, Badge, Divider
    layout/           # Structural: Screen, Row, Column, Spacer, SafeArea
    feedback/         # States: LoadingSpinner, EmptyState, ErrorView, Toast
    forms/            # FormField, Select, Checkbox, DatePicker
  screens/            # One file per screen. Thin — delegates everything to hooks/components.
  features/           # Feature-scoped components that are NOT shared (e.g. features/checkout/)
  hooks/              # Custom hooks (use* naming)
  store/              # State slices
  services/           # API, storage, analytics
  utils/              # Pure functions only
  constants/          # Design tokens: colors, spacing, typography, radii
  types/              # Shared TypeScript types and interfaces
  navigation/         # Navigators and route param types
  assets/             # Images, fonts, icons
```

---

## 3. Reusable Components

**The golden rule:** If you write the same JSX twice, it becomes a component.

### What makes a good reusable component:
- Accepts props to control its appearance and behavior — no hardcoded values.
- Has no knowledge of where it is used or what screen it lives on.
- Has no direct API calls or store access (pass data in via props or a hook).
- Works in isolation — can be rendered in a Storybook story or test without any app context.

### Component checklist before committing:
- [ ] Props are typed with an `interface`. No `any`.
- [ ] All strings, colors, and sizes come from props or constants — nothing hardcoded.
- [ ] Has a sensible default for every optional prop.
- [ ] Handles the empty / null / loading case visibly.
- [ ] Has at least one test.

### Example — wrong vs right:

```tsx
// ❌ Bad — hardcoded, not reusable
const UserBadge = () => (
  <View style={{ backgroundColor: '#1A56DB', padding: 8, borderRadius: 4 }}>
    <Text style={{ color: '#fff', fontSize: 12 }}>Admin</Text>
  </View>
);

// ✅ Good — generic, reusable
interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = colors.primary,
  textColor = colors.white,
  size = 'md',
}) => (
  <View style={[styles.badge, { backgroundColor: color }, styles[size]]}>
    <Text style={[styles.label, { color: textColor }]}>{label}</Text>
  </View>
);
```

---

## 4. Component Rules

- **Functional components only.** No class components.
- **One component per file.** File name matches exported component name (`UserCard.tsx` exports `UserCard`).
- **Destructure props at the function signature.** Not inside the body.
- **No logic in JSX.** If you need an `if` or a ternary more than 1 level deep, extract a helper or sub-component.
- **Screen components must be thin.** A screen file should mostly be: call a hook → pass data to components → return layout. If a screen exceeds 150 lines, something that belongs in a hook or component is still in the screen.

```tsx
// ✅ Good screen structure
const ProfileScreen: React.FC = () => {
  const { user, isLoading, error } = useProfile();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorView message={error.message} />;
  if (!user) return <EmptyState message="No profile found" />;

  return (
    <Screen>
      <ProfileHeader user={user} />
      <ProfileStats stats={user.stats} />
      <ProfileActions userId={user.id} />
    </Screen>
  );
};
```

---

## 5. Custom Hooks

- Extract all non-trivial logic from components into a `use*` hook.
- A hook should do **one thing**: fetch data, manage form state, handle a gesture, etc.
- Hooks that manage API calls use React Query (`useQuery`, `useMutation`) internally.
- Never put a hook inside a component file if it's longer than ~20 lines — it gets its own file.

```ts
// hooks/useProfile.ts
export const useProfile = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getById(userId),
  });

  return { user: data, isLoading, error };
};
```

---

## 6. Styling Rules

- **No inline style objects.** (`style={{ marginTop: 16 }}` is banned.)
- **All styles via `StyleSheet.create()`** at the bottom of the file, or in a sibling `.styles.ts` file when the block exceeds ~100 lines.
- **No hardcoded values.** Every color, spacing, font size, and border radius references a constant.
- **Design tokens live in `constants/`** and are the single source of truth.

```ts
// constants/tokens.ts
export const colors = {
  primary:        '#1A56DB',
  primaryLight:   '#EBF0FF',
  danger:         '#E02424',
  surface:        '#FFFFFF',
  background:     '#F9FAFB',
  textPrimary:    '#111827',
  textSecondary:  '#6B7280',
  border:         '#E5E7EB',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const fontSizes = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  xxl: 24,
  h1:  32,
} as const;
```

---

## 7. TypeScript Rules

- `strict: true` in `tsconfig.json`. Always.
- No `any`. Use `unknown` and type-narrow it with guards.
- No non-null assertions (`!`) — handle `null` and `undefined` explicitly.
- Props typed with `interface`. Shared types exported from `types/index.ts`.
- API response shapes defined in `types/api.ts` — never inferred from a raw fetch.

---

## 8. Naming Conventions

| Thing               | Convention              | Example                         |
|---------------------|-------------------------|---------------------------------|
| Component file      | PascalCase              | `UserCard.tsx`                  |
| Hook file           | camelCase, use* prefix  | `useCartItems.ts`               |
| Util file           | camelCase               | `formatCurrency.ts`             |
| Style file          | ComponentName.styles.ts | `UserCard.styles.ts`            |
| Constants file      | camelCase               | `colors.ts`, `spacing.ts`       |
| Boolean props       | is* / has* / can*       | `isLoading`, `hasError`         |
| Event handler props | on*                     | `onPress`, `onSubmit`           |
| Event handler fns   | handle*                 | `handlePress`, `handleSubmit`   |

---

## 9. State Management Rules

- **Server/async state** → React Query. Never store API responses in Zustand.
- **App-wide client state** → Zustand (one slice per domain: `useAuthStore`, `useCartStore`).
- **Component-local state** → `useState` or `useReducer`.
- Business logic lives in hooks or store actions — never directly in a component.

---

## 10. Lists and Performance

- Any list with more than ~10 items uses `FlatList` or `FlashList`. Never `ScrollView` + `.map()`.
- Always provide a `keyExtractor` that returns a stable unique string (not the array index).
- `useCallback` on `renderItem` to prevent unnecessary re-renders.
- Images use `FastImage`; always specify `width` and `height`.

---

## 11. Error Handling

- Every `async/await` block has a `try/catch`. Never swallow errors silently.
- API errors surface to the user as a visible message — not just a console log.
- Wrap screen-level trees in an `ErrorBoundary`.
- No `console.log` in committed code. Use `src/utils/logger.ts` which is a no-op in production.

---

## 12. Accessibility

- All interactive elements have `accessibilityLabel` and `accessibilityRole`.
- Minimum touch target: 44×44 pt.
- Never use color alone to communicate state — always pair with text or an icon.

---

## 13. Code Review Checklist

Before a component is considered done, it must pass all of these:

- [ ] File is under 500 lines
- [ ] No hardcoded colors, spacing, or font sizes
- [ ] No inline style objects
- [ ] No `any` types
- [ ] No `console.log`
- [ ] Props are fully typed
- [ ] All loading / error / empty states are handled and visible
- [ ] No business logic inside the component body — it's in a hook
- [ ] At least one test exists
- [ ] Accessible (label + role on interactive elements)