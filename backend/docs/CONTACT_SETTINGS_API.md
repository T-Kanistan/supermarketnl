# Contact Settings CMS API (MongoDB)

MongoDB singleton document managed by the `ContactCMS` model (`contactsettings` collection).

## Setup

```bash
cd backend
npm run db:contact-settings
npm run dev
```

## Environment

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/supermarket_db
```

## Mongoose Schema (`ContactCMS`)

| Field | Type |
|-------|------|
| phoneNumber, phoneSubtext | String |
| email, emailSubtext | String |
| storeName, address | String |
| supermarketHours, foodCornerHours, holidayNote | String |
| heroSection | `{ heroBadge, heroTitle, heroSubtitle, heroFeature1-3 }` |
| contactFormSettings | Form labels/placeholders |
| helpBox | `{ helpBoxTitle, helpBoxSubtitle }` |
| googleMapUrl | String |

## Endpoints

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/contact-settings` | Public |
| PUT | `/api/contact-settings` | Admin |

## Example GET Response

```json
{
  "success": true,
  "data": {
    "phoneNumber": "+31659046526",
    "emailAddress": "info@winswereldwinkel.nl",
    "storeName": "Ins Wereld Winkel",
    "storeAddress": "Amsterdam, Netherlands",
    "heroTitle": "CONTACT US",
    "googleMapsEmbedUrl": "https://www.google.com/maps/embed?pb=..."
  }
}
```

## Contact Form Enquiries

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/enquiries` | Public (rate limited) |
| GET | `/api/enquiries` | Admin |
| PUT | `/api/enquiries/:id/read` | Admin |
| DELETE | `/api/enquiries/:id` | Admin |

Legacy alias (still supported):

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/cms/messages` | Public (rate limited) |
| GET | `/api/cms/messages` | Admin |

`GET /api/contact-settings` also returns social link URLs from the footer CMS (`facebookUrl`, `instagramUrl`, etc.) and `infoCardTitle` / `infoCardSubtitle`.
