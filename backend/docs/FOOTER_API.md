# Footer CMS API (MongoDB)

MongoDB singleton document managed by the `FooterCMS` model (`footers` collection).

The customer frontend reads footer data exclusively from `/api/footer/settings` (not legacy CMS settings).

## Setup

```bash
cd backend
npm run db:footer
npm run dev
```

## Mongoose Schema (`FooterCMS`)

| Field | Type |
|-------|------|
| brand | `{ logo, description }` |
| socialLinks | `{ facebook, instagram, whatsapp, tiktok, youtube }` |
| quickLinks[] | `{ label, url, show, order }` |
| legalLinks[] | `{ label, url, show, order }` |
| businessHours | `{ supermarket, foodCorner, specialNote }` |
| contact | `{ address, phone, email }` |
| businessHoursTitle, supermarketLabel, foodCornerLabel, contactTitle, copyrightName | String |

## Endpoints

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/footer/settings` | Public (visible links) |
| GET | `/api/footer/settings?full=true` | Public (all links) |
| PUT | `/api/footer/settings` | Admin |
| POST | `/api/footer/upload-logo` | Admin (multipart `footer_logo`) |
| DELETE | `/api/footer/logo` | Admin |
| CRUD | `/api/footer/quick-links` | Admin |
| CRUD | `/api/footer/legal-links` | Admin |

Footer category links are **not** stored in Footer CMS. The website footer loads up to 7 active categories from the Product Categories module (`GET /api/categories`).

## Logo Upload

- Folder: `src/uploads/footer/`
- Max: 2MB (jpg, jpeg, png, webp, svg)
- Stored path example: `/uploads/footer/1710000000.png`

## Example GET `/api/footer/settings`

```json
{
  "success": true,
  "data": {
    "settings": {
      "footerLogo": "/logo.png",
      "footerDescription": "...",
      "phoneNumber": "0760866795"
    },
    "quickLinks": [
      { "id": "665a...", "label": "Home", "url": "/", "displayOrder": 1, "isVisible": true }
    ],
    "legalLinks": []
  }
}
```

## Home CMS (separate collection)

Homepage branding, features, about snippet, and food-corner promo are stored in `HomeCMS` (`cms` collection):

| Method | Route |
|--------|-------|
| GET | `/api/cms/settings` |
| PUT | `/api/cms/settings` |

## FAQ Reorder

| Method | Route | Body |
|--------|-------|------|
| PUT | `/api/faqs/reorder` | `[{ "id": "...", "order": 1 }]` |
