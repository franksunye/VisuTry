# Axiom Schema P0 Containment — 2026-09-04

## Status

P0 containment is implemented in the application logger. This change is intentionally limited to preventing uncontrolled production Axiom field growth while preserving the existing Traffic Ready / Discovery Canary observation contract.

- Baseline SHA: `065b72ede70253ec6991514e12b21b585a7fd564`
- Implementation SHA: `9017c9bf7bdd14b905efca0b5a13d372fa5c37a9`
- Production dataset: `visutry-pro`
- Axiom mutation: none
- P1 Commerce dataset split: deferred

## Previous condition

The 2026-09-04 inventory recorded `visutry-pro` at 257 fields with 0 remaining capacity. 243 fields were flattened `data.*` fields. The primary producer was `src/lib/logger.ts`, where `data?: any` and arbitrary object/context forwarding allowed Axiom to flatten provider responses, diagnostics, and object-spread payloads into new columns. Historical fields remain untouched.

## Containment design

`src/lib/logger.ts` now:

1. accepts log payloads as `unknown`, not `any`;
2. keeps only an explicit bounded canonical data-field allowlist;
3. permits nested values only under named diagnostic/file/metadata/email families with explicit subkeys;
4. rejects arbitrary objects, provider/raw-response payloads, object-spread keys, cyclic values, and object arrays;
5. bounds strings to 512 characters, arrays to 20 primitive items, and objects to 64 accepted keys;
6. copies only fixed request-context envelope fields;
7. serializes the same bounded record again at the Axiom transport boundary;
8. preserves the existing `data.<field>` names used by `report:agent-distribution`, including Consumer funnel fields.

No report exclusion logic, TEST classification, Reference/Internal semantics, dataset settings, retention, vacuum, schema-lock, or historical data was changed.

## Final bounded Axiom schema

The transport has a maximum of **247 flattened canonical keys**. `error.stack` is an explicit optional key in the contract, but production-created errors omit stack traces; the transport still uses the same fixed envelope. Axiom system fields such as `_time` and `_sysTime` are not application-emitted keys and are not counted below.

```text
accept_language
category
data.aborted
data.access
data.accessMode
data.acquisition_medium
data.acquisition_source
data.active
data.agent_source
data.amount
data.analytics_schema_version
data.apiTime
data.assets.blockedScanned
data.assets.deleted
data.assets.failed
data.assets.scanned
data.attempt
data.attemptNumber
data.baseUrl
data.batchId
data.batchIndex
data.browser_language
data.browser_languages
data.bufferSize
data.campaign
data.campaign_id
data.campaign_name
data.candidateCount
data.category
data.checkoutContext
data.checkout_locale
data.clientSubmissionId
data.code
data.completionTimeMs
data.completion_status
data.connectionTimeout
data.consumer_funnel_id
data.contentLength
data.contentType
data.content_cluster
data.created
data.createdAt
data.currentStatus
data.customerId
data.destination
data.detail
data.detectedShape
data.deviceType
data.diagnostics.bitmapDecodeErrorMessage
data.diagnostics.bitmapDecodeErrorName
data.diagnostics.code
data.diagnostics.compressionErrorMessage
data.diagnostics.compressionErrorName
data.diagnostics.compressionFailed
data.diagnostics.cpuRuntimeErrorMessage
data.diagnostics.cpuRuntimeErrorName
data.diagnostics.detectedFileFormat
data.diagnostics.detectorFileSize
data.diagnostics.detectorFileType
data.diagnostics.failureReason
data.diagnostics.message
data.diagnostics.rawStatus
data.diagnostics.sourceFileSize
data.diagnostics.sourceFileType
data.duration
data.durationMs
data.emailId
data.endpoint
data.entry_point
data.error
data.errorMessage
data.errorName
data.errorType
data.eventCreated
data.event_id
data.event_name
data.experienceId
data.externalTaskId
data.failCount
data.failureReason
data.fetchedPageCount
data.fileName
data.fileSize
data.finalUrl
data.framePresetId
data.frame_category
data.geo_country
data.geo_region
data.geometryQuality
data.geometryStatus
data.hasCallbackUrl
data.hasContent
data.hasData
data.hasError
data.hasId
data.hasImageUrl
data.hasMetadata
data.hasResultImage
data.httpStatus
data.httpStatusText
data.imageSize
data.imageTransport
data.inlineImageKb
data.intentId
data.isAsync
data.isNewCompletion
data.isNewUser
data.isPremium
data.isSameMetadata
data.isSameObject
data.itemFile.name
data.itemFile.size
data.itemFile.type
data.itemImage.name
data.itemImage.size
data.itemImage.type
data.itemImageFingerprint
data.itemImageName
data.itemImageSize
data.itemSha256
data.itemUrl
data.landing_locale
data.landing_page
data.landing_surface
data.lastModified
data.locale
data.locale_changed
data.markedFailed
data.maxRetries
data.merchantFrameId
data.merchantId
data.merchantSessionId
data.merchantSlug
data.message
data.metadata.clientSubmissionId
data.metadata.code
data.metadata.isAsync
data.metadata.message
data.metadata.name
data.metadata.providerId
data.metadata.retryCount
data.metadata.serviceType
data.method
data.model
data.msg
data.normalizedStatus
data.origin
data.orphans.deleted
data.orphans.failed
data.orphans.scanned
data.page_path
data.path
data.pathname
data.paymentStatus
data.photoAssetId
data.planCode
data.platforms
data.pollDuration
data.presetCount
data.presetId
data.presetIds
data.pricing_locale
data.productType
data.product_path
data.progress
data.provider
data.providerId
data.providerTaskId
data.query_cluster
data.quotaSource
data.rawStatus
data.recommendation_count
data.referrer_host
data.remaining
data.remainingCredits
data.reportUnlocked
data.requiredCredits
data.responseTime
data.resultStatus
data.retryCount
data.retryable
data.role
data.route
data.sameContentSha256
data.sameFileName
data.sameFileSize
data.sameMetadata
data.sameObjectReference
data.scanned
data.site_locale
data.skipped
data.source
data.sourceAccess
data.sourceBlobAccess
data.sourceHostnames
data.source_class
data.source_page
data.status
data.statusChanged
data.storeId
data.subscriptionId
data.success
data.successful
data.surface
data.syncReason
data.taskId
data.taskUserId
data.textResponse
data.threeDayEmails.failed
data.threeDayEmails.sent
data.timeoutMs
data.total
data.totalDuration
data.totalTime
data.traffic_class
data.tryOnType
data.twentyFourHourEmails.failed
data.twentyFourHourEmails.sent
data.type
data.updatedAt
data.uploadTarget
data.usagePolicyKind
data.usageSettled
data.userFile.name
data.userFile.size
data.userFile.type
data.userId
data.userImage.name
data.userImage.size
data.userImage.type
data.userIntent
data.userSha256
data.user_intent
data.vercel
error.message
error.name
error.stack
id
ip
level
message
method
sessionId
timestamp
url
userAgent
userId
```

The machine-readable source of this set is `AXIOM_SERIALIZED_KEY_ALLOWLIST` in `src/lib/logger.ts`.

## Privacy and sensitive-data policy

The containment boundary does not serialize raw photos, biometric geometry, secrets, tokens, payment secrets, arbitrary request bodies, provider responses, or unbounded free text. Error output is normalized; production stack traces are omitted. Existing historical Axiom data is not deleted or rewritten by this change.

## Report compatibility

The canonical Consumer fields remain under their existing flattened names (`data.traffic_class`, `data.consumer_funnel_id`, `data.source_class`, `data.agent_source`, `data.event_name`, and attribution fields). The report continues to use `column_ifexists` and therefore reads historical legacy dotted rows and new bounded rows through the same projection. The compatibility test proves a TEST row remains excluded, a production candidate remains counted once, and decision actions are not double counted.

## Validation

- Schema contract test: PASS; final serialized keys are checked against the explicit allowlist and dynamic nested keys are rejected.
- Report compatibility / Agent Distribution tests: PASS.
- Consumer funnel route tests: PASS.
- Typecheck: PASS.
- Lint: PASS with pre-existing repository warnings only.
- Unit suite: PASS under isolated test URL environment (235 suites, 1454 tests).
- Critical suite: PASS (7 suites, 34 tests).
- Production build: PASS.
- `git diff --check`: PASS.

## Deferred / unchanged

- No Axiom dataset mutation was performed.
- No historical field cleanup, trim, vacuum, or schema-lock was performed.
- P1 `visutry-commerce-pro` dataset split remains deferred.
- Traffic Ready and Discovery Canary observation clocks remain unchanged.
