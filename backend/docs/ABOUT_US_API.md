# About Us CMS API

MongoDB singleton document managed by the `AboutUsCMS` Mongoose model (`aboutus` collection).

## Setup

```bash
cd backend
npm run db:about-us
npm run dev
```

## Environment

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/supermarket_db
```

## Schema (`AboutUsCMS`)

| Section | Fields |
|---------|--------|
| `homepageShortDescription` | String |
| `homepageAboutSection` | `{ buttonText, features[], image }` |
| `heroSection` | `{ eyebrowTag, pageHeading, highlightedWord, description, imageBadgeText, heroImage }` |
| `storySection` | `{ title, description, image }` |
| `missionVisionPromise` | `{ missionTitle, missionDescription, visionTitle, visionDescription, promiseTitle, promiseDescription }` |
| `whatWeOffer[]` | `{ categoryName, description, imageUrl, displayOrder, isActive }` |
| `statistics[]` | `{ value, suffix, label, displayOrder }` |
| `ownerDetails` | `{ ownerPhoto, ownerName, designation, phoneNumber, location, badgeText, ownerQuote }` |

## Endpoints

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/about-us` | Public | Full CMS (active offers only) |
| PUT | `/api/about-us` | Admin | Update entire CMS document |
| POST | `/api/about-us/upload/homepage-image` | Admin | Upload homepage about image |
| POST | `/api/about-us/upload/hero-image` | Admin | Upload hero image |
| POST | `/api/about-us/upload/story-image` | Admin | Upload story image |
| POST | `/api/about-us/upload/owner-photo` | Admin | Upload owner photo |
| GET | `/api/about-us/offers` | Public | List all offers |
| POST | `/api/about-us/offers` | Admin | Create offer |
| PUT | `/api/about-us/offers/reorder` | Admin | Reorder offers |
| PUT | `/api/about-us/offers/:id` | Admin | Update offer |
| DELETE | `/api/about-us/offers/:id` | Admin | Delete offer |
| GET | `/api/about-us/statistics` | Public | List statistics |
| POST | `/api/about-us/statistics` | Admin | Create statistic |
| PUT | `/api/about-us/statistics/:id` | Admin | Update statistic |
| DELETE | `/api/about-us/statistics/:id` | Admin | Delete statistic |

## Image Upload (Multer)

- Field name: `image`
- Max size: **3MB**
- Allowed: jpg, jpeg, png, webp
- Stored under: `src/uploads/about/`
- Public URL: `/uploads/about/<filename>`

## Validation (PUT `/api/about-us`)

Required:

- `homepageShortDescription`
- `heroSection.pageHeading`
- `storySection.title`
- `missionVisionPromise.missionTitle`
- `missionVisionPromise.visionTitle`
- `ownerDetails.ownerName`
- At least one `whatWeOffer` item
- At least one `statistics` item

## Example GET `/api/about-us`

```json
{
  "success": true,
  "message": "About Us CMS retrieved successfully",
  "data": {
    "homepageShortDescription": "Since opening in July 2022...",
    "homepageAboutSection": {
      "buttonText": "Learn More",
      "features": ["Fresh fruits, vegetables, and quality meat"],
      "image": "/uploads/about/1710000000000-123.jpg"
    },
    "heroSection": {
      "eyebrowTag": "ABOUT WINS WERELD WINKEL",
      "pageHeading": "Your Trusted International Supermarket & Food Corner in",
      "highlightedWord": "Hilversum",
      "description": "Founded in July 2022...",
      "imageBadgeText": "Serving Hilversum since 2022",
      "heroImage": "/uploads/about/1710000000001-456.jpg"
    },
    "storySection": {
      "title": "Our Story",
      "description": "Established on 01 July 2022...",
      "image": "/uploads/about/1710000000002-789.jpg"
    },
    "missionVisionPromise": {
      "missionTitle": "Our Mission",
      "missionDescription": "High-quality products...",
      "visionTitle": "Our Vision",
      "visionDescription": "To become the most trusted...",
      "promiseTitle": "Our Promise",
      "promiseDescription": "Fresh quality, fair prices..."
    },
    "whatWeOffer": [
      {
        "id": "665a1b2c3d4e5f6789012345",
        "categoryName": "Fresh Vegetables & Fruits",
        "description": "Daily fresh produce for every meal.",
        "imageUrl": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c",
        "displayOrder": 1,
        "isActive": true
      }
    ],
    "statistics": [
      {
        "id": "665a1b2c3d4e5f6789012346",
        "value": 15,
        "suffix": "K+",
        "label": "Happy Customers",
        "displayOrder": 1
      }
    ],
    "ownerDetails": {
      "ownerPhoto": "/uploads/about/1710000000003-owner.jpg",
      "ownerName": "Raguparan Murugamoorthy",
      "designation": "Founder & Owner",
      "phoneNumber": "+31659046526",
      "location": "Leeuwenstraat 36, 1211ev, Hilversum",
      "badgeText": "Since 2022",
      "ownerQuote": "Our goal is to provide quality products..."
    }
  }
}
```

## Example PUT `/api/about-us`

**Request** (`Content-Type: application/json`):

```json
{
  "homepageShortDescription": "Updated homepage summary",
  "heroSection": {
    "pageHeading": "Your Trusted Supermarket in Hilversum"
  },
  "storySection": {
    "title": "Our Story"
  },
  "missionVisionPromise": {
    "missionTitle": "Our Mission",
    "visionTitle": "Our Vision"
  },
  "ownerDetails": {
    "ownerName": "Raguparan Murugamoorthy"
  },
  "whatWeOffer": [
    {
      "id": "665a1b2c3d4e5f6789012345",
      "categoryName": "Fresh Vegetables & Fruits",
      "description": "Daily fresh produce.",
      "imageUrl": "",
      "displayOrder": 1,
      "isActive": true
    }
  ],
  "statistics": [
    {
      "id": "665a1b2c3d4e5f6789012346",
      "value": 15,
      "suffix": "K+",
      "label": "Happy Customers",
      "displayOrder": 1
    }
  ]
}
```

**Response**:

```json
{
  "success": true,
  "message": "About Us CMS updated successfully",
  "data": { }
}
```

## Example POST `/api/about-us/upload/hero-image`

**Request** (`multipart/form-data`):

- `image`: image file

**Response**:

```json
{
  "success": true,
  "message": "Hero image uploaded successfully",
  "data": {
    "imageUrl": "/uploads/about/1710000000001-456.jpg",
    "cms": { }
  }
}
```

## Example POST `/api/about-us/offers`

```json
{
  "categoryName": "International Groceries",
  "description": "Products from cultures worldwide.",
  "imageUrl": "https://example.com/image.jpg",
  "displayOrder": 2,
  "isActive": true
}
```

## Example PUT `/api/about-us/offers/reorder`

```json
{
  "orders": [
    { "id": "665a1b2c3d4e5f6789012345", "displayOrder": 1 },
    { "id": "665a1b2c3d4e5f6789012346", "displayOrder": 2 }
  ]
}
```

## Example POST `/api/about-us/statistics`

```json
{
  "value": 500,
  "suffix": "+",
  "label": "Products",
  "displayOrder": 2
}
```

## Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "heroSection.pageHeading", "message": "Page heading is required" }
  ]
}
```
