# Homepage About Section API

Production CMS for the homepage **About** block.

**Collection:** `homepage_about_sections` (singleton document)

---

## Schema

| Field | Type | Notes |
|-------|------|-------|
| `useAboutUsContent` | Boolean | Default `true` — sync from About Us CMS |
| `sectionHeading` | String | Required when custom mode |
| `shortDescription` | String | Required when custom mode |
| `features` | `{ text, order }[]` | Ordered feature list |
| `buttonText` | String | Default `Learn More` |
| `buttonLink` | String | Default `/about-us` |
| `aboutImage` | String | URL or `/uploads/...` path |
| `status` | `Active` \| `Inactive` | Default `Active` |

---

## About Us sync

When `useAboutUsContent` is `true`, public/admin **resolved** content is pulled from About Us CMS:

| Homepage field | About Us CMS source |
|----------------|---------------------|
| `sectionHeading` | Hero page heading + highlighted word |
| `shortDescription` | Hero description → homepage short description → story description |
| `aboutImage` | Hero image → homepage about image → story image |
| `features` | Homepage about features (if present) |
| `buttonText` | Homepage about button text |
| `buttonLink` | `/about-us` |

Custom stored fields remain in MongoDB but are not used for display until sync is disabled.

---

## Public

### `GET /api/homepage-about`

Returns resolved content for the storefront.

**Active example:**

```json
{
  "success": true,
  "message": "Homepage about section retrieved",
  "data": {
    "status": "Active",
    "useAboutUsContent": true,
    "sectionHeading": "Your Trusted International Supermarket & Food Corner in Hilversum",
    "shortDescription": "Founded in July 2022...",
    "features": [
      { "text": "Fresh fruits, vegetables, and quality meat", "order": 1 }
    ],
    "buttonText": "Learn More",
    "buttonLink": "/about-us",
    "aboutImage": "/uploads/homepage-about/example.jpg"
  }
}
```

**Inactive:** `{ "status": "Inactive" }` — frontend should hide the section.

---

## Admin (Bearer token required)

### `GET /api/homepage-about/admin`

Returns stored document plus `resolvedContent` preview.

### `PUT /api/homepage-about`

Update settings. When `useAboutUsContent` is `false`, validates:

- `sectionHeading`
- `shortDescription`
- `buttonText`
- `buttonLink`

**Response:**

```json
{
  "success": true,
  "message": "Homepage About Section updated successfully",
  "data": { ... }
}
```

### `POST /api/homepage-about/upload-image`

`multipart/form-data` field: `image`

- Types: jpg, jpeg, png, webp
- Max: 3MB
- Storage: `uploads/homepage-about/`

---

## Init

```bash
npm run db:homepage-about
```

Migrates from legacy `homepage_about_section` collection automatically on first API request if present.
