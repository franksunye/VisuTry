/**
 * VisuTry Analytics Event Registry v2
 *
 * Canonical business events. These names are stable contracts shared by:
 * - GA4
 * - dataLayer
 * - Campaign Intelligence
 * - future merchant / SDK analytics
 */

export const ANALYTICS_SCHEMA_VERSION = '2'

export const AnalyticsEvent = {
  CampaignLanded: 'campaign_landed',
  CampaignEngaged: 'campaign_engaged',

  FaceAnalysisStarted: 'face_analysis_started',
  FaceAnalysisPhotoUploaded: 'face_analysis_photo_uploaded',
  FaceAnalysisCompleted: 'face_analysis_completed',
  FaceAnalysisFailed: 'face_analysis_failed',

  FaceShapeDetectionStarted: 'face_shape_detection_started',
  FaceShapeDetectionCompleted: 'face_shape_detection_completed',
  FaceShapeDetectionFailed: 'face_shape_detection_failed',

  TryOnStarted: 'tryon_started',
  TryOnCompleted: 'tryon_completed',
  TryOnFailed: 'tryon_failed',

  RecommendationViewed: 'recommendation_viewed',
  ComparisonCreated: 'comparison_created',
  ComparisonCompleted: 'comparison_completed',
  FrameFavorited: 'frame_favorited',

  PurchaseIntentClicked: 'purchase_intent_clicked',
  StoreVisitRequested: 'store_visit_requested',
  LeadCreated: 'lead_created',
} as const

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent]

export type AnalyticsCommonContext = {
  analytics_schema_version: typeof ANALYTICS_SCHEMA_VERSION
  campaign_id?: string
  merchant_id?: string
  store_id?: string
  surface?: string
  entry_point?: string
}
