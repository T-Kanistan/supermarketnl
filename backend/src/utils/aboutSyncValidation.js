import {
  validateOwnerPhone,
  validateOwnerSinceYear,
  validateOwnerName,
  validateOwnerDesignation,
  validateOwnerQuote,
  validateOwnerAddress,
  validateOwnerExperienceText,
  validateOwnerBadgeText,
  validateOwnerPhoto,
} from './aboutOwnerValidation.js';

const TITLE_REQUIRED = 'Title is required.';
const DESCRIPTION_REQUIRED = 'Description is required.';
const FIELDS_REQUIRED = 'Please fill in all required fields.';

const trim = (value) => String(value ?? '').trim();

const resolveFieldErrors = (failures) => {
  if (!failures.length) return null;
  if (failures.length > 1) return FIELDS_REQUIRED;
  if (failures[0] === 'title') return TITLE_REQUIRED;
  if (failures[0] === 'description') return DESCRIPTION_REQUIRED;
  return FIELDS_REQUIRED;
};

const collectFailures = (checks) =>
  checks.filter((check) => !check.ok).map((check) => check.kind);

const requireText = (value, kind) => ({ ok: trim(value), kind });

export const validateAboutSyncPayload = (payload = {}) => {
  const failures = [];

  const intro = payload.introduction || {};
  failures.push(
    ...collectFailures([
      requireText(intro.badge_text, 'subtitle'),
      requireText(intro.main_heading, 'title'),
      requireText(intro.highlight_heading, 'subtitle'),
      requireText(intro.description_1, 'description'),
      requireText(intro.image, 'image'),
    ])
  );

  const story = payload.story || {};
  failures.push(
    ...collectFailures([
      requireText(story.title, 'title'),
      requireText(story.description, 'description'),
      requireText(story.image, 'image'),
    ])
  );

  const owner = payload.owner || {};
  const ownerChecks = [
    validateOwnerName(owner.owner_name),
    validateOwnerDesignation(owner.designation),
    validateOwnerQuote(owner.quote),
    validateOwnerPhone(owner.phone),
    validateOwnerAddress(owner.address),
    validateOwnerSinceYear(owner.since_year),
    validateOwnerExperienceText(owner.experience_text),
    validateOwnerBadgeText(owner.badge_text),
    validateOwnerPhoto(owner.profile_photo),
  ];
  const ownerError = ownerChecks.find((check) => !check.valid);
  if (ownerError) return ownerError.error;

  (payload.storyTimeline || []).forEach((item) => {
    failures.push(
      ...collectFailures([
        requireText(item.subtitle || item.marker, 'subtitle'),
        requireText(item.title, 'title'),
        requireText(item.description, 'description'),
      ])
    );
  });

  (payload.values || []).forEach((item) => {
    failures.push(
      ...collectFailures([
        requireText(item.title, 'title'),
        requireText(item.description, 'description'),
      ])
    );
  });

  (payload.offers || []).forEach((item) => {
    failures.push(
      ...collectFailures([
        requireText(item.title, 'title'),
        requireText(item.description, 'description'),
        requireText(item.image, 'image'),
      ])
    );
  });

  (payload.statistics || []).forEach((item) => {
    failures.push(
      ...collectFailures([
        requireText(item.title || item.label, 'title'),
        {
          ok:
            item.value !== '' &&
            item.value !== null &&
            item.value !== undefined &&
            !Number.isNaN(Number(item.value)),
          kind: 'value',
        },
      ])
    );
  });

  return resolveFieldErrors(failures);
};
